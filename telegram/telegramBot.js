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
    setCron,
    setAlert,
    updateAlert,
    findAlert,
    getCrons,
    getAllCrons
} = require("./preferences");

const {initializeDbFunctions} = require("../db/dbFunctions");
const {
    searchSingleDestination,
    searchMultipleDestination,
} = require("./telegramBotHandler");

async function reloadCrons(bot) {
    await deleteAllCrons()
    await loadCrons(null, bot)
}

async function deleteAllCrons() {
    cron.getTasks().forEach(task => task.stop())
}

async function loadCrons(msg, bot) {
    let crons;
    if (msg !== null) {
        crons = await getCrons(msg)
    } else {
        crons = await getAllCrons()
    }
    if (crons.length !== 0) {
        for (const c of crons) {
            try {
                loadCron(bot, c.chroncmd, c.cmd, c.id)
                console.log(`loaded cron ${c.chroncmd} ${c.cmd} ${c.id}`)
            } catch (e) {
                console.log(`could not run cron ${c.chroncmd} ${c.cmd} ${c.id}`)
            }

        }
    }
    return crons
}

function loadAlert(bot, chronCmd, alert) {
    cron.schedule(chronCmd, () => {
        const msg = {
            "chat": {
                "id": alert.chat_id
            }
        }
        const searchText = alert.search
        let res;
        switch (true) {
            case regexSingleCities.test(searchText):
                const groups1 = regexSingleCities.exec(searchText);
                res = searchSingleDestination(groups1, msg, bot, false);
                break;
            case regexMultipleDestinationMonthly.test(searchText):
                const groups2 = regexMultipleDestinationMonthly.exec(searchText);
                res = searchMultipleDestination(groups2, msg, bot, false, false, false);
                break;
            case regexMultipleDestinationFixedDay.test(searchText):
                const groups3 = regexMultipleDestinationFixedDay.exec(searchText);
                res = searchMultipleDestination(groups3, msg, bot, true, false, false);
                break;
            case regexMultipleOriginMonthly.test(searchText):
                const groups4 = regexMultipleOriginMonthly.exec(searchText);
                res = searchMultipleDestination(groups4, msg, bot, false, true, false);
                break;
            case regexMultipleOriginFixedDay.test(searchText):
                const groups5 = regexMultipleOriginFixedDay.exec(searchText);
                res = searchMultipleDestination(groups5, msg, bot, true, true, false);
                break;
            default:
                console.log(`error: ${searchText} does not match any case`);
        }
        if (!res) {
            return
        }
        const previous_response = await findAlert(alert)
        if (previous_response === res || previous_response == null) {
            const res = await updateAlert(alert, res)
            return
        }


        switch (true) {
            case regexSingleCities.test(searchText):
                const groups1 = regexSingleCities.exec(searchText);
                res = searchSingleDestination(groups1, msg, bot);
                break;
            case regexMultipleDestinationMonthly.test(searchText):
                const groups2 = regexMultipleDestinationMonthly.exec(searchText);
                res = searchMultipleDestination(groups2, msg, bot, false, false);
                break;
            case regexMultipleDestinationFixedDay.test(searchText):
                const groups3 = regexMultipleDestinationFixedDay.exec(searchText);
                res = searchMultipleDestination(groups3, msg, bot, true, false);
                break;
            case regexMultipleOriginMonthly.test(searchText):
                const groups4 = regexMultipleOriginMonthly.exec(searchText);
                res = searchMultipleDestination(groups4, msg, bot, false, true);
                break;
            case regexMultipleOriginFixedDay.test(searchText):
                const groups5 = regexMultipleOriginFixedDay.exec(searchText);
                res = searchMultipleDestination(groups5, msg, bot, true, true);
                break;
            default:
                console.log(`error: ${searchText} does not match any case`);
        }

    })
}

function loadCron(bot, chronCmd, searchText, chatId) {
    cron.schedule(chronCmd, () => {
        const msg = {
            "chat": {
                "id": chatId
            }
        }
        switch (true) {
            case regexSingleCities.test(searchText):
                const groups1 = regexSingleCities.exec(searchText);
                searchSingleDestination(groups1, msg, bot);
                break;
            case regexMultipleDestinationMonthly.test(searchText):
                const groups2 = regexMultipleDestinationMonthly.exec(searchText);
                searchMultipleDestination(groups2, msg, bot, false, false);
                break;
            case regexMultipleDestinationFixedDay.test(searchText):
                const groups3 = regexMultipleDestinationFixedDay.exec(searchText);
                searchMultipleDestination(groups3, msg, bot, true, false);
                break;
            case regexMultipleOriginMonthly.test(searchText):
                const groups4 = regexMultipleOriginMonthly.exec(searchText);
                searchMultipleDestination(groups4, msg, bot, false, true);
                break;
            case regexMultipleOriginFixedDay.test(searchText):
                const groups5 = regexMultipleOriginFixedDay.exec(searchText);
                searchMultipleDestination(groups5, msg, bot, true, true);
                break;
            default:
                console.log(`error: ${searchText} does not match any case`);
        }
    })
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

    // Set your commands here
    await bot.setMyCommands([
        {command: '/start', description: 'Iniciar el bot'},
        {command: '/regiones', description: 'Listar regiones disponibles'},
        {command: '/links', description: 'Enlaces útiles'},
        {command: '/aerolineas', description: 'Lista de códigos de aerolíneas'},
        {command: '/filtros', description: 'Ver filtros establecidos'},
        {command: '/filtroseliminar', description: 'Eliminar filtros y crons'},
        {command: '/vercrons', description: 'Listar crons '},
        {command: '/agregarcron', description: 'Agregar cron'},
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
        const {response, error} = await setPreferences(msg);
        if (error) {
            bot.sendMessage(chatId, error);
        } else {
            bot.sendMessage(chatId, response, {parse_mode: "Markdown"});
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
            msg.chat.username || msg.chat.id.toString(),
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
        const preferences = await getPreferences(msg);
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
        const searchText = match[3]

        const {alert} = await setAlert(chatId, searchText);

        const everyOneHour = `0 * 1 * * *`
        loadAlert(bot, everyOneHour, alert)

        bot.sendMessage(chatId, "Se agregó la alerta correctamente");
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

        const chronCmd = `0 ${minute} ${hour} * * *`

        await setCron(chatId, chronCmd, searchText)
        loadCron(bot, chronCmd, searchText, chatId)
        bot.sendMessage(chatId, "Se agregó el cron correctamente");
    })

    bot.onText(/\/vercrons/, async (msg) => {
        const chatId = msg.chat.id;
        const crons = await getCrons(msg)
        if (crons.length === 0) {
            bot.sendMessage(chatId, "No hay crons");
        } else {
            bot.sendMessage(chatId, "Lista de crons:");
            for (const cron of crons) {
                bot.sendMessage(chatId, `${cron.chroncmd} - ${cron.cmd}`);
            }
        }
    })
};

process.env.TZ = 'America/Argentina/Buenos_Aires'
listen();
