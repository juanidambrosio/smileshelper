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
        'wzVttlloEP4jqzvNxG7ENet2aZ9aDUGFhGF2TguwoxERp6Vc31aIhb',
        '1nhac9PB61CqW0H7ciqLvCPZuf6VAHrSqUrW6tbYQiTJGR233GGnCh',
        '4SgnW4kukFthDE3Gp4I9CTzpYVwMC6Cefls8w59FXLHYb3MIygeb3l',
        'UoOU8imcyNwZrWpAVzXRymcN1t4WIvHCno2aCr998vTDpZ3dvrr1x9',
        'hR6UNp1dBruBuw7GqQvTr6Y8VP2HPlDqqdl4a4X9CagMYMeWbxRI85',
        'CQHpsNkK6HvDM4T2fFexgzvuXcNCqCWm8e9YXHzbSMfofvu6kBQId9',
        'wu0XrIuET9fHfUlhianEvTsWrrqKQG1NUliFbpvYPTYe7Q7lJBmfh3',
        '14Hy6anbLmA3ArZf2VS47nEYXt1r4AyvIQJfpjN4I8PPxHsvUPeL8L',
        '78YsFBGbcuj74qKavSd7vcC649rgtkpCAZnnc6qkdhBbJncZX66BJO',
        'mle2xQzbw5grYECf2y7hg6heANcSMIb06dzWkMBvjf5jG8IiUk0euY',
        'Tx6jqQR5ikk1hWln6HrnyxH6YyBAs0RhQiIn68qWtZv816u3mpNVFM',
        'liigYTCh5blQu6VZt0mJFVUXBm1urPKVwoAGGh05zvOTqQyfxNG4zf',
        'WJhydysNXD4ppi4a527jYo1pMDjZkZO6X4y1ho3uJszlip0YQu3DHc',
        'WPW0iLry9dgZ5uzg7Te86qj4Gs2wW2ppejVEJWrGA6sVsHo35bBKTO',
        '0PmXaHu8Ajt2526MMSlajezsS8nhPnxIGihVZLm8Q8ojGhx40IUp1s',
        'rhJE5T7wzdfnq8j8xg8OirIIGDZnA3dH77IQ4BhnFUeVtUPU2AKNkE',
        'QCRrsFUWSrMSITvJqYRJ0dtDVre8mZ5h2it1PtShnB8GMIECkHg3fg',
        'JJf7V3CYQpqok4sraIPoEEPChksVRaFPgkjOJ8DzzsJgtwhXKxTfwv',
        'Tego9Axfr0S5ih9h8miz06zoPuugDVfanXnfvNbcDEevPsV68LoI0X',
        'FwfQq09kkKmlJ0EZUQD2SqW9dQK1IR0unB1dg3bXMZUzS4OLKVDnh',
        'J1khnT8PFqSTpubQs8Fm4cf2R29HgI0qdgb61lktGAkHDdcurTg6FO',
        'rRsUfOOZCVK3DVn2trAcstzouldZS9RmMYgKmmhB5ZR6ttY9Mtsskx',
        'v6gENdONQsYloq5JWD56AHQ0x7ZfoIz4qwsNKDQ6mDIrPw5riFLVQF',
        'jevavW8KvyB8tCh6s4qMrrgTY5MmxY7OqHxndj9ePhEJ00fg6hrohN',
        'qq6Ob3AP0CGpkyMOa1fIZuPPKI7SHfD666OKck9DjWCd2kwdKk53rY',
        '5IP9D2H07TUd2fA2gpYHrSDXxIKX0KimxVtOEX0yifRuxcfKuYqPWP',
        'mdnF6m4yAJZb5Ak5BpWV5TLLFx38kOecSm03a77V5PKQpEG76kNsB',
        'v73SCfxTg7TNFqESFf783X9PCIHUkRy0Qf4239Tf3iJ7qYcTjQS2Cq',
        'SseLok2f2FqM48X33GBIwQxgb5KoXHNEbzV7ICvTxLqVrlmuveRSPC',
        'q6H2TzG0yShBCT4TVrq6C0yWfgsfFKVrnHDQ1WyRyXUIXaYbj39ndw',
        'xgbX7IV0mDjyyx14n1gKs9DkgS5PvnibT0khMrs5lrWdbK7nkfUMmJ',
        'sHSsqn9l19FrBfTLLPSlPAyC0SX3OAuYjNxsOCS2qVaXE5J3eI08G9',
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
const telegramApiTokenLocal = process.env.TELEGRAM_API_TOKEN_LOCAL

module.exports = {
    maxResults,
    smiles,
    responseTweetUrl,
    twitterClient,
    telegramApiToken,
    telegramApiTokenLocal,
    ApiResponseError
};
