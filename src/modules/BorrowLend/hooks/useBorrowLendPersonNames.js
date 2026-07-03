import { useCallback, useEffect, useState } from 'react';
import { borrowLendApi } from '../../../services/api/borrowLendApi';

const namesCache = new Map();
const inFlightRequests = new Map();
const listeners = new Set();

const getCacheKey = (type) => type || 'all';

const notifyListeners = () => {
    listeners.forEach((listener) => listener());
};

export const primeBorrowLendPersonName = (type, personName) => {
    const normalizedName = String(personName || '').trim();
    if (!normalizedName) return;

    const key = getCacheKey(type);
    const current = namesCache.get(key) || [];
    if (!current.some(name => name.toLowerCase() === normalizedName.toLowerCase())) {
        namesCache.set(key, [...current, normalizedName].sort((a, b) => a.localeCompare(b)));
    }

    const allNames = namesCache.get('all') || [];
    if (!allNames.some(name => name.toLowerCase() === normalizedName.toLowerCase())) {
        namesCache.set('all', [...allNames, normalizedName].sort((a, b) => a.localeCompare(b)));
    }

    notifyListeners();
};

export function useBorrowLendPersonNames(type) {
    const key = getCacheKey(type);
    const [names, setNames] = useState(() => namesCache.get(key) || []);
    const [loading, setLoading] = useState(!namesCache.has(key));
    const [error, setError] = useState(null);

    const syncFromCache = useCallback(() => {
        setNames(namesCache.get(key) || []);
    }, [key]);

    useEffect(() => {
        listeners.add(syncFromCache);
        return () => listeners.delete(syncFromCache);
    }, [syncFromCache]);

    useEffect(() => {
        let cancelled = false;

        if (namesCache.has(key)) {
            setNames(namesCache.get(key));
            setLoading(false);
            return () => { cancelled = true; };
        }

        setNames([]);

        const fetchNames = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!inFlightRequests.has(key)) {
                    inFlightRequests.set(key, borrowLendApi.getPersonNames(type));
                }

                const result = await inFlightRequests.get(key);
                if (!result.success) throw new Error(result.error || 'Failed to load person names');

                const nextNames = Array.isArray(result.data) ? result.data : [];
                namesCache.set(key, nextNames);
                if (!cancelled) setNames(nextNames);
                notifyListeners();
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Failed to load person names');
                    setNames([]);
                }
            } finally {
                inFlightRequests.delete(key);
                if (!cancelled) setLoading(false);
            }
        };

        fetchNames();

        return () => { cancelled = true; };
    }, [key, type]);

    return { names, loading, error };
}
