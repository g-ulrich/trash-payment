// discord.js
require('dotenv').config(); // Load environment variables
const axios = require('axios');

class Discord {
    constructor() {
        this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;

        if (!this.webhookUrl || !this.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
            throw new Error('Invalid or missing DISCORD_WEBHOOK_URL in .env file.');
        }
    }

    async sendMessage(content, username = 'Bot', avatarUrl = null) {
        if (!content || typeof content !== 'string') {
            throw new Error('Message content must be a non-empty string.');
        }

        const payload = {
            content,
            username,
            ...(avatarUrl && { avatar_url: avatarUrl })
        };

        try {
            const response = await axios.post(this.webhookUrl, payload);
            return response.data;
        } catch (error) {
            console.error('Failed to send message to Discord:', error.message);
            throw error;
        }
    }
}

module.exports = {
    Discord
};
