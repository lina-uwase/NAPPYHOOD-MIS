# SMS Configuration Guide

## 🚀 Quick Setup for Real SMS

### Step 1: Sign up for Africa's Talking
1. Go to [https://africastalking.com](https://africastalking.com)
2. Create an account
3. Verify your account

### Step 2: Get API Credentials
1. Login to your Africa's Talking dashboard
2. Go to "Settings" → "API Keys"
3. Copy your:
   - **API Key** (starts with `atsk_`)
   - **Username** (your account username)

### Step 3: Configure Environment Variables
Update your `.env` file:

```bash
# Change SMS mode to production
SMS_MODE=production

# Add your real API credentials
SMS_API_KEY=your_actual_api_key_here
SMS_USERNAME=your_actual_username_here
SMS_SENDER_ID=NAPPYHOOD
```

### Step 4: Add Credits
1. In Africa's Talking dashboard, go to "Wallet"
2. Add credits to your account
3. SMS costs vary by country (typically $0.02-0.05 per SMS)

### Step 5: Test
1. Restart your backend server
2. Create a new user
3. Check if real SMS is sent to the phone number

## 🧪 Testing Modes

### Development Mode (Current)
- `SMS_MODE=development`
- Messages logged to console only
- No real SMS sent
- Free to test

### Production Mode
- `SMS_MODE=production`
- Real SMS sent via Africa's Talking
- Requires API credentials and credits

## 📱 Supported Countries

Africa's Talking supports SMS in:
- 🇷🇼 Rwanda
- 🇰🇪 Kenya
- 🇺🇬 Uganda
- 🇹🇿 Tanzania
- 🇳🇬 Nigeria
- 🇬🇭 Ghana
- And 35+ other African countries

## 🔧 Phone Number Format

Make sure phone numbers are in international format:
- ✅ `+250788123456` (Rwanda)
- ✅ `+254700123456` (Kenya)
- ❌ `0788123456` (Missing country code)

## 💰 Cost Estimation

- **Rwanda SMS**: ~$0.023 per SMS
- **Monthly cost for 100 users**: ~$2.30
- **One-time setup cost**: $10 minimum credit

## 🆘 Troubleshooting

1. **SMS not sending**: Check API key and credits
2. **Invalid phone number**: Ensure international format (+250...)
3. **Authentication error**: Verify username and API key
4. **Insufficient credits**: Add money to your wallet

## 📞 Support

- Africa's Talking Support: support@africastalking.com
- Documentation: https://africastalking.com/docs