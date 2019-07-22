/**
 * https://reactstrap.github.io/components/navbar/
 */
import React, { useState } from "react";
import {
  Container,
  Collapse,
  Nav,
  Navbar as BootstrapNavbar,
  NavItem,
  NavbarToggler,
  NavbarBrand,
  NavLink
} from "reactstrap";

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(false);

  const postfix = process.env.NODE_ENV === "production" ? null : " (DEV)";

  return (
    <BootstrapNavbar color="dark" dark expand="md">
      <Container>
        <NavbarBrand href="https://www.aizatto.com">crdt-prototype {postfix}</NavbarBrand>
        <NavbarToggler onClick={() => setCollapsed(!collapsed)} />
        <Collapse isOpen={collapsed} navbar>
          <Nav className="ml-auto" navbar>
            <NavItem>
              <NavLink href="https://www.aizatto.com/">aizatto.com</NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="https://www.deepthoughtapp.com/">Deep Thought</NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="https://www.logbook.my/">Logbook</NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="https://github.com/aizatto/timestamp-js">GitHub</NavLink>
            </NavItem>
            <NavItem>
              <NavLink href="https://www.linkedin.com/in/aizatto">LinkedIn</NavLink>
            </NavItem>
          </Nav>
        </Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
