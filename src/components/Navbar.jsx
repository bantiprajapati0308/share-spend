import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import Logo from '../assets/images/logo.png'
function NavigationBar() {
    return (
        <Navbar sticky="top" className='shadow' bg="dark" variant="dark" expand="lg">
            <Navbar.Brand className='ms-3' as={NavLink} to="/"> Share<img src={Logo} alt="" />Spend</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">
                    <Nav.Link as={NavLink} to="/trip">Trip</Nav.Link>
                    <Nav.Link as={NavLink} to="/members">Members</Nav.Link>
                    <Nav.Link as={NavLink} to="/expenses">Expenses</Nav.Link>
                    <Nav.Link as={NavLink} to="/report">Report</Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}

export default NavigationBar;
