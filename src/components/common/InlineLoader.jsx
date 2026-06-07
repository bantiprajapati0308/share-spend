import React from 'react';
import { Spinner } from 'react-bootstrap';
import styles from '../../assets/scss/InlineLoader.module.scss';

function InlineLoader() {
    return (
        <div className={styles.inlineLoader}>
            <Spinner animation="border" size="sm" />
        </div>
    );
}

export default InlineLoader;
