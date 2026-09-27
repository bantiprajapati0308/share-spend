import PropTypes from 'prop-types';
import { CheckCircleFill, ExclamationTriangleFill, Trash3 } from 'react-bootstrap-icons';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { DAILY_SPEND_SYNC_CHOICES } from '../utils/dailySpendSync';
import styles from '../styles/BorrowLendAIReview.module.scss';

const ACTIONS = [
    { value: 'lend', label: 'Lend money', ledgerType: TRANSACTION_TYPES.GAVE },
    { value: 'borrow', label: 'Borrow money', ledgerType: TRANSACTION_TYPES.TOOK },
    { value: 'return', label: 'Money returned', ledgerType: TRANSACTION_TYPES.GAVE },
    { value: 'repay', label: 'Repay borrowing', ledgerType: TRANSACTION_TYPES.TOOK },
];

const actionFor = (value) => ACTIONS.find((action) => action.value === value) || ACTIONS[0];
const normalizeName = (value) => String(value || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');

function findNameMatch(name, actionValue, people) {
    const normalized = normalizeName(name);
    if (!normalized) return { status: 'missing', candidates: [] };
    const ledgerType = actionFor(actionValue).ledgerType;
    const names = [...new Set(people.filter((person) => person.type === ledgerType).map((person) => person.personName))];
    const exact = names.find((personName) => normalizeName(personName) === normalized);
    if (exact) return { status: 'exact', matchedName: exact, candidates: [exact] };
    const tokens = normalized.split(' ');
    const candidates = names.filter((personName) => {
        const knownName = normalizeName(personName);
        return knownName.startsWith(`${normalized} `) || tokens.some((token) => token.length >= 3 && knownName.split(' ').some((knownToken) => knownToken.startsWith(token)));
    });
    return candidates.length ? { status: 'suggested', candidates } : { status: 'new', candidates: [] };
}

function BorrowLendAIReview({ drafts, warnings, people, saving, onChange, onRemove, onSave, onCancel }) {
    const update = (index, changes) => onChange(index, changes);
    const ready = drafts.length > 0 && drafts.every((draft) => (
        draft.personName?.trim()
        && Number(draft.amount) > 0
        && draft.date
        && new Date(`${draft.date}T00:00:00`) <= new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)
        && draft.syncToDailySpend !== null
        && (!draft.dueDate || new Date(`${draft.dueDate}T00:00:00`) >= new Date(`${draft.date}T00:00:00`))
        && (draft.personMatch?.status !== 'suggested' || draft.matchConfirmed)
    ));

    return (
        <section className={styles.review} aria-live="polite">
            <header className={styles.header}>
                <div><span className={styles.readyPill}><CheckCircleFill size={14} /> {drafts.length} draft{drafts.length === 1 ? '' : 's'}</span><h3>Review Borrow/Lend transactions</h3></div>
                <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={saving}>Back</button>
            </header>
            <p className={styles.helper}>Review each entry before saving. AI suggestions are not saved until you confirm.</p>
            {warnings.map((warning, index) => <div className={styles.warning} key={`${warning}-${index}`}><ExclamationTriangleFill size={15} />{warning}</div>)}
            <div className={styles.draftList}>
                {drafts.map((draft, index) => {
                    const action = actionFor(draft.action);
                    const sameTypePeople = people.filter((person) => person.type === action.ledgerType);
                    const candidates = draft.personMatch?.candidates || [];
                    return (
                        <article className={styles.draft} key={draft.draftId}>
                            <div className={styles.draftHeader}>
                                <strong>Transaction {index + 1}</strong>
                                <button type="button" className={styles.removeButton} onClick={() => onRemove(index)} disabled={saving} aria-label={`Remove transaction ${index + 1}`}><Trash3 size={15} /></button>
                            </div>
                            <div className={styles.fields}>
                                <label>Action<select value={draft.action} onChange={(event) => {
                                    const action = event.target.value;
                                    const personMatch = findNameMatch(draft.personName, action, people);
                                    update(index, { action, personMatch, matchConfirmed: personMatch.status !== 'suggested' });
                                }}>{ACTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                <label>Person name<input value={draft.personName || ''} onChange={(event) => update(index, { personName: event.target.value, matchConfirmed: true })} placeholder="Person name" /></label>
                                <label>Amount (₹)<input type="number" min="0.01" step="0.01" value={draft.amount ?? ''} onChange={(event) => update(index, { amount: event.target.value })} /></label>
                                <label>Date<input type="date" value={draft.date || ''} onChange={(event) => update(index, { date: event.target.value })} /></label>
                                {['lend', 'borrow'].includes(draft.action) && <label>Due date (optional)<input type="date" value={draft.dueDate || ''} min={draft.date || undefined} onChange={(event) => update(index, { dueDate: event.target.value || null })} /></label>}
                                <label className={styles.descriptionField}>Notes<input value={draft.description || ''} onChange={(event) => update(index, { description: event.target.value })} placeholder="Optional details" /></label>
                            </div>
                            {draft.personMatch?.status === 'suggested' && !draft.matchConfirmed && <div className={styles.matchWarning}>
                                <ExclamationTriangleFill size={16} /><span>Did you mean an existing person?</span>
                                <select defaultValue="" onChange={(event) => {
                                    if (!event.target.value) return;
                                    update(index, { personName: event.target.value, matchConfirmed: true });
                                }} aria-label="Confirm suggested person">
                                    <option value="">Choose a match</option>
                                    {candidates.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
                                    <option value={draft.personName}>Use “{draft.personName}” as a new person</option>
                                </select>
                                {sameTypePeople.length > 0 && <small>Suggestions are limited to existing people with this lend/borrow direction.</small>}
                            </div>}
                            {draft.personMatch?.status === 'exact' && <p className={styles.matchExact}><CheckCircleFill size={14} /> Matched existing person: {draft.personMatch.matchedName}</p>}
                            <fieldset className={styles.syncChoice}>
                                <legend>Add this transaction to Daily Spend?</legend>
                                <label><input type="radio" name={`sync-${draft.draftId}`} checked={draft.syncToDailySpend === DAILY_SPEND_SYNC_CHOICES.YES} onChange={() => update(index, { syncToDailySpend: DAILY_SPEND_SYNC_CHOICES.YES })} /> Yes</label>
                                <label><input type="radio" name={`sync-${draft.draftId}`} checked={draft.syncToDailySpend === DAILY_SPEND_SYNC_CHOICES.NO} onChange={() => update(index, { syncToDailySpend: DAILY_SPEND_SYNC_CHOICES.NO })} /> No</label>
                            </fieldset>
                        </article>
                    );
                })}
            </div>
            <footer className={styles.footer}>
                <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={saving}>Cancel</button>
                <button type="button" className={styles.saveButton} onClick={onSave} disabled={!ready || saving}>{saving ? 'Saving…' : `Save ${drafts.length} transaction${drafts.length === 1 ? '' : 's'}`}</button>
            </footer>
            {!ready && <p className={styles.validation}>Enter each name, valid amount and date; confirm suggested names and choose a Daily Spend option.</p>}
        </section>
    );
}

BorrowLendAIReview.propTypes = {
    drafts: PropTypes.arrayOf(PropTypes.object).isRequired,
    warnings: PropTypes.arrayOf(PropTypes.string).isRequired,
    people: PropTypes.arrayOf(PropTypes.object).isRequired,
    saving: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default BorrowLendAIReview;