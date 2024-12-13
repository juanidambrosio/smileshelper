const { PreApproval } = require('mercadopago');
const { mercadoPagoConfig } = require('../../config/config');
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL;

let client = null;
let db = null;

const connectToDatabase = async () => {
    if (client && client.isConnected()) {
        return db;
    }

    client = await new MongoClient(MONGO_URL).connect();
    db = client.db("smiles_helper");
}

const handleMPWebhook = async (event) => {
    try {
        const body = JSON.parse(event.body);

        if (body.type === "subscription_preapproval") {
            const preapproval = await new PreApproval(mercadoPagoConfig).get({ id: body.data.id });

            if (preapproval.status === "authorized") {
                await connectToDatabase();
                const collection = db.collection('users');
                
                console.log(preapproval)
                await collection.updateOne(
                    { subscription_id: preapproval.id },
                    {
                        $set: {
                            subscription_status: preapproval.status,
                            updated_at: new Date(),
                            active: true
                        }
                    },
                    { upsert: true }
                );

                await client.close();
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ received: true })
        };
    } catch (error) {
        console.error('Webhook error:', error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}

module.exports = {
    handleMPWebhook
};