import { useState, useCallback } from 'react';
import { invitesApi } from '../../../services/api/invitesApi';

/**
 * Fetches all pending trip invites for a given email address.
 * Intended to be called once after login to surface join-trip prompts.
 *
 * Usage:
 *   const { pendingInvites, loading, refreshInvites } = useInviteCheck(user?.email);
 *
 * @param {string|null} email - The signed-in user's email
 */
function useInviteCheck(email) {
    const [pendingInvites, setPendingInvites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refreshInvites = useCallback(async () => {
        if (!email) return;
        setLoading(true);
        setError(null);
        try {
            const result = await invitesApi.getPendingInvites(email);
            if (result.success) {
                setPendingInvites(result.data || []);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [email]);

    return { pendingInvites, setPendingInvites, loading, error, refreshInvites };
}

export default useInviteCheck;
