import React from "react";
import ChatBot from "../components/ChatBot";

export default function ChatbotPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">AI Chat Assistant</h1>
      <ChatBot />
    </div>
  );
}
