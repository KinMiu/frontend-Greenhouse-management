"use client";

import {Bell, Menu} from "lucide-react";
import Button from "../ui/button";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({onMenuClick}: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onMenuClick} className="p-2 md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Button variant="ghost" className="p-2">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-700 font-bold text-sm group-hover:bg-green-200 transition-colors">
            JD
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              John Doe
            </p>
            <p className="text-xs text-gray-500">Farm Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
