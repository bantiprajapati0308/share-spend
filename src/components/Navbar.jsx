import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import Logo from '../assets/images/logo.png'
function NavigationBar() {
    return (
        <Navbar sticky="top" className='shadow' bg="light" variant="light" expand="lg">
            <Navbar.Brand className='ms-3' as={NavLink} to="/"> Share<img src={Logo} alt="" />Spend</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">
                    <Nav.Link as={NavLink} to="/share-spend">Trip</Nav.Link>
                    <Nav.Link as={NavLink} to="/share-spend/members">Members</Nav.Link>
                    <Nav.Link as={NavLink} to="/share-spend/expenses">Expenses</Nav.Link>
                    <Nav.Link as={NavLink} to="/share-spend/report">Report</Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}

export default NavigationBar;
