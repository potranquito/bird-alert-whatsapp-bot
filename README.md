# bird-alert-whatsapp-bot

A WhatsApp bot that sends notable bird sightings from the [eBird API](https://documenter.getpostman.com/view/664302/S1ENwy59) to your WhatsApp group, based on a group-defined location.

This tool is designed for birding communities who want real-time alerts about rare or unusual birds in their area.

**Note:** This bot currently runs locally using your personal WhatsApp account (via QR scan). It is not cloud-hosted yet.

---

## Quick Start

```bash
git clone https://github.com/potranquito/bird-alert-whatsapp-bot.git
cd bird-alert-whatsapp-bot
npm install
cp .env.example .env # Edit .env and add your eBird API key
node index.js

You’ll be prompted to scan a QR code using WhatsApp on your phone:
Go to WhatsApp → Settings → Linked Devices → Link a Device

**WhatsApp Commands**
Command	Description
/setlocation City	Set the group location for bird alerts
/groupstatus	Show current group settings (name, location, lat/lng)

Each WhatsApp group can configure its own location using /setlocation.

**How it works**

1. Groups send /setlocation City to set the region for alerts.
2  The bot geocodes the location using OpenStreetMap Nominatim.
3. It checks for notable bird sightings near that location every hour.
4. Each group receives only new sightings (no repeated posts).
5. Messages include the bird name, location, and sighting date.

**Environment Variables**
Create a .env file in the root directory with the following:

EBIRD_API_KEY=your_ebird_api_key_here

You can request a free API key from the eBird API documentation.

**Project Structure**
File	Purpose
index.js	Main bot logic
config.js	Configuration (polling frequency, distance, etc.)
.env.example	Example of environment variable setup
storage.json	Local cache of group settings and seen sightings

.gitignore
Your .gitignore file should contain:

node_modules/
.env
storage.json
.wwebjs_cache/

**Roadmap Ideas**
Cloud-hosted version (Render, Railway, or Fly.io)
Admin dashboard to manage group settings
Bird audio/images via xeno-canto or Wikimedia
Advanced filters (e.g., waterfowl only, lifers only)

## Author

Made by William Henderson  
GitHub: [@potranquito](https://github.com/potranquito)  
Project Repo: [bird-alert-whatsapp-bot](https://github.com/potranquito/bird-alert-whatsapp-bot)
