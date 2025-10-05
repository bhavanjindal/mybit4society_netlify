# Quick Setup Guide

This guide will help you get NewsDigest Hub up and running in minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Auth0 Configuration

### Create Auth0 Account & Application

1. Go to [auth0.com](https://auth0.com) and sign up
2. Create a new **Single Page Application**
3. Note your **Domain** and **Client ID** from the application settings

### Configure Auth0 Application

In your Auth0 application settings, add:

**Allowed Callback URLs:**
```
http://localhost:3000, https://yourdomain.com
```

**Allowed Logout URLs:**
```
http://localhost:3000, https://yourdomain.com
```

**Allowed Web Origins:**
```
http://localhost:3000, https://yourdomain.com
```

### Create Auth0 API

1. In Auth0 Dashboard, go to **Applications** → **APIs**
2. Click **Create API**
3. Name: `NewsDigest API`
4. Identifier: `https://newsdigest-api` (or your choice)
5. Note the **Identifier** - this is your **Audience**

## Step 3: Perplexity API Setup

1. Go to [perplexity.ai](https://www.perplexity.ai/)
2. Sign up and navigate to API settings
3. Generate an API key
4. Copy the API key

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   PORT=3000
   NODE_ENV=development

   # From Auth0 Application
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret

   # From Auth0 API
   AUTH0_AUDIENCE=https://newsdigest-api

   # From Perplexity
   PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
   ```

## Step 5: Update Frontend Auth0 Config

Edit `app.js` (around line 6):

```javascript
auth0Client = await auth0.createAuth0Client({
    domain: 'your-domain.auth0.com',  // Replace with your Auth0 domain
    clientId: 'your_client_id',       // Replace with your Auth0 client ID
    authorizationParams: {
        redirect_uri: window.location.origin
    }
});
```

## Step 6: Run the Application

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

Visit: `http://localhost:3000`

## Step 7: Test the Application

1. **Test Authentication:**
   - Click "Login" button
   - Sign up or log in with Auth0
   - Verify you see your name in the user menu

2. **Test Subscription:**
   - Click "Subscribe" on any category
   - Fill in the form
   - Submit and verify success message

3. **Test Digest Generation:**
   - Use an API client (Postman, curl, etc.)
   - POST to `http://localhost:3000/api/digest/generate`
   - Body: `{ "category": "stock-market" }`

## Verification Checklist

- [ ] Dependencies installed
- [ ] Auth0 application created
- [ ] Auth0 API created
- [ ] Perplexity API key obtained
- [ ] `.env` file configured
- [ ] `app.js` Auth0 config updated
- [ ] Server starts without errors
- [ ] Can log in with Auth0
- [ ] Can subscribe to newsletters
- [ ] Digests generate successfully

## Common Issues & Solutions

### Issue: "Auth0 configuration error"
**Solution:** Verify domain and client ID are correct in both `.env` and `app.js`

### Issue: "JWT validation failed"
**Solution:** Ensure `AUTH0_AUDIENCE` matches your API Identifier

### Issue: "Perplexity API error"
**Solution:** Check API key is valid and has sufficient credits

### Issue: "CORS errors"
**Solution:** Verify callback URLs are configured in Auth0

### Issue: "Port already in use"
**Solution:** Change PORT in `.env` or stop the process using port 3000

## Optional: Email Configuration

To enable email sending, add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

For Gmail, you'll need an [App Password](https://support.google.com/accounts/answer/185833).

## Next Steps

1. **Customize Categories:** Edit categories in HTML, CSS, and server prompts
2. **Email Integration:** Implement `sendDigestEmails()` function
3. **Deploy:** Use Heroku, Vercel, or your preferred platform
4. **Monitor:** Set up logging and error tracking

## Getting Help

- Check [README.md](README.md) for detailed documentation
- Review Auth0 docs: [auth0.com/docs](https://auth0.com/docs)
- Review Perplexity docs: [docs.perplexity.ai](https://docs.perplexity.ai)

---

Need help? Create an issue on GitHub or check our documentation.
