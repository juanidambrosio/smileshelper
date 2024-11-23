const BaseRepository = require('./baseRepository.js');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async getById(userId) {
        const collection = await this.connect();
        return await collection.findOne({ user_id: userId });
    }

    async upsertPreferences(userId, preferences) {
        const collection = await this.connect();
        return await collection.updateOne(
            { user_id: userId },
            { $set: preferences },
            { upsert: true }
        );
    }

    async getPreferences(userId) {
        const collection = await this.connect();
        const user =  await collection.findOne({ user_id: userId });
        return user.preferences;
    }

    async deletePreferences(userId) {
        const collection = await this.connect();
        return await collection.deleteOne({ user_id: userId });
    }
}

module.exports = new UserRepository();