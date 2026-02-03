import React from 'react';
import { Accordion } from 'react-bootstrap';
import styles from '../../assets/scss/Report.module.scss';

function ReportAccordion({ activeKey, onSelect, eventKey, icon: Icon, title, children }) {
    return (
        <Accordion activeKey={activeKey} className='mb-2' onSelect={onSelect} defaultActiveKey={eventKey} alwaysOpen>
            <Accordion.Item eventKey={eventKey} className={styles.accordionItem}>
                <Accordion.Header>
                    {Icon && <Icon className="me-2 mb-1" size={20} />}
                    {title}
                </Accordion.Header>
                <Accordion.Body className='px-2'>
                    {children}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}

export default ReportAccordion;