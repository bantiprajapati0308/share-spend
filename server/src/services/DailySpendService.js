const { compareDateStrings, normalizeDateString } = require('../utils/dateUtils');
const DailySpendRepository = require('../repositories/DailySpendRepository');

class DailySpendService {
    computeLastSpendEntryOnAdd(transactionDate, currentLastSpendEntry) {
        const normalizedDate = normalizeDateString(transactionDate);
        if (!normalizedDate) return currentLastSpendEntry || null;
        if (!currentLastSpendEntry) return normalizedDate;
        return compareDateStrings(normalizedDate, currentLastSpendEntry) > 0 ? normalizedDate : currentLastSpendEntry;
    }

    computeLastSpendEntryOnUpdate(oldDate, oldType, newDate, newType, currentLastSpendEntry) {
        const normalizedOld = normalizeDateString(oldDate);
        const normalizedNew = normalizeDateString(newDate);

        if (oldType !== 'spend' && newType === 'spend') {
            return this.computeLastSpendEntryOnAdd(normalizedNew, currentLastSpendEntry);
        }

        if (oldType === 'spend' && newType !== 'spend') {
            if (normalizedOld !== currentLastSpendEntry) {
                return currentLastSpendEntry;
            }
            return null;
        }

        if (oldType !== 'spend' && newType !== 'spend') {
            return currentLastSpendEntry;
        }

        if (!normalizedNew) {
            return normalizedOld === currentLastSpendEntry ? null : currentLastSpendEntry;
        }

        if (normalizedOld === currentLastSpendEntry) {
            if (normalizedNew === normalizedOld) {
                return currentLastSpendEntry;
            }
            if (compareDateStrings(normalizedNew, normalizedOld) > 0) {
                return normalizedNew;
            }
            return null;
        }

        return compareDateStrings(normalizedNew, currentLastSpendEntry) > 0 ? normalizedNew : currentLastSpendEntry;
    }

    async computeLastSpendEntryOnDelete(uid, deletedDate, deletedType, currentLastSpendEntry) {
        if (deletedType !== 'spend') {
            return currentLastSpendEntry;
        }

        const normalizedDeleted = normalizeDateString(deletedDate);
        if (!normalizedDeleted || normalizedDeleted !== currentLastSpendEntry) {
            return currentLastSpendEntry;
        }

        return DailySpendRepository.getLatestSpendDate(uid);
    }
}

module.exports = new DailySpendService();
