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

const savePreferences = async (msg, result) => {
    const {upsert} = getDbFunctions();
    result.username = msg.from.username || msg.from.id.toString();
    await setPreferencesDb(
        {
            id: msg.chat.id,
            result,
        },
        upsert
    );
}

const setPreferences = async (msg) => {
    const {getOne} = getDbFunctions();

    try {
        const previousPreferences =
            (await getPreferencesDb(
                {id: msg.chat.id},
                getOne
            )) || {};

        const result = preferencesParser(msg.text, {
            previousfare: previousPreferences.fare,
            previousBrasilNonGol: previousPreferences.brasilNonGol,
            previousSmilesAndMoney: previousPreferences.smilesAndMoney,
        });

        result.username = msg.from.username || msg.from.id.toString();

        if (previousPreferences.airlines && result.airlines) {
            result.airlines = [...previousPreferences.airlines, ...result.airlines];
        }

        await savePreferences(msg, result);
        return {response: preferencesSave};
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
    }
};

const setRegion = async (msg, name, airports) => {
    let result = {regions: {[name]: airports}};
    const {getOne} = getDbFunctions();

    try {
        const previousPreferences =
            (await getPreferencesDb(
                {id: msg.chat.id},
                getOne
            )) || {};

        if (previousPreferences.regions) {
            result.regions = {...previousPreferences.regions, [name]: airports};
        }

        await savePreferences(msg, result);
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


const updateAlert = async (alert, result, alert_sent = false) => {
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
                previousPreferences.alerts[alertIndex].previous_result = result;

                if (alert_sent) {
                    previousPreferences.alerts[alertIndex].alerts_send += 1;
                    previousPreferences.alerts[alertIndex].alert_last_send_at = (new Date()).toLocaleString();
                    previousPreferences.alerts[alertIndex].alert_last_send_result = result;
                }

                previousPreferences.alerts[alertIndex].last_updated = (new Date()).toLocaleString()
                previousPreferences.username = alert.username;


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

const deleteAlert = async (msg, search) => {
    const {getOne, upsert} = getDbFunctions();

    try {
        // Fetch existing preferences for the chat ID
        const chatId = msg.chat.id;
        const previousPreferences = (await getPreferencesDb({id: chatId}, getOne)) || {};

        // Check if there are existing alerts
        if (Array.isArray(previousPreferences.alerts)) {
            // Find the index of the alert to delete based on its ID
            const alertIndexToDelete = previousPreferences.alerts.findIndex(alert => alert.search === search);
            const alert = previousPreferences.alerts[alertIndexToDelete];

            if (alertIndexToDelete !== -1) {
                // Remove the alert from the array
                previousPreferences.alerts.splice(alertIndexToDelete, 1);

                // Save the updated preferences back to the database
                await setPreferencesDb({id: chatId, result: previousPreferences}, upsert);

                return {alert: alert};
            } else {
                return {alert: undefined, error: "not_found"};
            }
        } else {
            return {alert: undefined, error: "no_alerts"};
        }
    } catch (error) {
        console.log(error);
        return {alert: undefined, error: 'error'};
    }
};

const createAlert = async (msg, search) => {
    const chatId = msg.chat.id;
    const runEveryHours = 1

    // To avoid running all alerts at the same time and hitting a rate limit, we'll set a random minute for each alert
    const randomMinute = Math.floor(Math.random() * 60);

    // Initialize a new alert object
    const newAlert = {
        "id": uuidv4(),
        "cron": `0 ${randomMinute} */${runEveryHours} * * *`, // Every 1 hour at a random minute
        "run_every_hours": runEveryHours,
        "search": search,
        "chat_id": chatId,
        "previous_result": null,
        "last_updated": (new Date()).toLocaleTimeString(),
        "alerts_send": 0,
        "alert_last_send_at": null,
        "alert_last_send_result": null,
        "username": msg.from.username || msg.from.id.toString(),
    };

    const {getOne} = getDbFunctions();

    try {
        // Fetch existing preferences for the chat ID
        const previousPreferences = (await getPreferencesDb({id: chatId}, getOne)) || {};

        // Initialize result object
        let result = {
            alerts: [newAlert]
        };

        // If there are existing alerts, append the new one to the array
        if (Array.isArray(previousPreferences.alerts)) {
            // If alert already exist return same one
            const foundAlert = previousPreferences.alerts.find(existingAlert => existingAlert.search === search);
            if (foundAlert) {
                console.log(`Alert ${newAlert.search} already exists, not saved`);
                return {response: alertSave, alert: foundAlert};
            }
            result.alerts = [...previousPreferences.alerts, newAlert];
        }

        // Merge the new alerts array with the existing preferences
        const updatedPreferences = {
            ...previousPreferences,
            alerts: result.alerts
        };

        // Insert or update the preferences in the database
        await savePreferences(msg, updatedPreferences);

        return {response: alertSave, alert: newAlert};
    } catch (error) {
        console.log(error);
        return {error: 'Failed to save preferences'};
    }
};

const createCron = async (msg, croncmd, cmd) => {
    let newCron = {
        "id": uuidv4(),
        "cron": croncmd,
        "search": cmd,
        "chat_id": msg.chat.id
    }

    const {getOne} = getDbFunctions();

    try {
        // Fetch existing preferences for the chat ID
        const previousPreferences = (await getPreferencesDb({id: msg.chat.id}, getOne)) || {};

        // Initialize result object
        let result = {
            crons: [newCron]
        };

        if (Array.isArray(previousPreferences.crons)) {
            // If alert already exist return same one
            const foundCron = previousPreferences.crons.find(c => c.cron === croncmd && c.search === cmd);
            if (foundCron) {
                console.log(`Cron ${newCron.search} ${newCron.cron} already exists, not saved`)
                return {response: cronSave, cron: foundCron};
            }
            result.crons = [...previousPreferences.crons, newCron];
        }

        // Merge the new alerts array with the existing preferences
        const updatedPreferences = {
            ...previousPreferences,
            crons: result.crons
        };

        await savePreferences(msg, updatedPreferences);

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
                id: msg.chat.id
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
                id: msg.chat.id
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


const getAlerts = async (msg) => {
    const {getOne} = getDbFunctions();

    try {
        const preferences = await getPreferencesDb(
            {
                id: msg.chat.id,
            },
            getOne
        );

        if (preferences === null || !preferences.alerts) {
            return [];
        } else {
            return preferences.alerts;
        }
    } catch (error) {
        console.log(error);
        return {error: preferencesError};
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
    createCron,
    createAlert,
    deleteAlert,
    updateAlert,
    findAlert,
    getCrons,
    getAllCrons,
    getAlerts,
    getAllAlerts
};
