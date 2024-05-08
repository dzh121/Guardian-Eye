import React from "react";
import { useLocation, Link as RouterLink } from "react-router-dom"; // Import RouterLink for internal navigation
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
      style={{
        backgroundColor: "var(--header-background-color)",
      }}
    >
      <Navbar isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
        {/* Always visible NavbarBrand at the top for all screen sizes */}
        <NavbarContent className="flex justify-between sm:justify-center">
          <NavbarBrand>
            <RouterLink
              to="/home"
              style={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <img
                src={"icon512.png"}
                alt="App Icon"
                style={{ height: "30px", marginRight: "10px" }}
              />
              <p className="font-bold text-inherit">Guardian Eye</p>
            </RouterLink>
          </NavbarBrand>
          {isLoggedIn && (
            <NavbarMenuToggle
              className="sm:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            />
          )}
        </NavbarContent>

        {/* Hidden on small screens, visible on medium and larger screens */}
        {isLoggedIn && (
          <NavbarContent className="hidden sm:flex gap-6" justify="center">
            {menuItems.map((item, index) => (
              <NavbarItem
                key={index}
                isActive={currentLocation.pathname === item.path}
              >
                <Link color="foreground" href={item.path}>
                  {item.label}
                </Link>
              </NavbarItem>
            ))}
            {!isMenuOpen && (
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
          </NavbarContent>
        )}
        {/* Dynamic visibility based on menu open/close state */}
        {isLoggedIn && (
          <NavbarMenu className="sm:hidden">
            {menuItems.map((item, index) => (
              <NavbarMenuItem
                key={index}
                isActive={currentLocation.pathname === item.path}
              >
                <Link color="foreground" href={item.path}>
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
            {isMenuOpen && (
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
          </NavbarMenu>
        )}
      </Navbar>
    </div>
  );
};

export default Header;
