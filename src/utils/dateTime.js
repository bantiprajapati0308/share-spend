function toDateTime(value) {
    if (!value) return null;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (value._seconds) return new Date(value._seconds * 1000).toISOString();
    return null;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';

    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    if (days > 7) {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }

    return `${days} day${days > 1 ? 's' : ''} ago`;
}

export { toDateTime, timeAgo };
