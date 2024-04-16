import React from "react";
import { useLocation } from "react-router-dom";
import {
  Navbar,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarMenu,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@nextui-org/react";

interface HeaderProps {
  isLoggedIn: boolean;
  handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, handleLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const currentLocation = useLocation();
  const menuItems = [
    { label: "Home", path: "/home" },
    { label: "Live Feed", path: "/liveFeed" },
    { label: "Security Footage", path: "/SecurityFootage" },
    { label: "Familiar Faces", path: "/familiarFaces" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <div
      className="header"
      style={{ backgroundColor: "var(--header-background-color)" }}
    >
      <Navbar isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarBrand>
            <img
              src={"icon512.png"}
              alt="App Icon"
              style={{ height: "30px", marginRight: "10px" }}
            />
            <p className="font-bold text-inherit">Guardian Eye</p>
          </NavbarBrand>
          {isLoggedIn &&
            menuItems.map((item, index) => (
              <NavbarItem
                key={index}
                isActive={currentLocation.pathname === item.path}
              >
                <Link color="foreground" href={item.path}>
                  {item.label}
                </Link>
              </NavbarItem>
            ))}
          {!isMenuOpen && isLoggedIn && (
            <NavbarItem>
              <Button
                as={Link}
                color="danger"
                href="#"
                variant="flat"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </NavbarItem>
          )}
          {!isLoggedIn && (
            <>
              <NavbarItem>
                <Button
                  as={Link}
                  color="warning"
                  href="/register"
                  variant="flat"
                >
                  Register
                </Button>
              </NavbarItem>
              <NavbarItem>
                <Button as={Link} color="warning" href="/login" variant="flat">
                  Log In
                </Button>
              </NavbarItem>
            </>
          )}
        </NavbarContent>

        <NavbarMenu>
          {isLoggedIn &&
            menuItems.map((item, index) => (
              <NavbarMenuItem
                key={index}
                isActive={currentLocation.pathname === item.path}
              >
                <Link color="foreground" href={item.path}>
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          {isMenuOpen && isLoggedIn && (
            <NavbarMenuItem>
              <Button
                as={Link}
                color="danger"
                href="#"
                variant="flat"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </NavbarMenuItem>
          )}
          {!isLoggedIn && (
            <>
              <NavbarMenuItem>
                <Button
                  as={Link}
                  color="warning"
                  href="/register"
                  variant="flat"
                >
                  Register
                </Button>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Button as={Link} color="warning" href="/login" variant="flat">
                  Log In
                </Button>
              </NavbarMenuItem>
            </>
          )}
        </NavbarMenu>

        {/* <NavbarContent justify="end">
        <NavbarItem>
          <Button
            as={Link}
            color="warning"
            href="/register"
            variant="flat"
            disabled={isMenuOpen}
          >
            Register
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button
            as={Link}
            color="warning"
            href="/login"
            variant="flat"
            disabled={isMenuOpen}
          >
            Log In
          </Button>
        </NavbarItem>
      </NavbarContent> */}

        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          />
        </NavbarContent>
      </Navbar>
    </div>
  );
};

export default Header;
