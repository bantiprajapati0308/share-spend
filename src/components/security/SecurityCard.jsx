/* eslint-disable react/prop-types */
import { ShieldLock } from 'react-bootstrap-icons';
import styles from './Security.module.scss';

function SecurityCard({ title, subtitle, status, icon: Icon = ShieldLock, children }) {
  return (
    <div className={`${styles.card} p-3 h-100`}>
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="d-flex align-items-start gap-3">
          <div className={styles.iconTile}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="h6 fw-bold mb-1">{title}</h3>
            <p className="small text-muted mb-0">{subtitle}</p>
          </div>
        </div>
        {status && <span className={`${styles.statusBadge} ${status === 'Enabled' ? styles.statusEnabled : ''}`}>{status}</span>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default SecurityCard;
