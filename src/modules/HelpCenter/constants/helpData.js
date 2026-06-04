// Contact Us data
export const CONTACT_ITEMS = [
    {
        id: 'phone',
        icon: 'bi-telephone-fill',
        color: '#667eea',
        bg: '#f0f4ff',
        title: 'Call Support',
        primary: '+91 8269248099',
        secondary: 'Mon - Sun, 10:00 AM - 7:00 PM',
        action: () => window.open('tel:+919876543210'),
    },
    {
        id: 'email',
        icon: 'bi-envelope-fill',
        color: '#28a745',
        bg: '#e8f5e9',
        title: 'Email Support',
        primary: 'bantiprajapati0308@gmail.com',
        secondary: 'We reply within 24 hours',
        action: () => window.open('mailto:bantiprajapati0308@gmail.com'),
    },
    {
        id: 'website',
        icon: 'bi-globe',
        color: '#0d6efd',
        bg: '#e8f0fe',
        title: 'Website',
        primary: 'share-spend-nine.vercel.app',
        secondary: 'Visit our website',
        action: () => window.open('https://share-spend-nine.vercel.app', '_blank'),
    },
];

// FAQ data — top 3 with answers
export const FAQ_ITEMS = [
    {
        id: 'faq-1',
        question: 'How do I add an expense?',
        answer:
            'Tap the "+" button on the Daily Spends screen. Fill in the amount, category, payment method, and date, then press Save. Your expense is instantly recorded and reflected in your summary.',
    },
    {
        id: 'faq-2',
        question: 'How do I create a budget?',
        answer:
            'Go to Daily Spends → Budget & Limits. Tap "Add Limit", choose a category, set a monthly limit amount, and save. You\'ll see a progress bar for each category so you always know how close you are to your limit.',
    },
    {
        id: 'faq-3',
        question: 'How do I manage categories?',
        answer:
            'Open Daily Spends and tap the Categories icon. You can add custom categories with an emoji and name, toggle any category on/off, or rename existing ones. System categories (like Credit Card Spend) cannot be deleted.',
    },
];

// More Options
export const SUPPORT_EMAIL = 'bantiprajapati0308@gmail.com';
