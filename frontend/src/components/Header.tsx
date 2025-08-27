import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button,
  Image,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

const Header: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuItems = [
    { icon: "lucide:home", label: "Overview", to: "/" },
    { icon: "lucide:git-branch", label: "Register", to: "/candidates/register" },
    { icon: "lucide:bar-chart", label: "Search", to: "/search" },
    // Add more items as needed
  ];

  // Prefer full name, then username, then email
  const displayName = useMemo(() => {
    if (!user) return "Guest";
    return user.username || user.email || "User";
  }, [user]);

  const emailOrUser = user?.email || user?.username || "";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="bg-content1 py-4 px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex justify-between items-center">
        <Image src="/logo.png" width={180} alt="ArconJobs" />

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-4">
          <Button color="primary" className="text-white">
            <Icon icon="lucide:plus" className="mr-2" />
            New Workflow
          </Button>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform cursor-pointer"
                name={displayName}
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">
                  {loading ? "Loading…" : "Signed in as"}
                </p>
                <p className="font-semibold truncate">
                  {loading ? "…" : emailOrUser}
                </p>
              </DropdownItem>
              <DropdownItem key="settings">My Settings</DropdownItem>
              <DropdownItem key="team_settings">Team Settings</DropdownItem>
              <DropdownItem key="analytics">Analytics</DropdownItem>
              <DropdownItem key="system">System</DropdownItem>
              <DropdownItem key="configurations">Configurations</DropdownItem>
              <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center">
          <Button isIconOnly onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon icon="lucide:menu" className="h-6 w-6" />
          </Button>
          {menuOpen && (
            <div className="fixed inset-0 bg-content1 z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-divider">
                <img src="/logo.png" alt="Logo" className="h-10" />
                <Button isIconOnly onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <Icon icon="lucide:x" className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                {menuItems.map((item, index) => (
                  <Link to={item.to} key={index} className="w-full block" onClick={() => setMenuOpen(false)}>
                    <Button
                      startContent={<Icon icon={item.icon} />}
                      className={`justify-center text-lg w-full py-4 px-6 rounded-xl shadow-sm mb-0 ${
                        location.pathname === item.to ? 'bg-primary text-white' : 'bg-transparent text-foreground-500 border border-divider'
                      }`}
                      style={{ marginBottom: '0.5rem' }}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
              <div className="border-t border-divider mx-6" />
              <div className="p-6 flex flex-col items-center">
                <Avatar
                  isBordered
                  className="mb-2"
                  name={displayName}
                  src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                />
                <div className="text-center">
                  <div className="font-semibold text-lg">{loading ? "Loading…" : displayName}</div>
                  <div className="text-secondary text-sm">{loading ? "…" : emailOrUser}</div>
                </div>
                <Button color="danger" className="mt-4 w-full" onPress={handleLogout}>
                  Log Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
