// Auth0 Configuration
let auth0Client = null;

// Initialize Auth0
async function initAuth0() {
    try {
        auth0Client = await auth0.createAuth0Client({
            domain: 'YOUR_AUTH0_DOMAIN',  // Replace with your Auth0 domain
            clientId: 'YOUR_AUTH0_CLIENT_ID',  // Replace with your Auth0 client ID
            authorizationParams: {
                redirect_uri: window.location.origin
            }
        });

        // Check if user is authenticated
        const isAuthenticated = await auth0Client.isAuthenticated();

        if (isAuthenticated) {
            const user = await auth0Client.getUser();
            updateUIForAuthenticatedUser(user);
        }

        // Handle redirect callback
        if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
            await auth0Client.handleRedirectCallback();
            window.history.replaceState({}, document.title, window.location.pathname);
            const user = await auth0Client.getUser();
            updateUIForAuthenticatedUser(user);
        }
    } catch (error) {
        console.error('Auth0 initialization error:', error);
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');

    if (loginBtn) loginBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userName) userName.textContent = user.name || user.email;

    // Prefill subscription email
    const subscriptionEmail = document.getElementById('subscriptionEmail');
    if (subscriptionEmail) {
        subscriptionEmail.value = user.email;
    }
}

// Login handler
async function login() {
    if (!auth0Client) {
        showToast('Authentication is not configured. Please set up Auth0.');
        return;
    }

    try {
        await auth0Client.loginWithRedirect();
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.');
    }
}

// Logout handler
async function logout() {
    if (!auth0Client) return;

    try {
        await auth0Client.logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Logout failed. Please try again.');
    }
}

// Get access token for API calls
async function getAccessToken() {
    if (!auth0Client) return null;

    try {
        const isAuthenticated = await auth0Client.isAuthenticated();
        if (isAuthenticated) {
            return await auth0Client.getTokenSilently();
        }
    } catch (error) {
        console.error('Token error:', error);
    }
    return null;
}

// Subscription Modal
let currentCategory = null;

const categoryConfig = {
    'stock-market': {
        icon: 'fa-chart-line',
        iconClass: 'stock-icon',
        title: 'Stock Market & Finance Digest',
        description: 'Get daily market analysis, trading insights, and financial trends delivered to your inbox'
    },
    'ai-updates': {
        icon: 'fa-brain',
        iconClass: 'ai-icon',
        title: 'AI & Technology Updates Digest',
        description: 'Stay updated with the latest AI breakthroughs and technology innovations'
    },
    'geopolitics': {
        icon: 'fa-globe-americas',
        iconClass: 'geo-icon',
        title: 'Geopolitics & Global Affairs Digest',
        description: 'Receive comprehensive analysis of international relations and global policy changes'
    },
    'startups': {
        icon: 'fa-rocket',
        iconClass: 'startup-icon',
        title: 'Startups & Business Digest',
        description: 'Track venture capital trends, unicorns, and innovative business strategies'
    }
};

// Open subscription modal
function openSubscriptionModal(category) {
    currentCategory = category;
    const modal = document.getElementById('subscriptionModal');
    const modalIcon = document.getElementById('modalCategoryIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const categoryInput = document.getElementById('subscriptionCategory');

    const config = categoryConfig[category];

    if (modalIcon && config) {
        modalIcon.innerHTML = `<i class="fas ${config.icon}"></i>`;
        modalIcon.className = `modal-icon ${config.iconClass}`;
    }

    if (modalTitle && config) modalTitle.textContent = config.title;
    if (modalDescription && config) modalDescription.textContent = config.description;
    if (categoryInput) categoryInput.value = category;

    if (modal) modal.classList.remove('hidden');
}

// Close subscription modal
function closeSubscriptionModal() {
    const modal = document.getElementById('subscriptionModal');
    if (modal) modal.classList.add('hidden');
    currentCategory = null;
}

// Handle subscription form submission
async function handleSubscriptionSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const subscriptionData = {
        category: formData.get('category'),
        email: formData.get('email'),
        deliveryTime: formData.get('deliveryTime')
    };

    try {
        const token = await getAccessToken();

        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(subscriptionData)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Successfully subscribed! Check your email for confirmation.');
            closeSubscriptionModal();
            event.target.reset();

            // Update subscribe button
            const subscribeBtn = document.querySelector(`[data-category="${subscriptionData.category}"]`);
            if (subscribeBtn) {
                subscribeBtn.innerHTML = '<i class="fas fa-check"></i> Subscribed';
                subscribeBtn.disabled = true;
            }
        } else {
            showToast(result.message || 'Subscription failed. Please try again.');
        }
    } catch (error) {
        console.error('Subscription error:', error);
        showToast('An error occurred. Please try again later.');
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Smooth scroll to sections
function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Check user subscriptions
async function checkUserSubscriptions() {
    try {
        const token = await getAccessToken();
        if (!token) return;

        const response = await fetch('/api/subscriptions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const subscriptions = await response.json();

            // Update UI for subscribed categories
            subscriptions.forEach(sub => {
                const subscribeBtn = document.querySelector(`[data-category="${sub.category}"]`);
                if (subscribeBtn) {
                    subscribeBtn.innerHTML = '<i class="fas fa-check"></i> Subscribed';
                    subscribeBtn.disabled = true;
                }
            });
        }
    } catch (error) {
        console.error('Error checking subscriptions:', error);
    }
}

// Request login before subscription
async function requireAuth(action) {
    const isAuthenticated = auth0Client ? await auth0Client.isAuthenticated() : false;

    if (!isAuthenticated) {
        showToast('Please log in to subscribe to newsletters');
        setTimeout(() => login(), 1500);
        return false;
    }

    return true;
}

// Fetch and display digest for a category
async function fetchAndDisplayDigest(category) {
    try {
        const response = await fetch(`/api/digest/${category}`);

        if (!response.ok) {
            throw new Error('Digest not found');
        }

        const digest = await response.json();
        updateDigestUI(category, digest);
    } catch (error) {
        console.error(`Error fetching digest for ${category}:`, error);
        // Show fallback message if no digest available
        updateDigestUIWithFallback(category);
    }
}

// Update UI with digest content
function updateDigestUI(category, digest) {
    const previewElement = document.querySelector(`.news-preview[data-category="${category}"]`);
    if (!previewElement) return;

    const contentElement = previewElement.querySelector('.preview-content');
    const timeElement = previewElement.querySelector('.time-ago');

    if (timeElement) {
        const timeAgo = getTimeAgo(new Date(digest.createdAt));
        timeElement.textContent = `Updated ${timeAgo}`;
    }

    if (contentElement) {
        // Parse the digest content and create bullet points
        const bulletPoints = parseDigestContent(digest.content);

        contentElement.innerHTML = `
            <ul class="preview-list">
                ${bulletPoints.map(point => `
                    <li><i class="fas fa-circle"></i> ${point}</li>
                `).join('')}
            </ul>
        `;
    }
}

// Update UI with fallback when no digest available
function updateDigestUIWithFallback(category) {
    const previewElement = document.querySelector(`.news-preview[data-category="${category}"]`);
    if (!previewElement) return;

    const contentElement = previewElement.querySelector('.preview-content');
    const timeElement = previewElement.querySelector('.time-ago');

    if (timeElement) {
        timeElement.textContent = 'No digest available';
    }

    if (contentElement) {
        contentElement.innerHTML = `
            <p style="color: var(--text-secondary); font-style: italic;">
                No digest available yet. Subscribe to get notified when new digests are generated!
            </p>
        `;
    }
}

// Parse digest content into bullet points
function parseDigestContent(content) {
    // Split by newlines and filter for bullet points or numbered items
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => {
            // Match lines starting with -, *, •, or numbers
            return /^[-*•\d]/.test(line);
        })
        .map(line => {
            // Remove bullet points and numbers
            return line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '');
        })
        .slice(0, 5); // Limit to 5 items

    // If no bullet points found, take first 3 sentences
    if (lines.length === 0) {
        const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.slice(0, 3).map(s => s.trim());
    }

    return lines;
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}

// Load all digests on page load
async function loadAllDigests() {
    const categories = ['stock-market', 'ai-updates', 'geopolitics', 'startups'];

    for (const category of categories) {
        await fetchAndDisplayDigest(category);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Auth0
    initAuth0();

    // Load all digests on page load (refreshed once daily at 8 AM IST on server)
    loadAllDigests();

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Get started buttons
    const getStartedBtn = document.getElementById('getStartedBtn');
    const ctaSignupBtn = document.getElementById('ctaSignupBtn');

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', async () => {
            const isAuth = await requireAuth('signup');
            if (isAuth) {
                smoothScrollTo('#categories');
            }
        });
    }

    if (ctaSignupBtn) {
        ctaSignupBtn.addEventListener('click', async () => {
            const isAuth = await requireAuth('signup');
            if (isAuth) {
                smoothScrollTo('#categories');
            }
        });
    }

    // Subscribe buttons
    const subscribeButtons = document.querySelectorAll('.btn-subscribe');
    subscribeButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const category = btn.getAttribute('data-category');
            const isAuth = await requireAuth('subscribe');
            if (isAuth) {
                openSubscriptionModal(category);
            }
        });
    });

    // Modal close
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeSubscriptionModal);
    }

    // Click outside modal to close
    const modal = document.getElementById('subscriptionModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSubscriptionModal();
            }
        });
    }

    // Subscription form
    const subscriptionForm = document.getElementById('subscriptionForm');
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', handleSubscriptionSubmit);
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Smooth scroll for nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                smoothScrollTo(href);
            }
        });
    });

    // Check user subscriptions after auth
    setTimeout(checkUserSubscriptions, 1000);
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSubscriptionModal();
    }
});
