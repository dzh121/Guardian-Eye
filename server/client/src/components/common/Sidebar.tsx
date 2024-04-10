import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarMenu,
  NavbarContent,
  Button,
} from "@nextui-org/react";
import { Link } from "react-router-dom";

type NavbarProps = {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
};

const Sidebar: React.FC<NavbarProps> = ({
  isMenuOpen,
  toggleMenu,
  isLoggedIn,
  onLogout,
}) => {
  return (
    <Navbar isBordered isMenuOpen={isMenuOpen} onMenuOpenChange={toggleMenu}>
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={toggleMenu}
        />
      </NavbarContent>

      <NavbarContent className="sm:hidden pr-3" justify="center">
        <NavbarBrand>
          <p className="font-bold text-inherit">ACME</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarMenu>
        <NavbarMenuItem>
          <Link className="w-full" to="/home">
            Home
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link className="w-full" to="/livefeed">
            Live Feed
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link className="w-full" to="/SecurityFootage">
            Security Footage
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link className="w-full" to="/familiarFaces">
            Familiar Faces
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link className="w-full" to="/settings">
            Settings
          </Link>
        </NavbarMenuItem>
        {isLoggedIn && (
          <NavbarMenuItem>
            <Button className="w-full" color="warning" onClick={onLogout}>
              Log Out
            </Button>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
};
