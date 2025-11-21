import React, { useState } from "react";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm your project assistant. Ask anything!" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }]);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text: "This is a placeholder AI response. I can analyze delays, overruns & risks."
        }
      ]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="w-96 h-[500px] rounded-2xl shadow-2xl bg-white flex flex-col border border-gray-200 mb-4">
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
            <div className="font-semibold">AI Assistant</div>
            <button onClick={() => setOpen(false)} className="text-xl">×</button>
          </div>

          <div className="flex-1 p-4 overflow-auto space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`p-3 rounded-xl max-w-[75%] text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4">
            <div className="flex gap-2">
              <input
                className="flex-1 border p-3 rounded-xl"
                placeholder="Ask me anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl text-3xl flex items-center justify-center"
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
