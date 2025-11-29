// src/router.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

// Layout
import App from "./App";

// Pages
//import Dashboard from "./pages/Dashboard";
import DashboardPage from "./pages/DashboardPage";
import ChatbotPage from "./pages/ChatbotPage";

// Delay pages
import DelayForm from "./pages/delay/DelayForm";
import DelayHistory from "./pages/delay/DelayHistory";
import DelayResult from "./pages/delay/DelayResult";

// Overrun pages
import OverrunForm from "./pages/overrun/OverrunForm";
import OverrunResult from "./pages/overrun/OverrunResult";

import ErrorPage from "./components/ErrorPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      // default page
      //{ index: true, element: <Dashboard /> },
      { index: true, element: <DashboardPage /> },

      // dashboard
      //{ path: "dashboard", element: <Dashboard /> },
      { path: "dashboard", element: <DashboardPage /> },

      // chatbot page
      { path: "chatbot", element: <ChatbotPage /> },

      // delay module
      { path: "delay/form", element: <DelayForm /> },
      { path: "delay/history", element: <DelayHistory /> },
      { path: "delay/result", element: <DelayResult /> },

      // overrun module
      { path: "overrun/form", element: <OverrunForm /> },
      { path: "overrun/result", element: <OverrunResult /> }
    ]
  }
]);

export default router;
