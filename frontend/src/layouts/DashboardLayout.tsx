import React from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout: React.FC = () => (
  <div className="min-h-screen w-full bg-background text-foreground">
    <Header />
    <div className="flex">
      <aside className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-[240px] bg-content1 border-r border-divider">
        <Sidebar />
      </aside>
      <main className="flex-1 min-w-0 px-6 py-8 md:ml-[240px]">
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;
