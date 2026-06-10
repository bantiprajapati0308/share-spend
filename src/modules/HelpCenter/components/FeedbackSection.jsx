import { HeartFill, SendFill, ShieldFillCheck } from 'react-bootstrap-icons';
import { SUPPORT_EMAIL } from '../constants/helpData';
import styles from '../styles/HelpCenter.module.scss';

function FeedbackSection() {
    const handleFeedback = () => {
        const subject = encodeURIComponent('Feedback — Share Spend');
        const body = encodeURIComponent('Hi,\n\nHere is my feedback for Share Spend:\n\n');
        window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    };

    return (
        <>
            <section className={styles.feedbackCard}>
                <div className={styles.feedbackLeft}>
                    <div className={styles.feedbackIconCircle}>
                        <HeartFill color='red' size={20} />
                    </div>
                    <div>
                        <p className={styles.feedbackTitle}>We value your feedback</p>
                        <p className={styles.feedbackSubtitle}>
                            Your feedback helps us improve Share Spend for you.
                        </p>
                    </div>
                </div>
                <button className={styles.feedbackBtn} onClick={handleFeedback}>
                    <SendFill />
                    Send Feedback
                </button>
            </section>

            <p className={styles.privacyNote}>
                <ShieldFillCheck />
                Your privacy is important to us. We never share your information.
            </p>
        </>
    );
}

export default FeedbackSection;
