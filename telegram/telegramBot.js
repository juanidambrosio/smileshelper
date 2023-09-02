const TelegramBot = require("node-telegram-bot-api");
const {telegramApiToken, telegramApiTokenLocal} = require("../config/config");
const {
    telegramStart,
    cafecito,
    links,
    airlinesCodes,
    searching,
    maxAirports,
} = require("../config/constants");
const regions = require("../data/regions");
const {applySimpleMarkdown} = require("../utils/parser");

const {
    regexSingleCities,
    regexMultipleDestinationMonthly,
    regexMultipleDestinationFixedDay,
    regexMultipleOriginMonthly,
    regexMultipleOriginFixedDay,
    regexRoundTrip,
    regexFilters,
    regexCustomRegion,
    regexCron,
    regexAlert
} = require("../utils/regex");

const {searchRoundTrip} = require("./search");

const cron = require("node-cron");

const isLocal = process.env.TELEGRAM_LOCAL === 'true';

const {
    getPreferences,
    getRegions,
    setPreferences,
    deletePreferences,
    setRegion,
    saveCron,
    updateAlert,
    findAlert,
    getCrons,
    getAlerts,
    getAllCrons,
    getAllAlerts,
    saveAlert,
} = require("./preferences");

const {initializeDbFunctions} = require("../db/dbFunctions");
const {
    searchSingleDestination,
    searchMultipleDestination,
    sendMessageInChunks,
    getInlineKeyboardMonths,
} = require("./telegramBotHandler");
const {save} = require("node-cron/src/storage");

async function reloadCrons(bot) {
    console.log("reloading crons and alerts")
    await deleteAllCrons()
    await loadCrons(null, bot)
    await loadAlerts(bot)
    console.log("crons and alerts reloaded")
}

async function deleteAllCrons() {
    cron.getTasks().forEach(task => task.stop())
}

async function loadAlerts(bot) {
    // Fetch all alerts
    const alerts = await getAllAlerts();

    // Check if there are any alerts to load
    if (alerts.length === 0) {
        return alerts;
    }

    // Loop through each alert and attempt to load it
    alerts.forEach(alert => {
        try {
            loadAlert(bot, alert);
            console.log(`Loaded alert ${alert.username} ${alert.cron} ${alert.search}`);
        } catch (e) {
            console.log(`Could not load alert ${alert.username} ${alert.cron} ${alert.search}`);
            console.error(e);  // Log the error for debugging
        }
    });

    return alerts;
}

async function loadCrons(msg, bot) {
    // Load crons based on the presence of 'msg'
    const crons = msg ? await getCrons(msg) : await getAllCrons();

    // Check if there are any crons to load
    if (crons.length === 0) {
        return crons;
    }

    // Loop through each cron and attempt to load it
    crons.forEach(c => {
        try {
            loadCron(bot, c);
            console.log(`Loaded cron ${c.username} ${c.cron} ${c.search} `);
        } catch (e) {
            console.log(`Could not run cron ${c.search} ${c.cron} ${c.username}`);
            console.error(e);  // Log the error for debugging
        }
    });

    return crons;
}


async function handleSearch(searchText, msg, bot, send_message = true) {
    let res;
    let groups;
    switch (true) {
        case regexSingleCities.test(searchText):
            groups = regexSingleCities.exec(searchText);
            res = await searchSingleDestination(groups, msg, bot, send_message);
            break;
        case regexMultipleDestinationMonthly.test(searchText):
            groups = regexMultipleDestinationMonthly.exec(searchText);
            res = await searchMultipleDestination(groups, msg, bot, false, false, send_message);
            break;
        case regexMultipleDestinationFixedDay.test(searchText):
            groups = regexMultipleDestinationFixedDay.exec(searchText);
            res = await searchMultipleDestination(groups, msg, bot, true, false, send_message);
            break;
        case regexMultipleOriginMonthly.test(searchText):
            groups = regexMultipleOriginMonthly.exec(searchText);
            res = await searchMultipleDestination(groups, msg, bot, false, true, send_message);
            break;
        case regexMultipleOriginFixedDay.test(searchText):
            groups = regexMultipleOriginFixedDay.exec(searchText);
            res = await searchMultipleDestination(groups, msg, bot, true, true, send_message);
            break;
        default:
            console.log(`error: ${searchText} does not match any case`);
            res = null;
    }
    return {res: res, groups: groups}
}

async function loadAlert(bot, alert, just_created = false) {
    const msg = {"chat": {"id": alert.chat_id, "username": `alert: ${alert.username}`}};
    const searchText = alert.search;

    if (just_created) {
        await handleSearch(searchText, msg, bot);
    }

    cron.schedule(alert.cron, async () => {
        try {
            const {res, groups} = await handleSearch(searchText, msg, bot, false);
            if (!res) return;

            const saved_alert = await findAlert(alert);
            if (saved_alert.alert.previous_result == null) {
                await updateAlert(alert, res);
                return;
            }

            if (saved_alert.alert.previous_result === res) return;

            await updateAlert(alert, res);

            bot.sendMessage(alert.chat_id, `La alerta ${alert.search} encontró nuevos vuelos`);
            await sendMessageInChunks(bot, alert.chat_id, res, getInlineKeyboardMonths(groups));
        } catch (e) {
            console.log(`error running alert: ${e.message}`);
        }

    });
}

// Refactored loadCron function
async function loadCron(bot, c, just_created = false) {
    const msg = {"chat": {"id": c.chat_id, "username": `cron: ${c.username}`}};

    if (just_created) {
        try {
            await handleSearch(c.search, msg, bot);
        } catch (e) {
            console.log(e)
        }
    }

    cron.schedule(c.cron, async () => {
        try {
            await handleSearch(c.search, msg, bot);
        } catch (e) {
            console.log(`error running cron: ${e.message}`);
        }
    });
}

const getTelegramToken = () => {
    if (isLocal) {
        return telegramApiTokenLocal
    } else {
        return telegramApiToken
    }
}
const listen = async () => {
    let bot = new TelegramBot(getTelegramToken(), {polling: true});
    await initializeDbFunctions();
    await loadCrons(null, bot);
    await loadAlerts(bot);

    // Set your commands here
    bot.setMyCommands([
        {command: '/start', description: 'Iniciar el bot'},
        {command: '/regiones', description: 'Listar regiones disponibles'},
        {command: '/links', description: 'Enlaces útiles'},
        {command: '/aerolineas', description: 'Lista de códigos de aerolíneas'},
        {command: '/filtros', description: 'Ver filtros establecidos'},
        {command: '/filtroseliminar', description: 'Eliminar filtros, crons y alertas'},
        {command: '/vercrons', description: 'Listar crons '},
        {command: '/agregarcron', description: 'Agregar cron'},
        {command: '/agregaralerta', description: 'Agregar alerta'},
        {command: '/veralertas', description: 'Listar alertas'},
        // Add more commands as needed
    ]);

    bot.onText(/\/start/, async (msg) =>
        bot.sendMessage(msg.chat.id, telegramStart, {parse_mode: "MarkdownV2"})
    );

    bot.onText(/\/regiones/, async (msg) => {
        const entries = {...regions, ...(await getRegions(msg))};
        const airports = Object.entries(entries).reduce(
            (phrase, current) =>
                phrase.concat(
                    applySimpleMarkdown(current[0], "__") + ": " + current[1] + "\n\n"
                ),
            ""
        );
        bot.sendMessage(msg.chat.id, airports, {parse_mode: "MarkdownV2"});
    });

    bot.onText(/\/cafecito/, async (msg) =>
        bot.sendMessage(msg.chat.id, cafecito, {parse_mode: "MarkdownV2"})
    );

    bot.onText(/\/links/, async (msg) =>
        bot.sendMessage(msg.chat.id, links, {parse_mode: "MarkdownV2"})
    );

    bot.onText(/\/aerolineas/, async (msg) =>
        bot.sendMessage(msg.chat.id, airlinesCodes, {parse_mode: "MarkdownV2"})
    );

    bot.onText(regexSingleCities, async (msg, match) => {
        await searchSingleDestination(match, msg, bot);
    });

    bot.onText(regexMultipleDestinationMonthly, async (msg, match) => {
        await searchMultipleDestination(match, msg, bot, false, false);
    });

    bot.onText(regexMultipleDestinationFixedDay, async (msg, match) => {
        await searchMultipleDestination(match, msg, bot, true, false);
    });

    bot.onText(regexMultipleOriginMonthly, async (msg, match) => {
        await searchMultipleDestination(match, msg, bot, false, true);
    });

    bot.onText(regexMultipleOriginFixedDay, async (msg, match) => {
        await searchMultipleDestination(match, msg, bot, true, true);
    });

    bot.onText(regexRoundTrip, async (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, searching);
        const {response, error} = await searchRoundTrip(msg);
        if (error) {
            bot.sendMessage(chatId, error);
        } else {
            bot.sendMessage(chatId, response, {parse_mode: "Markdown"});
        }
    });

    bot.on("callback_query", async (query) => {
        const match = query.data.split(" ");
        const entireCommand = [query.data];
        if (match[0].length > 3) {
            await searchMultipleDestination(
                entireCommand.concat(match),
                query.message,
                bot,
                false,
                true
            );
        } else if (match[1].length > 3) {
            await searchMultipleDestination(
                entireCommand.concat(match),
                query.message,
                bot,
                false,
                false
            );
        } else {
            await searchSingleDestination(
                entireCommand.concat(match),
                query.message,
                bot
            );
        }
    });

    bot.onText(regexFilters, async (msg) => {
        const chatId = msg.chat.id;
        let {response: response1, error: error1} = await setPreferences(msg);
        if (error1) {
            bot.sendMessage(chatId, error1);
        } else {
            bot.sendMessage(chatId, response1, {parse_mode: "Markdown"});
        }

        let {response: response2, error: error2} = await getPreferences(msg);
        if (error2) {
            bot.sendMessage(chatId, error2);
        } else {
            bot.sendMessage(chatId, response2, {parse_mode: "Markdown"});
        }
    });


    bot.onText(regexCustomRegion, async (msg, match) => {
        const chatId = msg.chat.id;
        const regionName = match[1].toUpperCase();
        const regionAirports = match[2]
            .split(" ")
            .slice(0, maxAirports)
            .map((airport) => airport.toUpperCase());
        const {response, error} = await setRegion(
            msg.chat.id,
            regionName,
            regionAirports
        );
        if (error) {
            bot.sendMessage(chatId, error);
        } else {
            bot.sendMessage(chatId, response, {parse_mode: "Markdown"});
        }
    });

    bot.onText(/\/filtroseliminar/, async (msg) => {
        const chatId = msg.chat.id;
        const {response, error} = await deletePreferences(msg);
        await reloadCrons(bot)
        if (error) {
            bot.sendMessage(chatId, error);
        } else {
            bot.sendMessage(chatId, response, {parse_mode: "Markdown"});
        }
    });

    bot.onText(/\/filtros$/, async (msg) => {
        const chatId = msg.chat.id;
        const {response, error} = await getPreferences(msg);
        if (error) {
            bot.sendMessage(chatId, error);
        } else {
            bot.sendMessage(chatId, response, {parse_mode: "Markdown"});
        }
    });

    bot.onText(regexAlert, async (msg, match) => {
        const chatId = msg.chat.id;
        const searchText = match[1]
        const {alert} = await saveAlert(msg, searchText);

        bot.sendMessage(chatId, "Procesando la alerta");
        await loadAlert(bot, alert, true)
        bot.sendMessage(chatId, "Se agregó la alerta correctamente. Si se encuentran cambios con respecto a esa búsqueda se te avisará por este medio. Para eliminarla, usa /filtroseliminar");
    })

    bot.onText(regexCron, async (msg, match) => {
        const chatId = msg.chat.id;
        const hour = match[1]
        const minute = match[2]
        const searchText = match[3]

        if (hour !== "*" && (parseInt(hour) > 23 || parseInt(hour) < 0)) {
            bot.sendMessage(chatId, "La hora debe estar entre 0 y 23");
            return
        }

        if (minute !== "*" && (parseInt(minute) > 59 || parseInt(minute) < 0)) {
            bot.sendMessage(chatId, "El minuto debe estar entre 0 y 59");
            return
        }

        // Both hour and minute are specific
        if (hour !== "*" && minute !== "*") {
            cronCmd = `0 ${minute} ${hour} * * *`;
        }
        // Every given amount of hours
        else if (minute === "*") {
            cronCmd = `0 0 */${hour} * * *`;
        }
        // Every given amount of minutes
        else if (hour === "*") {
            cronCmd = `0 */${minute} * * * *`;
        }
        // Both hour and minute are "*"
        else if (hour === "*" && minute === "*") {
            cronCmd = `0 * * * * *`;  // Every minute of every hour
        }


        const {_, cron} = await saveCron(chatId, cronCmd, searchText, msg)
        bot.sendMessage(chatId, "Procesando cron");
        await loadCron(bot, cron, true)
        bot.sendMessage(chatId, "Se agregó el cron correctamente. Para eliminarlo, usa /filtroseliminar");
    })

    bot.onText(/\/vercrons/, async (msg) => {
        const chatId = msg.chat.id;
        const crons = await getCrons(msg)
        if (crons.length === 0) {
            bot.sendMessage(chatId, "No hay crons");
            return
        }

        bot.sendMessage(chatId, "Lista de crons:");
        for (const cron of crons) {
            bot.sendMessage(chatId, `${cron.search} - ${cron.cron}`);
        }
    })

    bot.onText(/\/veralertas/, async (msg) => {
        const chatId = msg.chat.id;
        const alerts = await getAlerts(msg)
        if (alerts.length === 0) {
            bot.sendMessage(chatId, "No hay alertas");
            return
        }

        bot.sendMessage(chatId, "Lista de alertas");
        for (const alert of alerts) {
            bot.sendMessage(chatId, `${alert.search} - ${alert.cron}`);
        }

    })
};

process.env.TZ = 'America/Argentina/Buenos_Aires'
listen();
