const BaseRepository = require('./baseRepository.js');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async createUser(userId, subscriptionId) {
        const collection = await this.connect();
        await collection.updateOne(
            { user_id: userId },
            { $set: { user_id: userId, subscription_id: subscriptionId, active: false } },
            { upsert: true }
        );
    }

    async getById(userId) {
        const collection = await this.connect();
        return await collection.findOne({ user_id: userId });
    }

    async upsertPreferences(userId, preferences) {
        const collection = await this.connect();
        return await collection.updateOne(
            { user_id: userId },
            { $set: Object.fromEntries(Object.entries(preferences).map(([key, value]) => [`preferences.${key}`, value])) },
            { upsert: true }
        );
    }

    async getPreferences(userId) {
        const collection = await this.connect();
        const user = await collection.findOne({ user_id: userId });
        return user.preferences;
    }

    async deletePreferences(userId) {
        const collection = await this.connect();
        return await collection.updateOne(
            { user_id: userId },
            { $unset: { preferences: 1 } }
        );
    }
}

module.exports = new UserRepository();