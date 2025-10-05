# NewsDigest Hub 📰

A modern, AI-powered news aggregation platform that delivers personalized daily digests across multiple categories: Stock Market, AI & Technology, Geopolitics, and Startups & Business.

## 🚀 Features

- **AI-Powered News Digests**: Uses Perplexity AI to generate concise, accurate daily summaries
- **Auth0 Authentication**: Secure user authentication and authorization
- **Multi-Category Support**:
  - Stock Market & Finance
  - AI & Technology Updates
  - Geopolitics & Global Affairs
  - Startups & Business
- **Newsletter Subscriptions**: Category-specific daily email digests
- **Responsive Design**: Beautiful UI that works on all devices
- **Customizable Delivery**: Choose your preferred digest delivery time

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Authentication**: Auth0
- **AI**: Perplexity API
- **Scheduling**: node-cron
- **Storage**: JSON file-based storage

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Auth0 account
- Perplexity API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mybit4society
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Auth0 Configuration
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   AUTH0_AUDIENCE=your_api_identifier

   # Perplexity API Configuration
   PERPLEXITY_API_KEY=your_perplexity_api_key

   # Email Configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

4. **Update Auth0 configuration in app.js**

   Edit `app.js` and replace the placeholders:
   ```javascript
   auth0Client = await auth0.createAuth0Client({
       domain: 'YOUR_AUTH0_DOMAIN',  // Replace with your Auth0 domain
       clientId: 'YOUR_AUTH0_CLIENT_ID',  // Replace with your Auth0 client ID
       authorizationParams: {
           redirect_uri: window.location.origin
       }
   });
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📝 Auth0 Setup

1. **Create Auth0 Application**
   - Go to [Auth0 Dashboard](https://manage.auth0.com/)
   - Create a new Single Page Application
   - Note your Domain and Client ID

2. **Configure Application Settings**
   - Allowed Callback URLs: `http://localhost:3000`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`

3. **Create API** (for backend authentication)
   - Create a new API in Auth0
   - Note the API Identifier (Audience)

## 🤖 Perplexity API Setup

1. Sign up at [Perplexity AI](https://www.perplexity.ai/)
2. Generate an API key
3. Add the API key to your `.env` file

## 📚 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/subscribe` - Subscribe to newsletter (optional auth)

### Protected Endpoints (require authentication)
- `GET /api/subscriptions` - Get user subscriptions
- `DELETE /api/subscribe/:id` - Unsubscribe

### Admin/Cron Endpoints
- `POST /api/digest/generate` - Generate digest for category
- `GET /api/digest/:category` - Get latest digest
- `GET /api/digests/:category` - Get digest history

## 📧 Email Integration

The application includes a placeholder for email functionality. To enable email sending:

1. Choose an email service (SendGrid, AWS SES, Nodemailer with SMTP)
2. Update the `sendDigestEmails` function in `server.js`
3. Configure SMTP settings in `.env`

### Example with Nodemailer (Gmail):
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendDigestEmails(category, digest) {
    // Implementation here
}
```

## 🕐 Cron Jobs

The application automatically generates digests daily at **8 AM IST (2:30 AM UTC)**. To modify the schedule, edit the cron expression in `server.js`:

```javascript
// Current: 8 AM IST (2:30 AM UTC) daily
cron.schedule('30 2 * * *', async () => {
    // ...
});

// Examples:
// '0 7 * * *' - 7 AM UTC daily
// '0 */6 * * *' - Every 6 hours
// '0 3 * * 1-5' - 8:30 AM IST on weekdays
```

**Note:** Cron jobs use UTC time. IST is UTC+5:30, so 8:00 AM IST = 2:30 AM UTC.

## 📁 Project Structure

```
mybit4society/
├── index.html          # Main HTML page
├── styles.css          # All styles
├── app.js             # Frontend JavaScript (Auth0, subscriptions)
├── server.js          # Express backend
├── package.json       # Dependencies
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore rules
├── README.md          # Documentation
└── data/              # JSON data storage (auto-created)
    ├── subscriptions.json
    └── digests.json
```

## 🎨 Customization

### Adding New Categories

1. **Update HTML** (`index.html`):
   ```html
   <div class="category-card" id="new-category">
       <!-- Category content -->
   </div>
   ```

2. **Update category config** (`app.js`):
   ```javascript
   const categoryConfig = {
       'new-category': {
           icon: 'fa-icon-name',
           iconClass: 'new-icon',
           title: 'New Category',
           description: 'Description here'
       }
   };
   ```

3. **Add Perplexity prompt** (`server.js`):
   ```javascript
   const prompts = {
       'new-category': 'Your prompt here...'
   };
   ```

### Styling

All styles are in `styles.css`. Key CSS variables in `:root`:
- Colors: `--primary-color`, `--secondary-color`, etc.
- Spacing: `--spacing-sm`, `--spacing-md`, etc.
- Category colors: `--stock-color`, `--ai-color`, etc.

## 🔒 Security

- Auth0 handles user authentication
- JWT tokens for API authorization
- CORS enabled for frontend-backend communication
- Environment variables for sensitive data

## 🐛 Troubleshooting

### Auth0 Issues
- Verify domain and client ID are correct
- Check callback URLs are configured
- Ensure API audience matches

### Perplexity API Issues
- Verify API key is valid
- Check API rate limits
- Review request/response logs

### Server Issues
- Ensure PORT is not in use
- Check `.env` file exists and is configured
- Verify all dependencies are installed

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review API documentation for Auth0 and Perplexity

---

Built with ❤️ using modern web technologies
