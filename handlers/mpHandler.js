const { PreApproval } = require('mercadopago');
const { mercadoPagoConfig } = require('../config/config');

const createSubscription = async (userId) => {
    try {
        const subscription = await new PreApproval(mercadoPagoConfig).create({
            body: {
                reason: "Suscripción a Smiles Helper",
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: 2500,
                    currency_id: "ARS",
                },
                payer_email: "test_user_218541995@testuser.com",
                back_url: "https://web.telegram.org/k/#@smileshelperbot",
                status: "pending",
            }
        });
        return { url: subscription.init_point, subscriptionId: subscription.id };
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    createSubscription
}