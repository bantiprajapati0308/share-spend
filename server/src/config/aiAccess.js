const getAllowedEmails = () => new Set(
    String(process.env.AI_ALLOWED_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLocaleLowerCase())
        .filter(Boolean)
);

const isAiEmailAllowed = (email, emailVerified) => {
    if (!email || emailVerified !== true) return false;
    return getAllowedEmails().has(String(email).trim().toLocaleLowerCase());
};

module.exports = { isAiEmailAllowed };
