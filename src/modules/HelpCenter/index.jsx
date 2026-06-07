import { useNavigate } from 'react-router-dom';
import HelpBanner from './components/HelpBanner';
import ContactUs from './components/ContactUs';
import FAQSection from './components/FAQSection';
import MoreOptions from './components/MoreOptions';
import FeedbackSection from './components/FeedbackSection';
import styles from './styles/HelpCenter.module.scss';

function HelpCenter() {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.headerBack} onClick={() => navigate(-1)} aria-label="Go back">
                    <i className="bi bi-arrow-left" />
                </button>
                <h1 className={styles.headerTitle}>Help Center</h1>
                <button className={styles.headerHelp} aria-label="Help">
                    <i className="bi bi-question-circle" />
                </button>
            </div>

            {/* Scrollable content */}
            <div className={styles.body}>
                <HelpBanner />
                <ContactUs />
                <FAQSection />
                <MoreOptions />
                <FeedbackSection />
            </div>
        </div>
    );
}

export default HelpCenter;
