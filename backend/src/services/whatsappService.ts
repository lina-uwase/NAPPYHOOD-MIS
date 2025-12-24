import axios from 'axios';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Generic interface for sending messages
interface WhatsAppMessage {
    to: string;
    templateName?: string;
    templateLanguage?: string;
    components?: any[];
    text?: string;
}

export const sendWhatsAppMessage = async (to: string, message: string): Promise<boolean> => {
    try {
        if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            console.warn('⚠️ WhatsApp credentials not found. Message not sent:', message);
            return false;
        }

        // Basic text message implementation for Meta Cloud API
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message },
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('✅ WhatsApp message sent:', response.data);
        return true;
    } catch (error: any) {
        console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
        return false;
    }
};

export const sendTransactionAlert = async (customerName: string, phoneNumber: string, amount: number, totalSpent: number, visitCount: number) => {
    const message = `Hello ${customerName}, thank you for visiting Nappyhood! You spent ${amount.toLocaleString()} RWF today. Total Spent: ${totalSpent.toLocaleString()} RWF. Visits: ${visitCount}. See you soon!`;
    return sendWhatsAppMessage(phoneNumber, message);
};

export const sendBirthdayDiscount = async (customerName: string, phoneNumber: string, discount: string) => {
    const message = `Happy Birthday Month ${customerName}! 🎂 Enjoy a special discount: ${discount} at Nappyhood. Valid all month!`;
    return sendWhatsAppMessage(phoneNumber, message);
};
