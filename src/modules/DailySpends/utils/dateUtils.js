const DATE_ONLY_REGEX = /^(\d{4}-\d{2}-\d{2})/;

const pad2 = (n) => String(n).padStart(2, '0');

export const formatLocalDate = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
        const trimmed = value.trim();
        const match = trimmed.match(DATE_ONLY_REGEX);
        if (match) return match[1];

        const parsed = new Date(trimmed);
        if (Number.isNaN(parsed.getTime())) return '';
        return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
    }

    if (typeof value?.toDate === 'function') {
        const parsed = value.toDate();
        if (Number.isNaN(parsed.getTime())) return '';
        return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
};

export const parseLocalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const str = String(value).trim();
    const match = str.match(DATE_ONLY_REGEX);
    if (match) return new Date(`${match[1]}T00:00:00`);

    const parsed = new Date(str);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const getTransactionDateKey = (tx) => {
    return formatLocalDate(tx?.date) || formatLocalDate(tx?.createdAt) || null;
};
