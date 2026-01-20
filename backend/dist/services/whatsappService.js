"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBirthdayDiscount = exports.sendTransactionAlert = exports.sendWhatsAppMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const sendWhatsAppMessage = async (to, message) => {
    try {
        if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            console.warn('⚠️ WhatsApp credentials not found. Message not sent:', message);
            return false;
        }
        // Basic text message implementation for Meta Cloud API
        const response = await axios_1.default.post(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: message },
        }, {
            headers: {
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('✅ WhatsApp message sent:', response.data);
        return true;
    }
    catch (error) {
        console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
        return false;
    }
};
exports.sendWhatsAppMessage = sendWhatsAppMessage;
const sendTransactionAlert = async (customerName, phoneNumber, amount, totalSpent, visitCount) => {
    const message = `Hello ${customerName}, thank you for visiting Nappyhood! You spent ${amount.toLocaleString()} RWF today. Total Spent: ${totalSpent.toLocaleString()} RWF. Visits: ${visitCount}. See you soon!`;
    return (0, exports.sendWhatsAppMessage)(phoneNumber, message);
};
exports.sendTransactionAlert = sendTransactionAlert;
const sendBirthdayDiscount = async (customerName, phoneNumber, discount) => {
    const message = `Happy Birthday Month ${customerName}! 🎂 Enjoy a special discount: ${discount} at Nappyhood. Valid all month!`;
    return (0, exports.sendWhatsAppMessage)(phoneNumber, message);
};
exports.sendBirthdayDiscount = sendBirthdayDiscount;
//# sourceMappingURL=whatsappService.js.map