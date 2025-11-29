import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Timer,
  History,
  IndianRupee,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Delay Prediction", path: "/delay/form", icon: <Timer size={20} /> },
    { name: "Delay History", path: "/delay/history", icon: <History size={20} /> },
    { name: "Budget Overrun", path: "/overrun/form", icon: <IndianRupee size={20} /> },
    { name: "Chatbot", path: "/chatbot", icon: <MessageCircle size={20} /> },
  ];

  return (
    <aside
      className={`h-screen border-r shadow-lg flex flex-col py-6 transition-all duration-300
        bg-white dark:bg-gradient-to-b dark:from-[#0b0d1a] dark:to-[#11101f]
        border-gray-200 dark:border-transparent
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      <div className="flex justify-end px-3 mb-4">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-[#121026] hover:bg-gray-200 dark:hover:bg-[#1b1730] transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-extrabold text-blue-700 dark:text-indigo-300">AI Monitor</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Construction Intelligence</p>
        </div>
      )}

      <nav className="flex flex-col gap-2 px-2">
        {menu.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={
                "flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-all duration-200 " +
                (active
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-[1.02]"
                  : "text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-[#161226] hover:scale-[1.02]")
              }
            >
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-auto text-center text-xs text-gray-400 dark:text-gray-500 pt-6">
          © 2025 AI Monitor
        </div>
      )}
    </aside>
  );
}
