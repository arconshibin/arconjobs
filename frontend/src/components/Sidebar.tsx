import { Icon } from "@iconify/react";
import { Button } from "@heroui/react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();

  const canSeeClients = !!user?.is_superuser || !!user?.is_staff;
  const menu = [
    { icon: "lucide:home", label: "Overview", to: "/" }, ...(canSeeClients
      ? [{ icon: "lucide:users", label: "Clients", to: "/clients", }]
      : []),
    { icon: "lucide:briefcase-business", label: "Jobs", to: "/jobs" }
  ];


  const location = useLocation();
  const pathname = (location.pathname || "/").replace(/\/$/, "") || "/";

  function isActive(to: string) {
    if (to === "/") return pathname === "/";               // Overview only on exact "/"
    return pathname === to || pathname.startsWith(`${to}/`); // Section  its subroutes
  }

  return (
    <aside className="w-64 h-screen bg-content1 py-6 px-4 hidden md:block sticky top-0 border-r border-divider">
      <nav>
        {menu.map((m) => {
          const active = isActive(m.to); // adjust if you want startsWith for sections
          return (
            <Button
              key={m.to}
              as={Link}
              to={m.to}
              type="button" // prevent form-submit behavior just in case
              startContent={<Icon icon={m.icon} />}
              className={`justify-start mb-2 text-md w-full ${active ? "bg-primary text-white" : "bg-transparent text-foreground-500"
                }`}
            >
              {m.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
