import { TelephoneFill, EnvelopeFill, Globe, ChevronRight } from 'react-bootstrap-icons';
import { CONTACT_ITEMS } from '../constants/helpData';
import styles from '../styles/HelpCenter.module.scss';

const CONTACT_ICONS = {
    phone: <TelephoneFill size={20} />,
    email: <EnvelopeFill size={20} />,
    website: <Globe size={20} />,
};

function ContactUs() {
    return (
        <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact Us</h3>
            <p className={styles.sectionSubtitle}>Reach out to us through any of these channels</p>
            <div className={styles.contactList}>
                {CONTACT_ITEMS.map(item => (
                    <button
                        key={item.id}
                        className={styles.contactItem}
                        onClick={item.action}
                        aria-label={item.title}
                    >
                        <div
                            className={styles.contactIcon}
                            style={{ background: item.bg, color: item.color }}
                        >
                            {CONTACT_ICONS[item.id]}
                        </div>
                        <div className={styles.contactBody}>
                            <p className={styles.contactTitle}>{item.title}</p>
                            <p className={styles.contactPrimary}>{item.primary}</p>
                            <p className={styles.contactSecondary}>{item.secondary}</p>
                        </div>
                        <ChevronRight className={styles.contactChevron} />
                    </button>
                ))}
            </div>
        </section>
    );
}

export default ContactUs;
