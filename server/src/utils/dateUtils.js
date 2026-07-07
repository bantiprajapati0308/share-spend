const DATE_ONLY_REGEX = /^(\d{4}-\d{2}-\d{2})/;

function pad(number) {
    return String(number).padStart(2, '0');
}

function normalizeDateString(value) {
    if (!value) return null;
    if (typeof value === 'string') {
        const match = value.trim().match(DATE_ONLY_REGEX);
        if (match) return match[1];
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `${year}-${month}-${day}`;
}

function compareDateStrings(lhs, rhs) {
    if (!lhs && !rhs) return 0;
    if (!lhs) return -1;
    if (!rhs) return 1;
    if (lhs === rhs) return 0;
    return lhs > rhs ? 1 : -1;
}

function isSameDateString(lhs, rhs) {
    return normalizeDateString(lhs) === normalizeDateString(rhs);
}

function yesterdayDateString() {
    return normalizeDateString(new Date(Date.now() - 86400000));
}

module.exports = {
    normalizeDateString,
    compareDateStrings,
    isSameDateString,
    yesterdayDateString,
};
