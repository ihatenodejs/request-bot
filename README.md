# request-bot
A Telegram bot which takes requests for modules.lol

# Setting up and self hosting
1. **Install dependancies**

   ```bash
   bun install
   ```
   **OR**
   ```bash
   npm install
   ```

2. **Change variables**
   
   Copy `.env.example` to `.env` and open the file in a text editor.
   
   Replace `ADMIN_ID` with your Telegram user ID. This will be used for admin-only commands.

   Replace `BOT_TOKEN` with your Telegram bot token you created through @BotFather

3. **Start the bot**
   
   ```bash
   bun index.js
   ```
   **OR**
   ```bash
   node index.js
   ```