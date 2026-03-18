import cron from 'node-cron';
import { prisma } from '../utils/database';
import { sendBirthdayDiscount } from '../services/whatsappService';

// Run every day at 09:00 AM
export const startBirthdayCronJob = () => {
    cron.schedule('0 9 * * *', async () => {
        console.log('🎂 Running daily birthday discount cron job...');
        try {
            const today = new Date();
            const currentMonth = today.getMonth() + 1; // 1-12
            const currentYear = today.getFullYear();
            
            // Find all customers whose birthday is this month
            // and who haven't received a message this year
            const customers = await prisma.customer.findMany({
                where: {
                    birthMonth: currentMonth,
                    OR: [
                        { lastBirthdayMessageYear: null },
                        { lastBirthdayMessageYear: { lt: currentYear } }
                    ]
                }
            });

            console.log(`Found ${customers.length} customers with birthdays in month ${currentMonth} who haven't received a reminder this year.`);

            let sentCount = 0;

            for (const customer of customers) {
                if (!customer.phone) continue;

                // Send the WhatsApp message
                const sent = await sendBirthdayDiscount(customer.fullName, customer.phone, '20%');
                
                if (sent) {
                    // Update the customer record so they don't get spammed again this year
                    await prisma.customer.update({
                        where: { id: customer.id },
                        data: { lastBirthdayMessageYear: currentYear }
                    });
                    sentCount++;
                }
            }
            
            console.log(`🎂 Complete! Sent ${sentCount} birthday reminders.`);
        } catch (error) {
            console.error('❌ Error executing birthday cron job:', error);
        }
    });

    console.log('⏰ Birthday cron job scheduled (runs daily at 09:00 AM)');
};
