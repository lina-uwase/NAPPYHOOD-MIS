"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'Nappyhood.boutique@gmail.com',
                pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
            }
        });
    }
    async sendWelcomeEmail(email, name, password, phone) {
        try {
            const mailOptions = {
                from: `"Nappyhood Salon" <${process.env.EMAIL_USER || 'Nappyhood.boutique@gmail.com'}>`,
                to: email,
                subject: 'Welcome to Nappyhood Salon Management System',
                html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #5A8621 0%, #4A7219 100%); color: white; padding: 40px 20px; text-align: center; position: relative;">
              <!-- Nappyhood Tree Logo SVG -->
              <div style="margin-bottom: 20px;">
                <svg width="60" height="80" viewBox="0 0 95 126" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto;">
                  <path d="M53.4069 0C54.8617 0.15219 54.8617 0.15219 56.1549 0.963868C56.1549 1.23172 56.1549 1.49958 56.1549 1.77555C56.5683 1.95133 56.5683 1.95133 56.99 2.13066C57.8791 2.58722 57.8791 2.58722 58.3101 3.3989C58.5946 3.19801 58.8791 2.99712 59.1722 2.79014C60.8056 2.02122 62.1197 1.80676 63.9138 2.18139C65.207 3.14525 65.207 3.14525 66.0691 4.21058C66.0691 4.47844 66.0691 4.74629 66.0691 5.02226C66.5936 4.98041 67.1182 4.93856 67.6586 4.89543C69.198 4.89035 69.4124 4.93292 70.6221 5.96076C71.1422 6.50066 71.1422 6.50066 71.6728 7.05146C72.6777 7.45926 73.6834 7.86525 74.6901 8.26897C75.7726 9.32094 75.9833 9.62802 75.9833 11.1098C76.41 10.9759 76.8368 10.842 77.2765 10.704C79.1077 10.5361 80.6821 10.5198 82.3952 11.1859C83.4694 12.0485 84.0327 12.7325 84.6044 13.9507C84.6852 15.2951 84.6852 15.2951 84.6044 16.3858C84.8711 16.4946 85.1378 16.6034 85.4126 16.7155C86.3286 17.1974 86.3286 17.1974 87.1907 18.415C87.3017 19.5085 87.229 20.56 87.1907 21.6617C87.5196 21.7537 87.8486 21.8458 88.1875 21.9407C89.6272 22.6027 89.9552 23.1534 90.6391 24.5025C90.9265 25.3142 91.2138 26.1259 91.5012 26.9376C91.7857 27.2054 92.0702 27.4733 92.3633 27.7493C92.5516 29.9473 92.5707 30.8994 91.0702 32.6193C91.1932 33.3891 91.1932 33.3891 91.5012 34.2427C91.7056 35.9749 91.6849 37.07 90.5583 38.4533C89.2936 39.5646 88.829 39.7015 87.1907 39.9244C87.3413 40.2572 87.4918 40.5899 87.647 40.9327C87.8431 41.37 88.0393 41.8074 88.2414 42.258C88.5339 42.9078 88.5339 42.9078 88.8324 43.5706C89.7475 45.7515 89.8603 47.6216 89.8578 49.9436C89.8575 50.2717 89.8571 50.5999 89.8568 50.938C89.8263 53.7309 89.4529 56.0972 88.3491 58.7199C87.9041 59.828 87.9041 59.828 88.6455 60.7744C88.8766 60.9921 89.1078 61.2097 89.3459 61.4339C89.0615 61.4339 88.777 61.4339 88.4838 61.4339C89.773 63.3545 91.0633 65.1204 92.7405 66.7605C93.8649 67.9313 94.0736 68.2445 94.33 69.8804C94.0875 71.174 94.0875 71.174 93.2254 72.3916C92.3773 72.8228 91.5159 73.2322 90.6391 73.6091C90.963 74.9393 90.9631 74.9393 92.3633 75.6383C92.3272 75.9077 92.2911 76.1771 92.2539 76.4547C91.9569 78.6666 91.9569 78.6666 92.2017 80.8634C92.3633 81.7259 92.3633 81.7259 91.9323 82.6644C90.6733 83.6645 89.6447 83.4623 88.0528 83.3492C87.9969 83.8412 87.997 83.8412 87.94 84.3432C87.4436 87.8975 87.4436 87.8975 86.1939 89.4875C83.6917 91.1311 81.5727 91.315 78.5696 91.0602C77.1062 90.6903 75.7341 90.1697 74.3399 89.6144C71.8274 88.5677 71.8274 88.5677 69.1488 88.2447C68.0363 88.7025 67.49 89.1923 66.7157 90.0709C66.4601 90.3602 66.2045 90.6495 65.9411 90.9476C65.0354 92.0879 64.2678 93.2736 63.5434 94.5225C63.3811 94.7192 63.2189 94.9159 63.0517 95.1186C62.625 95.1186 62.1982 95.1186 61.7586 95.1186C61.7324 95.3728 61.7063 95.6271 61.6794 95.889C61.6433 96.2207 61.6072 96.5524 61.57 96.8941C61.5175 97.3885 61.5175 97.3885 61.4639 97.8928C61.3275 98.7711 61.3275 98.7711 60.8964 99.5828C60.182 105.657 61.8691 109.011 65.638 113.838C66.5001 115.005 66.5001 115.005 66.5001 116.628C66.9269 116.628 67.3536 116.628 67.7933 116.628C67.7933 117.164 67.7933 117.699 67.7933 118.251C68.3623 118.385 68.9313 118.519 69.5175 118.657C69.6598 119.461 69.802 120.264 69.9486 121.092C69.6552 121.134 69.3618 121.176 69.0595 121.219C67.7477 121.469 67.7477 121.469 66.4193 122.07C64.7677 122.749 63.1031 123.181 61.3544 123.578C61.068 123.647 60.7816 123.715 60.4864 123.786C51.6955 125.825 41.3901 125.603 32.878 122.716C32.1568 122.484 31.4356 122.252 30.7143 122.02C27.1547 120.848 23.6781 119.579 20.3775 117.846C20.3775 117.444 20.3775 117.042 20.3775 116.628C20.0602 116.591 19.7429 116.554 19.416 116.515C18.0299 116.175 17.4035 115.689 16.3633 114.776C16.0627 114.516 15.7621 114.256 15.4523 113.988C15.2284 113.788 15.0045 113.588 14.7738 113.381C15.2048 112.57 15.2048 112.57 15.9895 112.281C16.3173 112.192 16.6451 112.103 16.9829 112.012C18.8817 111.453 20.3963 110.686 22.1017 109.729C23.5277 109.121 24.8702 108.76 26.4122 108.511C26.5544 107.976 26.6967 107.44 26.8433 106.888C27.3233 106.85 27.3233 106.85 27.8131 106.812C29.3708 106.378 29.7189 105.639 30.7227 104.453C31.4723 103.87 32.2366 103.304 33.0127 102.753C35.3532 100.981 36.9454 99.1576 38.4817 96.7419C38.7001 96.4348 38.9184 96.1277 39.1434 95.8113C41.0584 92.8131 41.0789 89.592 40.637 86.1901C40.2736 85.1948 39.8354 84.2983 39.3438 83.3492C39.1393 83.5501 38.9348 83.751 38.7242 83.958C37.0884 84.8595 35.5899 84.9036 33.7401 84.5667C32.6856 83.9844 32.0183 83.3723 31.1538 82.5375C30.8693 82.6715 30.5848 82.8054 30.2917 82.9434C27.267 83.2235 27.267 83.2235 25.577 82.1063C24.5421 80.7186 24.424 79.7407 24.2569 78.0733C23.8302 77.6715 23.8302 77.6715 23.3948 77.2616C22.4195 77.4051 21.6918 77.6575 20.8085 78.0733C18.4211 78.167 18.4211 78.167 17.3601 77.6675C17.3601 77.3996 17.3601 77.1318 17.3601 76.8558C15.7532 76.2351 14.5174 76.0206 12.8071 76.1202C11.2636 76.1472 10.9409 76.0728 9.57419 75.2324C8.45261 73.5974 8.5666 72.6837 8.73902 70.7682C8.40118 70.6594 8.06334 70.5506 7.71527 70.4385C6.58376 69.9565 6.58376 69.9565 5.72165 68.739C5.43428 67.7921 5.14691 66.8451 4.85954 65.8981C4.57505 65.4964 4.29055 65.0946 3.99744 64.6806C3.8864 63.5871 3.95907 62.5356 3.99744 61.4339C4.28193 61.4339 4.56643 61.4339 4.85954 61.4339C5.07291 60.6303 5.07291 60.6303 5.2906 59.8105C4.86385 59.6766 4.43711 59.5427 3.99744 59.4047C3.71294 59.0029 3.42845 58.6011 3.13533 58.1872C2.70859 58.0533 2.28185 57.9193 1.84217 57.7814C1.84217 57.3796 1.84217 56.9778 1.84217 56.5638C1.55768 56.5638 1.27318 56.5638 0.980065 56.5638C0.362348 55.4007 0.416919 54.6105 0.549012 53.3171C0.98909 52.7521 0.98909 52.7521 1.43806 52.1757C2.44781 50.6117 2.40715 49.8367 2.11495 48.0777C1.87545 47.1297 1.87545 47.1297 0.926183 46.2149C0.0219096 45.0798 -0.0326169 44.7259 0.0101955 43.3487C0.165105 42.3737 0.165105 42.3737 0.549012 41.5478C1.33703 41.1657 1.33703 41.1657 2.27322 40.8883C3.25658 40.6038 3.25658 40.6038 3.99744 39.9244C4.28314 38.3178 4.29437 36.8998 4.24496 35.27C4.42849 33.8368 4.42849 33.8368 5.40678 32.8603C6.41983 32.3036 7.15874 31.9679 8.30797 31.8076C8.29797 31.5534 8.28796 31.2991 8.27766 31.0372C8.26988 30.7055 8.2621 30.3738 8.25409 30.0321C8.24408 29.7025 8.23408 29.3729 8.22378 29.0334C8.30797 28.1551 8.30797 28.1551 9.17007 27.3434C9.2586 26.1803 9.2586 26.1803 9.19701 24.883C9.17369 24.08 9.16128 23.2766 9.17007 22.4733C9.31232 22.3394 9.45457 22.2055 9.60113 22.0675C9.70571 21.1522 9.76636 20.2374 9.82676 19.3186C10.0751 18.2263 10.3608 17.8402 11.3253 17.1974C11.8943 17.1974 12.4633 17.1974 13.0496 17.1974C13.1918 16.7957 13.334 16.3939 13.4806 15.9799C13.8129 15.994 14.1452 16.0082 14.4875 16.0227C15.136 16.0392 15.136 16.0392 15.7975 16.056C16.2276 16.0701 16.6577 16.0843 17.1008 16.0988C17.6559 16.04 17.6559 16.04 18.2222 15.9799C18.5067 15.5781 18.7912 15.1764 19.0843 14.7624C19.3688 14.7624 19.6533 14.7624 19.9464 14.7624C20.0264 14.3857 20.0264 14.3857 20.108 14.0015C20.3775 13.139 20.3775 13.139 21.2396 12.3274C22.451 12.2863 23.6378 12.3555 24.8479 12.4177C25.9779 12.4144 25.9779 12.4144 26.7523 11.8407C27.4029 10.9298 27.5226 10.2161 27.6784 9.13138C28.0296 7.34804 28.2746 6.17954 29.8606 5.02226C30.9567 4.87034 32.0359 4.81727 33.1424 4.76861C34.6691 4.54276 35.2881 3.61627 36.3264 2.58722C37.4783 2.32256 38.5868 2.27159 39.7748 2.18139C40.2016 1.91353 40.6283 1.64568 41.068 1.36971C42.6652 1.28915 43.8569 1.29802 45.3785 1.77555C48.2923 2.07247 48.2923 2.07247 50.8475 0.963868C51.8443 0.15219 51.8443 0.15219 53.4069 0Z" fill="white"></path>
                  <path d="M53.6939 67C52.5188 67.1113 52.0464 67.2102 51.1992 68.0126C51.1918 68.3259 51.1845 68.6392 51.1769 68.962C50.972 70.0557 50.972 70.0557 50.1829 70.4387C49.9082 70.564 49.6334 70.6894 49.3504 70.8185C47.4115 71.7176 46.4849 72.9789 45.4969 74.7635C44.8876 76.4948 44.7954 78.2571 45.4635 79.9889C46.8512 82.5038 48.6597 84.0066 51.5556 84.8899C53.8588 85.2127 55.7268 84.8441 57.6143 83.5397C59.6083 81.7589 60.9004 80.0628 61 77.4006C60.9535 75.227 60.1296 73.7229 58.6834 72.0632C57.5994 71.1209 56.5265 70.4821 55.1195 70.0379C54.8641 69.2553 54.6268 68.4672 54.4067 67.6751C54.1715 67.4523 53.9363 67.2295 53.6939 67Z" fill="#5A8621"></path>
                  <path d="M51.0908 70.8845C49.2146 71.9077 47.8514 72.9131 47.197 74.9158C46.961 76.8936 47.3705 78.3718 48.6129 79.9549C49.8698 81.0474 51.1647 81.7254 52.8828 81.8235C55.0829 81.5252 56.2328 80.9129 57.6174 79.262C58.456 77.6633 58.4361 75.9823 58.1705 74.2439C57.4117 72.5938 56.3773 71.8221 54.679 71.122C53.4175 70.7258 52.3666 70.545 51.0908 70.8845Z" fill="white"></path>
                </svg>
              </div>
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Welcome to Nappyhood</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Salon Management System</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 28px;">Hello ${name}! 🌿</h2>

              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Your account has been successfully created in our Nappyhood Salon Management System.
                Welcome to our team!
              </p>

              <!-- Credentials Card -->
              <div style="background: linear-gradient(135deg, #f8fffe 0%, #f0f7f4 100%); border: 2px solid #5A8621; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #5A8621; margin-top: 0; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                  🔐 Your Login Credentials
                </h3>
                <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #5A8621;">
                  <p style="margin: 8px 0; font-size: 16px;"><strong style="color: #5A8621;">Email:</strong> <span style="color: #333;">${email}</span></p>
                  ${phone ? `<p style="margin: 8px 0; font-size: 16px;"><strong style="color: #5A8621;">Phone:</strong> <span style="color: #333;">${phone}</span></p>` : ''}
                  <p style="margin: 8px 0; font-size: 16px;"><strong style="color: #5A8621;">Password:</strong>
                    <span style="background-color: #5A8621; color: white; padding: 8px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 1px;">${password}</span>
                  </p>
                </div>
              </div>

              <!-- Important Notice -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  ⚠️ <strong>Important:</strong> Please keep these credentials safe and change your password after your first login for security.
                </p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://nappyhood.com/login" style="background: linear-gradient(135deg, #5A8621 0%, #4A7219 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(90, 134, 33, 0.3);">
                  🚀 Access Salon System
                </a>
              </div>

              <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, #5A8621, transparent); margin: 30px 0;">

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please don't hesitate to contact us at
                <a href="mailto:nappyhood.boutique@gmail.com" style="color: #5A8621; text-decoration: none; font-weight: bold;">nappyhood.boutique@gmail.com</a>
              </p>

              <p style="color: #333; font-size: 16px; margin-top: 25px;">
                Best regards,<br>
                <strong style="color: #5A8621;">The Nappyhood Team</strong> 🌿
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #2d3748; color: white; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                &copy; 2025 Nappyhood Salon Management System. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; opacity: 0.7;">
                This email was sent to ${email} because an account was created for you.
              </p>
            </div>
          </div>
        `
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Welcome email sent successfully:', result.messageId);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send welcome email:', error);
            return false;
        }
    }
    async sendPasswordResetEmail(email, name, resetToken) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            const mailOptions = {
                from: `"Nappyhood Salon" <${process.env.EMAIL_USER || 'Nappyhood.boutique@gmail.com'}>`,
                to: email,
                subject: 'Password Reset - Nappyhood Salon',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #5A8621; color: white; padding: 20px; text-align: center;">
              <h1>Password Reset</h1>
            </div>

            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2>Hello ${name}!</h2>

              <p>We received a request to reset your password for your Nappyhood Salon account.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #5A8621; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Your Password
                </a>
              </div>

              <p>If you didn't request this password reset, please ignore this email.</p>
              <p>This link will expire in 1 hour for security purposes.</p>

              <p>If you have any questions, please contact us at Nappyhood.boutique@gmail.com</p>

              <p>Best regards,<br>
              The Nappyhood Team</p>
            </div>

            <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p>&copy; 2025 Nappyhood Salon. All rights reserved.</p>
            </div>
          </div>
        `
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Password reset email sent successfully:', result.messageId);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send password reset email:', error);
            return false;
        }
    }
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connection verified successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map