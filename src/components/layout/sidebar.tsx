"use client";

import {
  Camera,
  Cpu,
  Droplet,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  Sprout,
  ThermometerSun,
  User,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import Button from "../ui/button";
import {IMAGES} from "@/src/assets";

// type NavItem = {
//   name: string;
//   href: string;
//   icon: React.ElementType;
// };

const ROLE_MENUS = {
  OWNER: [
    {name: "Dashboard", href: "/dashboard", icon: LayoutDashboard},
    {name: "Greenhouse", href: "/dashboard/greenhouse", icon: Home},
    {name: "Staff", href: "/dashboard/staff", icon: Users},
    {name: "Staff Role", href: "/dashboard/staff-role", icon: UserCog},
    {name: "Device", href: "/dashboard/device", icon: Cpu},
    {name: "Device Cam", href: "/dashboard/device-cam", icon: Camera},
    {name: "Area", href: "/dashboard/area", icon: Map},
  ],
  SUPER_ADMIN: [
    {name: "Dashboard", href: "/dashboard", icon: LayoutDashboard},
    {name: "User", href: "/dashboard/users", icon: Users},
  ],
};

type RoleType = keyof typeof ROLE_MENUS;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleType;
}

export default function Sidebar({isOpen, onClose, role}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentRole = role?.toUpperCase() as RoleType;
  const currentNavItems = ROLE_MENUS[currentRole] || ROLE_MENUS.OWNER;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userData");
    return router.push("/signin");
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/20 z-20 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-20 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            {/* Logo Gambar Urken */}
            <img
              src={IMAGES.logo}
              alt="UrKen Logo"
              className="w-9 h-9 object-contain rounded-lg"
            />
            {/* Teks Nama Baru */}
            <span className="text-lg font-extrabold tracking-wide text-gray-850 leading-tight">
              The Origin{" "}
              <span className="text-green-600 block text-xs font-semibold tracking-normal">
                UrKen Platform
              </span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {currentNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-green-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 shrink-0 mt-auto">
          <Button
            onClick={handleLogout}
            variant="danger"
            className="flex items-center justify-center gap-3 w-full py-2.5 shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
