import React from "react";
import { Navbar as BootstrapNavbar, Nav, Container } from "react-bootstrap";

function AppNavbar() {
  return (
    <BootstrapNavbar bg="danger" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand href="/">BloodHeroes</BootstrapNavbar.Brand>
         <div>
           <img
             src="/icon.jpg"
             class="rounded"
             alt="Blood Donation App"
             style={{ height: "80px" }}
             className="mb-3"
           />
         </div>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="/login">Donor's Login</Nav.Link>
            <Nav.Link href="/signup">Signup</Nav.Link>
             <Nav.Link href="/RequesterDashboard">Request for Blood </Nav.Link>
             <Nav.Link href="/About">About </Nav.Link>
            {/* Add more links as needed */}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default AppNavbar;