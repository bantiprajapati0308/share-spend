import { useState } from 'react';
import { FAQ_ITEMS } from '../constants/helpData';
import styles from '../styles/HelpCenter.module.scss';

function FAQItem({ item }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`${styles.faqItem} ${open ? styles.faqItemOpen : ''}`}>
            <button
                className={styles.faqQuestion}
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
            >
                <span>{item.question}</span>
                <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-right'} ${styles.faqChevron}`} />
            </button>
            {open && (
                <div className={styles.faqAnswer}>
                    <p>{item.answer}</p>
                </div>
            )}
        </div>
    );
}

function FAQSection() {
    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Frequently Asked Questions</h3>
                <span className={styles.viewAll}>View All →</span>
            </div>
            <div className={styles.faqList}>
                {FAQ_ITEMS.map(item => (
                    <FAQItem key={item.id} item={item} />
                ))}
            </div>
        </section>
    );
}

export default FAQSection;
