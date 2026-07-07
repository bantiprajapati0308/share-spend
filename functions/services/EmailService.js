const nodemailer = require('nodemailer');

class EmailService {
    constructor(provider) {
        if (!provider || typeof provider.sendMail !== 'function') {
            throw new Error('Email provider must implement sendMail()');
        }
        this.provider = provider;
    }

    async sendDailyReminder(user) {
        if (!user || !user.email) {
            throw new Error('Invalid user data for daily reminder email');
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@share-spend.app',
            to: user.email,
            subject: 'Daily Spend Reminder',
            text: `Hi ${user.name || 'there'},\n\nYou haven’t added any daily spend entry today. Open ShareSpend and log your expenses to keep your tracker up to date.\n\nBest,\nShareSpend Team`,
            html: `<p>Hi ${user.name || 'there'},</p><p>You haven’t added any daily spend entry today. Open ShareSpend and log your expenses to keep your tracker up to date.</p><p>Best,<br/>ShareSpend Team</p>`,
        };

        const info = await this.provider.sendMail(mailOptions);
        return { success: true, info };
    }
}

function createSmtpProvider() {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
    const secure = (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === 'true';
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!(host && port && user && pass)) {
        throw new Error('SMTP settings are not configured for EmailService');
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });

    return {
        sendMail: (mailOptions) => transporter.sendMail(mailOptions),
    };
}

module.exports = new EmailService(createSmtpProvider());
