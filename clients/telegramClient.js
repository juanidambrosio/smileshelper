const axios = require("axios");

const client = axios.create({
    baseURL: `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}`
});

const removePreviousMessages = async () => {
    const { data: { result } } = await client.get('/getUpdates')
    if (!result?.length) return;

    return await client.get(`/getUpdates?offset=${result[result.length - 1].update_id + 1}`);
}

module.exports = {
    removePreviousMessages
}