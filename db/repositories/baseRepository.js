const connection = require('../connection.js');

class BaseRepository {
    constructor(collectionName) {
        this.collection = collectionName;
    }

    async connect() {
        try {
            const db = await connection();
            return db.collection(this.collection);
        } catch (error) {
            console.error(`Database connection error in ${this.collection}:`, error);
            throw new Error(`Database connection failed for ${this.collection}`);
        }
    }
}

module.exports = BaseRepository;