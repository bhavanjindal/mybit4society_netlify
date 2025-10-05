require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { auth } = require('express-oauth2-jwt-bearer');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Auth0 JWT validation middleware
const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: 'RS256'
});

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return jwtCheck(req, res, next);
    }
    next();
};

// Data directory setup
const DATA_DIR = path.join(__dirname, 'data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const DIGESTS_FILE = path.join(DATA_DIR, 'digests.json');

// Ensure data directory exists
async function ensureDataDirectory() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Initialize files if they don't exist
    try {
        await fs.access(SUBSCRIPTIONS_FILE);
    } catch {
        await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify([]));
    }

    try {
        await fs.access(DIGESTS_FILE);
    } catch {
        await fs.writeFile(DIGESTS_FILE, JSON.stringify([]));
    }
}

// Perplexity API helper
async function generateDigestWithPerplexity(category) {
    const prompts = {
        'stock-market': 'Generate a concise daily digest of the most important stock market and financial news from the past 24 hours. Include: major market movements, significant company news, economic indicators, and expert insights. Format as bullet points with brief explanations.',
        'ai-updates': 'Generate a concise daily digest of the latest AI and technology developments from the past 24 hours. Include: breakthrough announcements, new AI models, tech company news, research papers, and industry trends. Format as bullet points with brief explanations.',
        'geopolitics': 'Generate a concise daily digest of the most significant geopolitical and global affairs news from the past 24 hours. Include: international relations, diplomatic developments, policy changes, and global conflicts. Format as bullet points with brief explanations.',
        'startups': 'Generate a concise daily digest of the most important startup and business news from the past 24 hours. Include: funding rounds, new unicorns, IPOs, innovative business strategies, and venture capital trends. Format as bullet points with brief explanations.'
    };

    try {
        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional news curator that creates concise, accurate daily digests. Provide factual, well-sourced summaries with key highlights.'
                    },
                    {
                        role: 'user',
                        content: prompts[category]
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            content: response.data.choices[0].message.content,
            citations: response.data.citations || []
        };
    } catch (error) {
        console.error('Perplexity API error:', error.response?.data || error.message);
        throw new Error('Failed to generate digest');
    }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Subscribe to newsletter
app.post('/api/subscribe', optionalAuth, async (req, res) => {
    try {
        const { category, email, deliveryTime } = req.body;

        if (!category || !email || !deliveryTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate category
        const validCategories = ['stock-market', 'ai-updates', 'geopolitics', 'startups'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Read existing subscriptions
        const data = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf-8');
        const subscriptions = JSON.parse(data);

        // Check if already subscribed
        const existingIndex = subscriptions.findIndex(
            sub => sub.email === email && sub.category === category
        );

        const subscription = {
            id: existingIndex >= 0 ? subscriptions[existingIndex].id : Date.now().toString(),
            category,
            email,
            deliveryTime,
            userId: req.auth?.sub || null,
            createdAt: existingIndex >= 0 ? subscriptions[existingIndex].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };

        if (existingIndex >= 0) {
            subscriptions[existingIndex] = subscription;
        } else {
            subscriptions.push(subscription);
        }

        await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));

        res.json({
            message: 'Successfully subscribed',
            subscription
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user subscriptions
app.get('/api/subscriptions', jwtCheck, async (req, res) => {
    try {
        const userId = req.auth.sub;
        const data = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf-8');
        const subscriptions = JSON.parse(data);

        const userSubscriptions = subscriptions.filter(sub => sub.userId === userId);

        res.json(userSubscriptions);
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Unsubscribe
app.delete('/api/subscribe/:id', jwtCheck, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.auth.sub;

        const data = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf-8');
        let subscriptions = JSON.parse(data);

        const subscriptionIndex = subscriptions.findIndex(
            sub => sub.id === id && sub.userId === userId
        );

        if (subscriptionIndex < 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        subscriptions = subscriptions.filter(sub => sub.id !== id);

        await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));

        res.json({ message: 'Successfully unsubscribed' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Generate digest for a category (admin/cron)
app.post('/api/digest/generate', async (req, res) => {
    try {
        const { category } = req.body;

        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }

        const digest = await generateDigestWithPerplexity(category);

        // Save digest
        const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
        const digests = JSON.parse(data);

        const newDigest = {
            id: Date.now().toString(),
            category,
            content: digest.content,
            citations: digest.citations,
            createdAt: new Date().toISOString()
        };

        digests.push(newDigest);

        await fs.writeFile(DIGESTS_FILE, JSON.stringify(digests, null, 2));

        res.json({
            message: 'Digest generated successfully',
            digest: newDigest
        });
    } catch (error) {
        console.error('Generate digest error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

// Get latest digest for a category
app.get('/api/digest/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
        const digests = JSON.parse(data);

        const categoryDigests = digests
            .filter(d => d.category === category)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (categoryDigests.length === 0) {
            return res.status(404).json({ message: 'No digest found' });
        }

        res.json(categoryDigests[0]);
    } catch (error) {
        console.error('Get digest error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all digests for a category
app.get('/api/digests/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
        const digests = JSON.parse(data);

        const categoryDigests = digests
            .filter(d => d.category === category)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);

        res.json(categoryDigests);
    } catch (error) {
        console.error('Get digests error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Cron job to generate digests daily
// Run at 8 AM IST (2:30 AM UTC) every day
cron.schedule('30 2 * * *', async () => {
    console.log('Running daily digest generation at 8 AM IST...');

    const categories = ['stock-market', 'ai-updates', 'geopolitics', 'startups'];

    for (const category of categories) {
        try {
            const digest = await generateDigestWithPerplexity(category);

            const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
            const digests = JSON.parse(data);

            const newDigest = {
                id: Date.now().toString() + '-' + category,
                category,
                content: digest.content,
                citations: digest.citations,
                createdAt: new Date().toISOString()
            };

            digests.push(newDigest);

            await fs.writeFile(DIGESTS_FILE, JSON.stringify(digests, null, 2));

            console.log(`Digest generated for ${category}`);

            // Here you would send emails to subscribers
            // Implementation depends on your email service (SendGrid, AWS SES, etc.)

        } catch (error) {
            console.error(`Error generating digest for ${category}:`, error);
        }
    }
});

// Send digest emails (placeholder - implement with your email service)
async function sendDigestEmails(category, digest) {
    try {
        const data = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf-8');
        const subscriptions = JSON.parse(data);

        const categorySubscribers = subscriptions.filter(
            sub => sub.category === category && sub.status === 'active'
        );

        // TODO: Implement email sending using your preferred service
        // Examples: SendGrid, AWS SES, Nodemailer with SMTP
        console.log(`Would send digest to ${categorySubscribers.length} subscribers for ${category}`);

        return categorySubscribers.length;
    } catch (error) {
        console.error('Send emails error:', error);
        throw error;
    }
}

// Initialize server
ensureDataDirectory().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}).catch(error => {
    console.error('Server initialization error:', error);
    process.exit(1);
});
