import React from 'react';
import styles from '../assets/scss/Footer.module.scss';
import { EnvelopeFill } from 'react-bootstrap-icons';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <span className={styles.contact}>
                    <EnvelopeFill size={14} className="me-1 text-primary" />
                    <a href="mailto:bantiprajapati30@gmail.com" style={{ color: '#1e62d0', textDecoration: 'none', fontWeight: 500 }}>Contact</a>
                </span>
                <span className={styles.copyright}>
                    &copy; 2025 Banti Prajapati
                </span>
            </div>
        </footer>
    );
};

export default Footer;