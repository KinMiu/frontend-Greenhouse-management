"use client";

import Navbar from "@/src/components/layout/navbar";
import Sidebar from "@/src/components/layout/sidebar";
import {useGetMe} from "@/src/hooks/use-auth";
import React, {useState} from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {data: users = [], isLoading, isError, error} = useGetMe();
  const role = users.data?.role;
  // console.log(users.data.role);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-gray-100 flex overflow-hidden">
      <Sidebar
        role={role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
