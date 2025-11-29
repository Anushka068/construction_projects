import React, { useContext } from "react";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";

export default function Header() {
  const { dark, setDark } = useContext(ThemeContext);
  console.log("Dark mode state =", dark);

  return (
    <header className="w-full h-20 bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-sm px-8 flex items-center justify-between sticky top-0 z-40">
      
      {/* Left Section */}
      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
        Project Monitor
      </div>

      {/* Search */}
      <div className="relative w-80">
        <Search
          size={18}
          className="absolute left-3 top-3 text-gray-400 dark:text-gray-500"
        />
        <input
          type="text"
          placeholder="Search projects, tasks..."
          className="w-full pl-10 pr-4 py-2 
            bg-gray-50 dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700 
            rounded-xl 
            focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 
            outline-none
            text-gray-900 dark:text-gray-200"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-5">

        {/* Dark Mode Button */}
        <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
        {dark 
            ? <Sun size={22} className="text-yellow-400" /> 
            : <Moon size={22} className="text-gray-600" />
        }
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
          <Bell size={22} className="text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User avatar */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold shadow-md">
          MP
        </div>
      </div>
    </header>
  );
}
