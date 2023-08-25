const {TwitterApi, ApiResponseError} = require("twitter-api-v2");

const dotenv = require("dotenv");
dotenv.config();

const maxResults = process.env.MAX_RESULTS || 10;

const smiles = {
    authorizationToken: [
        'AHspTPDZ5YPWlYKNjD73SYe2QdsSD1E9IMibwMNwUM16V0Gjo2tEx9',
        'NM4SvkQQRy4xyfCDOPfHbID1bmLPQo8BMRUmVLpjGLveqKqhUJxRgL',
        'xCSiLD1cMabeT3x1wzpgQdu05RsR1G32PIM6ijmbMh8lleM7TJ2GMS',
        'FFwHJtP8PqHmvLoNFM22tXajnsgrk9LsXJf79Vb8dY5nE1cryDhaG6',
        'JgKkltHgHCcscGqW5C54Yhje0OiYmLkVJMbtu5gkHKd8XYZ2OZWLBs',
        'P2IEmkORj8HQMOba0fRikZmSSwTcBIrjqUQWqDwBz70FVBhUQ53A6d',
        '5LGskr24z4WToqcmVNLSJSiNyLAeEcNwYh4dyg1xH7geKp8zUqJL39',
        'sPnkZUWia8CNvmcaoi3QWiKn1iV5IrVh5aFfBckV07rT6Kmirkg4an',
        'dXqxIJquj4Yn532UiGsd4XvItoYiQnE4AVRtpcTycHuIsz8Eq0pKk6',
        '9gViSTvFAV6wUmMWKC5pvevkcyTmBjDnm0Is7aNR3qkwbMIAOabPVD',
        'XC9Fcb7X0l1BRxT0JpySznc41OxfmiB8haCvz7ekWOIqAsllP9cu7C',
        'sYVVTWocMjq67TDu878g2Ja1iKN8849tCy1a47BYgg8Miji4x5TMCs',
        'iQ2kjP9Svz410770qnoJlC9I4F4RmeVhn76ve01dT7pSRuyCR9Ljd4',
        'Hp6RGnUjN4I0z4vjpJnYXZs21Fxk1QbQqqzoyQHk74u1zgeQWsazqS',
        'YC0YTTfBwgnfXwvExsLGKhhXlF8FcKl2m0ZtgaYT726RGD7eMDBQ44',
        'gxioypU5oyRmP3l31bAIcGt3D5K42hwo0DAt3mkaDZItJItzkWPmAX',
        'thGvjCcMKg0y8rFNjrC66Xq7OGWSKGzAslMP9Hm3usr880A3Ky1GGf',
        'R7z04v9R2G8j7MNwkGiP15AuRnX0zttx5HpAfRVv2MbZS21b7lYilm',
        'uRIoTrH7RC5eIbqzvncgMKZ85f6lfv5ZwZE3LgPjJidD56z47LgNjj',
        'qX9wt9m1TKo2NgoFF4GRVqHtIXvd6Agmk9X2WNDRzM59odUt9C44M',
        'k5NkD6gW8W7D6RaP2Te7E8kMDWUdTxY1nmc4ss1SjDz2Z6aJ0eOuon',
        'UPkMfI7rGpsY8Z3gVqXL3jjDjN9ujW7bMSfaNTkJngXkaAirY3r2kd',
        'H4LHJkldAm3WpObxiWWokhWYUJDIyUR5ckgK23fQscMXPc3UAIvmB',
        'ndcrR1b9t8L85ePxBGMCYL23vjeZ5d7VVRPTbR0EFtoUxxiFta3kBL',
        'v83j0YfS3j4nwGRgFPdyhMPlbYsC77L3yt6Z3VH2Y6Ao5oP8TWiKRo',
        'HDOZ2I0YrQQx5YiYnP771761l82HjMRXOhdElFfX1NQX0UmEiftncY',
        'He65AirN944J1fCK4g4FWah26Hx2XSEny3U1oVovly0bW4amAaG1mN',
        'nR7250iPHMfQNRLfkAZRbk57ohQjq7dLjzaPjBkphiTrj9rvr8m1On',
        'IHCzIy3zPEWEdZrD87THM9c00bW2hqx73WJv7EvFyReAXvI6gESC6Z',
        'ZUHvO5ONyp9tHUh18q1K4MSGaxJG4zsq3QoAiTijEMJo6TAgPorIKx',
        'uBjy1Vo8PbHBEeR0JW4Q9keo7IeizsLy1C2jW9RPixLsgBWx7UWQ9R',
        'YC0YTTfBwgnfXwvExsLGKhhXlF8FcKl2m0ZtgaYT726RGD7eMDBQ44',
        'uRIoTrH7RC5eIbqzvncgMKZ85f6lfv5ZwZE3LgPjJidD56z47LgNjj',
        'thGvjCcMKg0y8rFNjrC66Xq7OGWSKGzAslMP9Hm3usr880A3Ky1GGf',
        'wzVttlloEP4jqzvNxG7ENet2aZ9aDUGFhGF2TguwoxERp6Vc31aIhb',
        '1nhac9PB61CqW0H7ciqLvCPZuf6VAHrSqUrW6tbYQiTJGR233GGnCh',
        'gxioypU5oyRmP3l31bAIcGt3D5K42hwo0DAt3mkaDZItJItzkWPmAX',
        '4SgnW4kukFthDE3Gp4I9CTzpYVwMC6Cefls8w59FXLHYb3MIygeb3l',
        'UoOU8imcyNwZrWpAVzXRymcN1t4WIvHCno2aCr998vTDpZ3dvrr1x9',
        'hR6UNp1dBruBuw7GqQvTr6Y8VP2HPlDqqdl4a4X9CagMYMeWbxRI85',
        'qX9wt9m1TKo2NgoFF4GRVqHtIXvd6Agmk9X2WNDRzM59odUt9C44M',
        'k5NkD6gW8W7D6RaP2Te7E8kMDWUdTxY1nmc4ss1SjDz2Z6aJ0eOuon',
        'CQHpsNkK6HvDM4T2fFexgzvuXcNCqCWm8e9YXHzbSMfofvu6kBQId9',
        'wu0XrIuET9fHfUlhianEvTsWrrqKQG1NUliFbpvYPTYe7Q7lJBmfh3',
    ],
    apiKey: process.env.SMILES_API_KEY || 'aJqPU7xNHl9qN3NVZnPaJ208aPo2Bh2p2ZV844tw',
    milePrice: process.env.SMILES_MILE_PRICE,
};

const responseTweetUrl = process.env.RESPONSE_TWEET_URL;

const twitterClient = process.env.TWITTER_API_KEY && new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_KEY_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
}).v2;

const telegramApiToken = process.env.TELEGRAM_API_TOKEN

module.exports = {
    maxResults,
    smiles,
    responseTweetUrl,
    twitterClient,
    telegramApiToken,
    ApiResponseError
};
