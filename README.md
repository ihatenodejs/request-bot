# request-bot

[![Build and Push Docker Image](https://github.com/ihatenodejs/request-bot/actions/workflows/docker.yml/badge.svg)](https://github.com/ihatenodejs/request-bot/actions/workflows/docker.yml)
[![Bump Dependencies](https://github.com/ihatenodejs/request-bot/actions/workflows/bump.yml/badge.svg)](https://github.com/ihatenodejs/request-bot/actions/workflows/bump.yml)

A Telegram bot which takes requests for modules.lol

## Setting up and self-hosting

### Using Docker

1. **Fetch needed files**

   Pick your preferred option to get the files needed for Docker. Either option is fine, although Git is arguably the best option.

   **Option One:** Clone Git Repo

   ```bash
   git clone https://git.pontusmail.org/aidan/request-bot.git
   ```

   **Option Two:** Download only needed files

   ```bash
   wget https://git.pontusmail.org/aidan/request-bot/raw/branch/main/docker-compose.yml
   wget https://git.pontusmail.org/aidan/request-bot/src/branch/main/.env.example
   ```

   You may have to install `wget`, or you could use `curl` instead.

2. **Change variables**

   Copy `.env.example` to `.env` and open the file in a text editor:

   ```bash
   cp .env.example .env # Copy .env file
   nano .env # Open in nano (or vim, if you prefer)
   ```

   Replace `ADMIN_ID` with your Telegram user ID. This will be used for admin-only commands.

   Replace `BOT_TOKEN` with your Telegram bot token you created through @BotFather

3. **Bring up the containers**

   ```bash
   docker compose up -d
   ```

   Please note: `sudo` may be required.

   You may customize the container with the included `docker-compose.yml` file if needed.

### Using Node

1. **Clone repository**

   ```bash
   git clone https://git.pontusmail.org/aidan/request-bot.git
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

   **OR**

   ```bash
   npm install
   ```

3. **Change variables**

   Copy `.env.example` to `.env` and open the file in a text editor.

   Replace `ADMIN_ID` with your Telegram user ID. This will be used for admin-only commands.

   Replace `BOT_TOKEN` with your Telegram bot token you created through @BotFather

4. **Start the bot**

   ```bash
   bun index.js
   ```

   **OR**

   ```bash
   node index.js
   ```
