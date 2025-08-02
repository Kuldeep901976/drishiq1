# DrishiQ Deployment Package

This is a clean deployment package for DrishiQ, optimized for Render hosting.

## 🚀 Quick Deploy to Render

1. **Fork/Clone this repository**
2. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Create a new Web Service
   - Connect your GitHub repository
   - Select this deployment folder

3. **Configure Environment Variables:**
   Copy `env.example` to `.env.local` and fill in your values:
   ```bash
   cp env.example .env.local
   ```

4. **Required Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `TWILIO_ACCOUNT_SID` - Your Twilio account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio auth token
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number

5. **Build Settings:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

## 📁 Package Contents

- **Core Application:** `app/` - Next.js app router pages
- **Components:** `components/` - React components
- **Library:** `lib/` - Utility functions and services
- **Database:** `supabase/` - Database migrations and functions
- **Assets:** `public/` - Static assets and locales
- **Configuration:** All necessary config files for deployment

## 🔧 Configuration Files

- `render.yaml` - Render deployment configuration
- `next.config.js` - Next.js configuration (Render-optimized)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `capacitor.config.ts` - Mobile app configuration

## 🗄️ Database Setup

1. **Supabase Setup:**
   - Create a new Supabase project
   - Run migrations from `supabase/migrations/` in order
   - Configure authentication settings

2. **Required Tables:**
   - `users` - User profiles and authentication
   - `invitations` - Invitation management
   - `sessions` - Session tracking
   - `payments` - Payment processing
   - `analytics` - Analytics data

## 🔐 Security

- All environment variables are configured as `sync: false` in `render.yaml`
- Security headers are configured in `next.config.js`
- CSP policies are set for production

## 📱 Mobile Support

- Capacitor configuration included for mobile builds
- PWA support enabled
- Service worker configured

## 🚀 Deployment Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start

# Development
npm run dev
```

## 📞 Support

For deployment issues, check:
1. Environment variables are properly set
2. Supabase database is configured
3. Render logs for build errors
4. Network connectivity for external services

## 🔄 Updates

To update the deployment:
1. Push changes to your repository
2. Render will automatically rebuild
3. Check deployment logs for any issues 