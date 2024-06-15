import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
    return (
        <footer className="footer">
            <Container>
                <Row>
                    <Col className="text-center">
                        <p className='mb-1'>Manage all your trip and party expenses effortlessly. Contact us at: <a href="mailto:bantiprajapati30@gmail.com">bantiprajapati30@gmail.com</a></p>
                        <p className='mb-0'>Powered by Banti Prajapati &copy; 2024 All Rights Reserved</p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

export default Footer;
