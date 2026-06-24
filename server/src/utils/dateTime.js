function toIso(value) {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate().toISOString();
    if (value?._seconds) return new Date(value._seconds * 1000).toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toMillis(value) {
    const iso = toIso(value);
    return iso ? new Date(iso).getTime() : 0;
}

module.exports = {
    toIso,
    toMillis,
};
