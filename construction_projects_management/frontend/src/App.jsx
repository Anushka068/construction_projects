import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export default function App() {
  return (
    <div className="flex h-screen 
        bg-gray-50 dark:bg-gray-900 
        text-gray-900 dark:text-gray-100 
        transition-colors duration-300">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Global Top Navbar */}
        <Header />

        {/* Routed Page Content */}
        <div className="p-8 overflow-auto flex-1 
            bg-white dark:bg-gray-800 
            transition-colors duration-300">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
