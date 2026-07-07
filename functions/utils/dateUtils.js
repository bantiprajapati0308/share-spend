function pad(number) {
    return number.toString().padStart(2, '0');
}

function toUtcDateString(date) {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function startOfUtcDay(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function endOfUtcDay(date) {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
}

function isSameUtcDay(first, second) {
    if (!first || !second) return false;
    return toUtcDateString(first) === toUtcDateString(second);
}

function todayUtcString() {
    return toUtcDateString(new Date());
}

module.exports = {
    pad,
    toUtcDateString,
    startOfUtcDay,
    endOfUtcDay,
    isSameUtcDay,
    todayUtcString,
};
