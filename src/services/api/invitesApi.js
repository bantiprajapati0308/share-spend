import apiClient from '../apiClient';

export const invitesApi = {
    /**
     * Get all pending invites for the current user's email.
     * Called post-login to surface join-trip prompts.
     * @param {string} email
     */
    getPendingInvites: (email) =>
        apiClient.get(`/api/invites/pending?email=${encodeURIComponent(email)}`),

    /**
     * Accept a trip invite.
     * @param {string} tripId
     * @param {string} inviteId  (tripMembers doc ID)
     */
    acceptInvite: (tripId, inviteId) => apiClient.patch(`/api/invites/${tripId}/${inviteId}/accept`, {}),

    /**
     * Reject a trip invite.
     * @param {string} tripId
     * @param {string} inviteId  (tripMembers doc ID)
     */
    rejectInvite: (tripId, inviteId) => apiClient.patch(`/api/invites/${tripId}/${inviteId}/reject`, {}),
};
