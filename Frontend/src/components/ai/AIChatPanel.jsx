import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import api from "../../utils/apiClient";

export default function AIChatPanel() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your AI Operations Assistant. Ask me anything about your occupancy, revenue, or anomalies." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQuery = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userQuery }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/query", { query: userQuery });
      if (res.data.success) {
        setMessages(prev => [...prev, { role: "assistant", content: res.data.data.text }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error processing your query." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className="bg-indigo-600 px-4 py-3 text-white flex items-center space-x-2">
        <Bot size={20} />
        <h3 className="font-semibold">Natural-Language Analytics</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === "user" 
                ? "bg-indigo-600 text-white rounded-br-none" 
                : "bg-white border text-gray-800 rounded-bl-none shadow-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <Loader2 className="animate-spin text-indigo-600" size={16} />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about occupancy, payroll, treasury..."
          className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 rounded-full px-4 py-2 text-sm outline-none transition-all"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
