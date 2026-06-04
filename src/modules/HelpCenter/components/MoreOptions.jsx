import { SUPPORT_EMAIL } from '../constants/helpData';
import styles from '../styles/HelpCenter.module.scss';

const MORE_OPTIONS = [
    {
        id: 'bug',
        icon: 'bi-bug-fill',
        color: '#fd7e14',
        bg: '#fff3e0',
        title: 'Report a Bug',
        subtitle: 'Found something not working?',
        subject: 'Bug Report — Share Spend',
        body: 'Hi,\n\nI found a bug in Share Spend:\n\n[Describe the issue here]\n\nSteps to reproduce:\n1. \n2. \n\nExpected behaviour:\nActual behaviour:\n',
    },
    {
        id: 'feature',
        icon: 'bi-lightbulb-fill',
        color: '#667eea',
        bg: '#f0f4ff',
        title: 'Suggest a Feature',
        subtitle: 'Have an idea to improve the app?',
        subject: 'Feature Suggestion — Share Spend',
        body: 'Hi,\n\nI have a feature suggestion for Share Spend:\n\n[Describe your idea here]\n\nWhy it would be useful:\n',
    },
];

function MoreOptions() {
    const openMail = (option) => {
        const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(option.subject)}&body=${encodeURIComponent(option.body)}`;
        window.open(mailto);
    };

    return (
        <section className={styles.section}>
            <h3 className={styles.sectionTitle}>More Options</h3>
            <div className={styles.moreOptionsGrid}>
                {MORE_OPTIONS.map(opt => (
                    <button
                        key={opt.id}
                        className={styles.moreOptionCard}
                        onClick={() => openMail(opt)}
                        aria-label={opt.title}
                    >
                        <div
                            className={styles.moreOptionIcon}
                            style={{ background: opt.bg, color: opt.color }}
                        >
                            <i className={`bi ${opt.icon}`} />
                        </div>
                        <div className={styles.moreOptionBody}>
                            <p className={styles.moreOptionTitle}>{opt.title}</p>
                            <p className={styles.moreOptionSubtitle}>{opt.subtitle}</p>
                        </div>
                        <i className={`bi bi-chevron-right ${styles.moreOptionChevron}`} />
                    </button>
                ))}
            </div>
        </section>
    );
}

export default MoreOptions;
