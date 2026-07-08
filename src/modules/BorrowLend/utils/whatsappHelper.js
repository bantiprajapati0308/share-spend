export const buildWhatsAppReminderMessage = ({
    personName,
    amount,
    dueDate,
    formatAmount,
    context = 'reminder',
}) => {
    const displayName = personName || 'there';
    const displayAmount = formatAmount ? formatAmount(amount) : amount;
    const hasDueDate = Boolean(dueDate);
    const formattedDueDate = hasDueDate
        ? new Date(dueDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
            : '';
    const highlightedAmount = `*${displayAmount}*`;
    const highlightedDueDate = hasDueDate ? `*${formattedDueDate}*` : '';

    if (context === 'new-gave') {
        return [
            `Hi ${displayName}, I hope you are doing well.`,
            '',
            `I have recorded that I lent you ${highlightedAmount}.`,
            hasDueDate
                ? `The due date is ${highlightedDueDate}. Please take a look when you get a chance.`
                : 'Please take a look when you get a chance.',
            '',
            'Let me know if anything needs correction.',
            '',
            'Thank you.',
        ].join('\n');
    }

    if (context === 'new-took') {
        return [
            `Hi ${displayName}, I hope you are doing well.`,
            '',
            `I have recorded that I borrowed ${highlightedAmount} from you.`,
            hasDueDate
                ? `The due date is ${highlightedDueDate}. Please take a look when you get a chance.`
                : 'Please take a look when you get a chance.',
            '',
            'Let me know if anything needs correction.',
            '',
            'Thank you.',
        ].join('\n');
    }

    if (context === 'return') {
        return [
            `Hi ${displayName}, I hope you are doing well.`,
            '',
            `I have recorded your returned payment of ${highlightedAmount}.`,
            'Please take a look when you get a chance and let me know if anything needs correction.',
            '',
            'Thank you.',
        ].join('\n');
    }

    if (context === 'repay') {
        return [
            `Hi ${displayName}, I hope you are doing well.`,
            '',
            `I have recorded my repayment of ${highlightedAmount}.`,
            'Please take a look when you get a chance and let me know if anything needs correction.',
            '',
            'Thank you.',
        ].join('\n');
    }

    return [
        `Hi ${displayName}, I hope you are doing well.`,
        '',
        `This is a gentle reminder about the pending amount of ${highlightedAmount}.`,
        hasDueDate
            ? `The due date was ${highlightedDueDate}, so please take a look when you get a chance.`
            : 'Please take a look when you get a chance.',
        '',
        'Kindly let me know when you will be able to return it.',
        '',
        'Thank you.',
    ].join('\n');
};

export const buildWhatsAppDeepLink = (phoneNumber, message = '') => {
    const text = message ? `&text=${encodeURIComponent(message)}` : '';
    return `whatsapp://send?phone=${phoneNumber}${text}`;
};

export const openWhatsAppChat = (phoneNumber, message = '') => {
    if (typeof window === 'undefined') return false;

    window.location.href = buildWhatsAppDeepLink(phoneNumber, message);
    return true;
};

export const openWhatsAppApp = () => {
    if (typeof window === 'undefined') return false;

    window.location.href = 'whatsapp://send';
    return true;
};
