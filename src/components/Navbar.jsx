import React, { useRef, useEffect, useState } from 'react';
import { Navbar, Nav, Container, Row, Col } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import Logo from '../assets/images/logo.png';
import styles from '../assets/scss/Expense.module.scss';
import { HouseDoor, People, Wallet2, BarChart } from 'react-bootstrap-icons';

function NavigationBar() {
    const [expanded, setExpanded] = useState(false);
    const navRef = useRef();


    // Only allow hamburger icon to toggle navbar
    const handleToggle = (nextExpanded, event) => {
        // Only toggle if the event is from the hamburger button
        if (!event || (event && event.target && event.currentTarget && event.target === event.currentTarget)) {
            setExpanded(nextExpanded);
        }
    };

    // Close navbar when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setExpanded(false);
            }
        }
        if (expanded) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expanded]);


    // Close navbar on nav click
    const handleNavClick = () => setExpanded(false);

    // Responsive: detect mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 992);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    return (
        <Navbar
            ref={navRef}
            expanded={expanded}
            onToggle={handleToggle}
            sticky="top"
            className={`shadow ${styles.customNavbar}`}
            bg="light"
            variant="light"
            expand="lg"
        >
            <Container className="justify-content-between">
                <Navbar.Brand className={`ms-3 ${styles.brand}`} >
                    <span className={styles.logoText}>Share</span>
                    <img src={Logo} alt="" className={styles.logoImg} />
                    <span className={styles.logoText}>Spend</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" className={styles.customToggler} />
                <Navbar.Collapse id="basic-navbar-nav">
                    {isMobile ? (
                        <div className={styles.mobileMenuGrid}>
                            <Row>
                                <Col xs={6} className={styles.menuCol}>
                                    <NavLink to="/share-spend" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                        <HouseDoor size={20} className="me-2" />
                                        <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Trip</span>
                                    </NavLink>
                                </Col>
                                <Col xs={6} className={styles.menuCol}>
                                    <NavLink to="/share-spend/members" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                        <People size={20} className="me-2" />
                                        <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Members</span>
                                    </NavLink>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={6} className={styles.menuCol}>
                                    <NavLink to="/share-spend/expenses" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                        <Wallet2 size={20} className="me-2" />
                                        <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Expenses</span>
                                    </NavLink>
                                </Col>
                                <Col xs={6} className={styles.menuCol}>
                                    <NavLink to="/share-spend/report" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                        <BarChart size={20} className="me-2" />
                                        <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Report</span>
                                    </NavLink>
                                </Col>
                            </Row>
                        </div>
                    ) : (
                        <Nav className="justify-content-start">
                            <div className={styles.desktopMenuWrap}>
                                <NavLink to="/share-spend" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                    <HouseDoor size={16} className="me-2" />
                                    <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Trip</span>
                                </NavLink>
                                <NavLink to="/share-spend/members" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                    <People size={16} className="me-2" />
                                    <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Members</span>
                                </NavLink>
                                <NavLink to="/share-spend/expenses" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                    <Wallet2 size={16} className="me-2" />
                                    <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Expenses</span>
                                </NavLink>
                                <NavLink to="/share-spend/report" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                    <BarChart size={16} className="me-2" />
                                    <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Report</span>
                                </NavLink>
                            </div>
                        </Nav>
                    )}
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;
