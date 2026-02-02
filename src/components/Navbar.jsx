import React, { useRef, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { Navbar, Nav, Container, Row, Col, Button } from 'react-bootstrap';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import Logo from '../assets/images/logo.png';
import styles from '../assets/scss/Expense.module.scss';
import { HouseDoor, People, Wallet2, BarChart, BoxArrowRight } from 'react-bootstrap-icons';
import { useSelector } from 'react-redux';

function NavigationBar() {
    const [expanded, setExpanded] = useState(false);
    const navRef = useRef();
    const navigate = useNavigate();
    const tripDetails = useSelector(state => state.trip);
    const user = auth.currentUser;
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
    const handleNavClick = () => {
        setExpanded(false);
    };
    const tripId = tripDetails && tripDetails?.trip?.id ? tripDetails?.trip?.id : '';
    // Responsive: detect mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 992);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/share-spend/login"); // Redirect to home after logout
        window.location.reload();
    };

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
                                    <NavLink to="/share-spend/trip" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                        <HouseDoor size={20} className="me-2" />
                                        <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Trip</span>
                                    </NavLink>
                                </Col>
                                <Col xs={6} className={styles.menuCol}>
                                    <NavLink to={`/share-spend/members/${tripId}`} className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                        <People size={20} className="me-2" />
                                        <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Members</span>
                                    </NavLink>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={6} className={styles.menuCol}>
                                    <NavLink to={`/share-spend/expenses/${tripId}`} className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                        <Wallet2 size={20} className="me-2" />
                                        <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Expenses</span>
                                    </NavLink>
                                </Col>
                                <Col xs={6} className={styles.menuCol}>
                                    <NavLink to={`/share-spend/report/${tripId}`} className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                        <BarChart size={20} className="me-2" />
                                        <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Report</span>
                                    </NavLink>
                                </Col>
                            </Row>
                        </div>
                    ) : (
                        <Nav className="justify-content-start">
                            <div className={styles.desktopMenuWrap}>
                                <NavLink to="/share-spend/trip" className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                    <HouseDoor size={16} className="me-2" />
                                    <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Trip</span>
                                </NavLink>
                                <NavLink to={`/share-spend/members/${tripId}`} className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                    <People size={16} className="me-2" />
                                    <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Members</span>
                                </NavLink>
                                <NavLink to={`/share-spend/expenses/${tripId}`} className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                    <Wallet2 size={16} className="me-2" />
                                    <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Expenses</span>
                                </NavLink>
                                <NavLink to={`/share-spend/report/${tripId}`} className={styles.gridNavItem} onClick={handleNavClick} style={{ textDecoration: 'none' }}>
                                    <BarChart size={16} className="me-2" />
                                    <span className={styles.menuTitle} style={{ fontSize: '0.9rem' }}>Report</span>
                                </NavLink>
                            </div>
                        </Nav>
                    )}
                    <Navbar.Collapse className="justify-content-end">
                        <div className='d-flex align-items-center justify-content-between'>
                            <div className={styles.userInfo}>{user.photoURL && <img src={user.photoURL} alt={user.displayName} />}{user.displayName ?? user.email}</div>
                            <Button
                                variant="outline-danger"
                                onClick={handleLogout}
                                className={styles.logoutBtn}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    boxShadow: 'none',
                                    padding: '0.4rem 0.6rem'
                                }}
                            >
                                <BoxArrowRight size={22} color="#dc3545" />
                            </Button>
                        </div>
                    </Navbar.Collapse>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;
