const {getPreferencesDb, setPreferencesDb, getAllPreferencesDb} = require("./dbMapper");

const {preferencesParser} = require("../utils/parser");

const {v4: uuidv4} = require('uuid');

const {
    preferencesDelete,
    preferencesError,
    preferencesNone,
    preferencesSave,
    preferencesMap,
    regionSave,
    cronSave,
    alertSave
} = require("../config/constants");

const {getDbFunctions} = require("../db/dbFunctions");

const setPreferences = async (msg) => {
    const {getOne, upsert} = getDbFunctions();

    try {
        const previousPreferences =
            (await getPreferencesDb(
                {id: msg.from.username || msg.from.id.toString()},
                getOne
            )) || {};

        const result = preferencesParser(msg.text, {
            previousfare: previousPreferences.fare,
            previousBrasilNonGol: previousPreferences.brasilNonGol,
            previousSmilesAndMoney: previousPreferences.smilesAndMoney,
        });

        if (previousPreferences.airlines && result.airlines) {
            result.airlines = [...previousPreferences.airlines, ...result.airlines];
        }

        await setPreferencesDb(
            {
                id: msg.from.username || msg.from.id.toString(),
                result,
            },
            upsert
        );
        return {response: preferencesSave};
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
    }
};

const setRegion = async (id, name, airports) => {
    let result = {regions: {[name]: airports}};
    const {getOne, upsert} = getDbFunctions();

    try {
        const previousPreferences =
            (await getPreferencesDb(
                {id},
                getOne
            )) || {};

        if (previousPreferences.regions) {
            result.regions = {...previousPreferences.regions, [name]: airports};
        }

        await setPreferencesDb(
            {
                id,
                result,
            },
            upsert
        );
        return {response: regionSave};
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
    }
};

const findAlert = async (targetAlert) => {
    const {getOne} = getDbFunctions();

    try {
        // Fetch existing preferences for the chat ID associated with the target alert
        const chatId = targetAlert.chat_id; // Assuming the targetAlert object has a chat_id field
        const previousPreferences = (await getPreferencesDb({id: chatId}, getOne)) || {};

        // If there are existing alerts, find the one that matches the target alert
        if (Array.isArray(previousPreferences.alerts)) {
            const foundAlert = previousPreferences.alerts.find(existingAlert => existingAlert.id === targetAlert.id);

            if (foundAlert) {
                return {response: 'Alert found', alert: foundAlert};
            } else {
                return {error: 'Alert not found'};
            }
        } else {
            return {error: 'No existing alerts'};
        }
    } catch (error) {
        console.log(error);
        return {error: 'Failed to find alert'};
    }
};


const updateAlert = async (alert, result) => {
    // Initialize database functions
    const {getOne, upsert} = getDbFunctions();

    try {
        // Fetch existing preferences for the chat ID
        const chatId = alert.chat_id; // Assuming the alert object has a chat_id field
        const previousPreferences = (await getPreferencesDb({id: chatId}, getOne)) || {};

        // If there are existing alerts, find the one with the same ID and update it
        if (Array.isArray(previousPreferences.alerts)) {
            const alertIndex = previousPreferences.alerts.findIndex(existingAlert => existingAlert.id === alert.id);

            if (alertIndex !== -1) {
                // Update the previous_result field
                previousPreferences.alerts[alertIndex].previous_result = result;

                // Save the updated preferences back to the database
                await setPreferencesDb({id: chatId, result: previousPreferences}, upsert);

                return {response: 'Alert updated successfully', alert: previousPreferences.alerts[alertIndex]};
            } else {
                console.log('Alert not found')
                return {error: 'Alert not found'};
            }
        } else {
            return {error: 'No existing alerts'};
        }
    } catch (error) {
        console.log(error);
        return {error: 'Failed to update alert'};
    }
};


const saveAlert = async (msg, search) => {
    const chatId = msg.chat.id;

    // To avoid running all alerts at the same time and hitting a rate limit, we'll set a random minute for each alert
    const randomMinute = Math.floor(Math.random() * 60);

    // Initialize a new alert object
    const newAlert = {
        "id": uuidv4(),
        "cron": `0 ${randomMinute} */3 * * *`, // Every 3 hours at a random minute
        "search": search,
        "chat_id": chatId,
        "previous_result": null,
        "username": msg.from.username || msg.from.id.toString(),
    };

    const {getOne, upsert} = getDbFunctions();

    try {
        // Fetch existing preferences for the chat ID
        const previousPreferences = (await getPreferencesDb({id}, getOne)) || {};

        // Initialize result object
        let result = {
            alerts: [newAlert]
        };

        // If there are existing alerts, append the new one to the array
        if (Array.isArray(previousPreferences.alerts)) {
            result.alerts = [...previousPreferences.alerts, newAlert];
        }

        // Merge the new alerts array with the existing preferences
        const updatedPreferences = {
            ...previousPreferences,
            alerts: result.alerts
        };

        // Insert or update the preferences in the database
        await setPreferencesDb({id, result: updatedPreferences}, upsert);

        return {response: alertSave, alert: newAlert};
    } catch (error) {
        console.log(error);
        return {error: 'Failed to save preferences'};
    }
};

const saveCron = async (id, croncmd, cmd, msg) => {
    let newCron = {
        "id": uuidv4(),
        "cron": croncmd,
        "search": cmd,
        "chat_id": id,
        "username": msg.from.username || msg.from.id.toString(),
    }

    const {getOne, upsert} = getDbFunctions();

    try {
        // Fetch existing preferences for the chat ID
        const previousPreferences = (await getPreferencesDb({id}, getOne)) || {};

        // Initialize result object
        let result = {
            crons: [newCron]
        };

        // If there are existing crons, append the new one to the array
        if (Array.isArray(previousPreferences.crons)) {
            result.crons = [...previousPreferences.crons, newCron];
        }

        // Merge the new alerts array with the existing preferences
        const updatedPreferences = {
            ...previousPreferences,
            crons: result.crons
        };

        await setPreferencesDb({id, result: updatedPreferences}, upsert);

        return {response: cronSave, cron: newCron};
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
    }
};

const deletePreferences = async (msg) => {
    const {deleteOne} = getDbFunctions();

    try {
        await deleteOne({
            author_id: msg.chat.id,
        });
        return {response: preferencesDelete};
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
    }
};

const getPreferences = async (msg) => {
    const {getOne} = getDbFunctions();

    try {
        const preferences = await getPreferencesDb(
            {
                id: msg.from.username || msg.from.id.toString(),
            },
            getOne
        );

        let response = "";
        if (preferences !== null) {
            for (const preference in preferences) {
                if (preferencesMap.has(preference)) {
                    response +=
                        preferencesMap.get(preference) +
                        preferences[preference].toString() +
                        "\n";
                }
            }
        }
        return {
            response: response || preferencesNone
        };
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
    }
};

const getRegions = async (msg) => {
    const {getOne} = getDbFunctions();

    try {
        const preferences = await getPreferencesDb(
            {
                id: msg.from.username || msg.from.id.toString(),
            },
            getOne
        );

        if (preferences === null || !preferences.regions) {
            return {};
        } else {
            return preferences.regions;
        }
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
    }
};

const getAllAlerts = async () => {
    const {getAll} = getDbFunctions();

    try {
        const preferences = await getAllPreferencesDb(getAll);

        if (preferences === null) {
            return [];
        } else {
            return preferences
                .filter(obj => Array.isArray(obj.alerts) && obj.alerts.length > 0) // Keep objects with 'alerts' property that is an array and not empty
                .flatMap(obj => obj.alerts); // Return the alerts as they are
        }
    } catch (error) {
        console.log(error);
        return {error: 'Failed to fetch all alerts'};
    }
};


const getAllCrons = async () => {
    const {getAll} = getDbFunctions();

    try {
        const preferences = await getAllPreferencesDb(getAll);

        if (preferences === null) {
            return [];
        } else {
            return preferences
                .filter(obj => Array.isArray(obj.crons) && obj.crons.length > 0) // Keep objects with 'crons' property that is an array and not empty
                .flatMap(obj => obj.crons); // Return the crons as they are
        }
    } catch (error) {
        console.log(error);
        return {error: 'Failed to fetch all crons'};
    }
};

const getCrons = async (msg) => {
    const {getOne} = getDbFunctions();

    try {
        const preferences = await getPreferencesDb(
            {
                id: msg.chat.id,
            },
            getOne
        );

        if (preferences === null || !preferences.crons) {
            return [];
        } else {
            return preferences.crons;
        }
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
    }
};

module.exports = {
    setPreferences,
    setRegion,
    getPreferences,
    getRegions,
    deletePreferences,
    saveCron,
    saveAlert,
    updateAlert,
    findAlert,
    getCrons,
    getAllCrons,
    getAllAlerts
};
