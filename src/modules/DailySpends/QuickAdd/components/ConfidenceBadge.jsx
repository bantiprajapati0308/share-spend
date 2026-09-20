import PropTypes from 'prop-types';
import { ExclamationTriangleFill, InfoCircleFill } from 'react-bootstrap-icons';
import { confidenceTone } from '../quickAddUtils';
import styles from '../QuickAdd.module.scss';

function ConfidenceBadge({ value }) {
    const tone = confidenceTone(value);
    if (tone === 'normal') return null;

    const Icon = tone === 'alert' ? ExclamationTriangleFill : InfoCircleFill;
    return (
        <span className={`${styles.confidenceBadge} ${styles[`confidence${tone}`]}`}>
            <Icon size={12} /> {value} confidence
        </span>
    );
}

ConfidenceBadge.propTypes = { value: PropTypes.string };
export default ConfidenceBadge;
