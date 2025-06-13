const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const dotenv = require('dotenv');
const cron = require('node-cron');
const fs = require('fs');
const config = require('./config');

dotenv.config();

const EBIRD_API_KEY = process.env.EBIRD_API_KEY;
const STORAGE_FILE = './storage.json';
const client = new Client();
let groupSettings = loadStorage();

function loadStorage() {
  if (!fs.existsSync(STORAGE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STORAGE_FILE));
}

function saveStorage() {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(groupSettings, null, 2));
}

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready.');
});

client.on('message', async msg => {
  const chat = await msg.getChat();                         // ✅ First define chat
  const text = msg.body.trim().toLowerCase();               // ✅ Then define text

  console.log(`📥 Received: ${text} from ${chat.name}`);    // ✅ Now it's safe

  if (!chat.isGroup) return;

  const groupId = chat.id._serialized;

  if (text.startsWith('/setlocation')) {
    const location = text.replace('/setlocation', '').trim();
    const coords = await getCoordinatesFromLocation(location);
    if (!coords) {
      msg.reply(`❌ Couldn't find location "${location}". Try again.`);
      return;
    }

    groupSettings[groupId] = {
      name: chat.name,
      location,
      lat: coords.lat,
      lng: coords.lng,
      distance: config.defaultDistance
    };
    saveStorage();

    msg.reply(`📍 Location set to *${location}* (within ${config.defaultDistance}km).`);
  }

  if (text === '/groupstatus') {
    const group = groupSettings[groupId];
    if (group) {
      msg.reply(`✅ Group: *${group.name}*\nLocation: *${group.location}*\nLat/Lng: ${group.lat}, ${group.lng}`);
    } else {
      msg.reply("ℹ️ This group hasn't set a location yet. Use `/setlocation Las Vegas` to get started.");
    }
  }
});

async function getCoordinatesFromLocation(place) {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${place}, USA`,  // Helps avoid wrong-country results
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'bird-alert-bot/1.0 (youremail@domain.com)'  // Must include your email or domain
      }
    });
    if (!res.data.length) return null;
    return {
      lat: parseFloat(res.data[0].lat),
      lng: parseFloat(res.data[0].lon)
    };
  } catch (err) {
    console.error('Geocoding failed:', err.message);
    return null;
  }
}


cron.schedule(`*/${config.pollingIntervalMinutes} * * * *`, async () => {
  console.log('🔁 Checking for notable bird sightings...');
  for (const groupId in groupSettings) {
    const g = groupSettings[groupId];
    try {
      const res = await axios.get(`https://api.ebird.org/v2/data/obs/geo/recent/notable`, {
        params: {
          lat: g.lat,
          lng: g.lng,
          dist: g.distance,
        },
        headers: { 'X-eBirdApiToken': EBIRD_API_KEY }
      });

      if (res.data.length === 0) continue;

      const seenIds = g.seenBirds || [];  // Track seen birds per group
      const newSightings = res.data.filter(bird => {
        const id = `${bird.speciesCode}-${bird.obsDt}`;
        return !seenIds.includes(id);
      });

      if (newSightings.length === 0) continue; // Nothing new to report

        // Save the latest sightings (limit memory use by keeping only recent 100)
      const updatedSeen = [
        ...newSightings.map(b => `${b.speciesCode}-${b.obsDt}`),
        ...seenIds
      ].slice(0, 100);
      groupSettings[groupId].seenBirds = updatedSeen;
      saveStorage();

      // Build and send the message
      const birdsToShow = newSightings.slice(0, 3); // just top 3 new ones
      const message = `🦉 *New Notable Birds near ${g.location}*\n\n` +
         birdsToShow.map(b => `• ${b.comName} at ${b.locName} on ${b.obsDt}`).join('\n');

      const chat = await client.getChatById(groupId);
      await chat.sendMessage(message);
    } catch (err) {
      console.error(`Failed for group ${g.name}:`, err.message);
    }
  }
});

client.initialize();
