import { useCallback, useEffect, useState } from 'react';
import { borrowLendApi } from '../../../services/api/borrowLendApi';

const namesCache = new Map();
const peopleCache = new Map();
const inFlightRequests = new Map();
const listeners = new Set();

const getCacheKey = (type) => type || 'all';

const notifyListeners = () => {
    listeners.forEach((listener) => listener());
};

const buildPeopleFromNames = (names, type) => names.map((name) => ({
    personName: name,
    mobileNumber: '',
    email: '',
    type: type || '',
}));

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

export const primeBorrowLendPersonContact = (type, person) => {
    const normalizedName = String(person?.personName || '').trim();
    if (!normalizedName) return;

    const nextPerson = {
        personName: normalizedName,
        mobileNumber: person.mobileNumber || '',
        email: person.email || '',
        type: person.type || type || '',
    };

    [getCacheKey(type), 'all'].forEach((key) => {
        const currentPeople = peopleCache.get(key) || [];
        const existingIndex = currentPeople.findIndex(
            (item) => item.personName.toLowerCase() === normalizedName.toLowerCase()
        );

        const nextPeople = existingIndex >= 0
            ? currentPeople.map((item, index) => index === existingIndex ? { ...item, ...nextPerson } : item)
            : [...currentPeople, nextPerson];

        peopleCache.set(key, nextPeople.sort((a, b) => a.personName.localeCompare(b.personName)));
    });

    primeBorrowLendPersonName(type, normalizedName);
};

export function useBorrowLendPersonNames(type) {
    const key = getCacheKey(type);
    const [names, setNames] = useState(() => namesCache.get(key) || []);
    const [people, setPeople] = useState(() => peopleCache.get(key) || []);
    const [loading, setLoading] = useState(!namesCache.has(key));
    const [error, setError] = useState(null);

    const syncFromCache = useCallback(() => {
        setNames(namesCache.get(key) || []);
        setPeople(peopleCache.get(key) || buildPeopleFromNames(namesCache.get(key) || [], type));
    }, [key, type]);

    useEffect(() => {
        listeners.add(syncFromCache);
        return () => listeners.delete(syncFromCache);
    }, [syncFromCache]);

    useEffect(() => {
        let cancelled = false;

        if (namesCache.has(key)) {
            const cachedNames = namesCache.get(key);
            setNames(cachedNames);
            setPeople(peopleCache.get(key) || buildPeopleFromNames(cachedNames, type));
            setLoading(false);
            return () => { cancelled = true; };
        }

        setNames([]);
        setPeople([]);

        const fetchNames = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!inFlightRequests.has(key)) {
                    inFlightRequests.set(key, borrowLendApi.getPersonNames(type));
                }

                const result = await inFlightRequests.get(key);
                if (!result.success) throw new Error(result.error || 'Failed to load person names');

                const rawPeople = Array.isArray(result.data) ? result.data : [];
                const nextPeople = rawPeople.map((item) => {
                    if (typeof item === 'string') {
                        return { personName: item, mobileNumber: '', email: '', type: type || '' };
                    }

                    return {
                        id: item.id,
                        personName: item.personName || item.name || '',
                        mobileNumber: item.mobileNumber || '',
                        email: item.email || '',
                        type: item.type || type || '',
                    };
                }).filter((item) => item.personName);
                const nextNames = nextPeople.map((item) => item.personName);
                peopleCache.set(key, nextPeople);
                namesCache.set(key, nextNames);
                if (!cancelled) {
                    setNames(nextNames);
                    setPeople(nextPeople);
                }
                notifyListeners();
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Failed to load person names');
                    setNames([]);
                    setPeople([]);
                }
            } finally {
                inFlightRequests.delete(key);
                if (!cancelled) setLoading(false);
            }
        };

        fetchNames();

        return () => { cancelled = true; };
    }, [key, type]);

    return { names, people, loading, error };
}
