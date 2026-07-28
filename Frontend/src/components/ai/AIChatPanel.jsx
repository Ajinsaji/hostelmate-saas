import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import api from "../../utils/apiClient";

export default function AIChatPanel() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your AI Operations Assistant. Ask me anything about your occupancy, revenue, or anomalies." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
    <div className="flex flex-col h-[500px] rounded-[24px] border border-white/10 overflow-hidden shadow-2xl" style={{ background: "linear-gradient(135deg, rgba(19,34,53,0.95), rgba(13,27,42,0.9))" }}>
      <div className="bg-gradient-to-r from-emerald-600/30 via-indigo-600/30 to-purple-600/30 border-b border-white/10 px-5 py-3.5 text-white flex items-center space-x-2">
        <Bot size={20} className="text-emerald-400" />
        <h3 className="font-semibold text-sm tracking-wide">Natural-Language Operations AI</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#07111F]/60">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === "user" 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold rounded-br-none shadow-md" 
                : "bg-white/[0.06] border border-white/10 text-slate-100 rounded-bl-none"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-none px-4 py-3">
              <Loader2 className="animate-spin text-emerald-400" size={18} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-[#0D1B2A]/90 border-t border-white/10 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about occupancy, payroll, treasury..."
          className="flex-1 bg-white/5 border border-white/10 focus:border-emerald-500/60 focus:bg-white/10 text-white placeholder-slate-400 caret-emerald-400 rounded-full px-4 py-2.5 text-sm outline-none transition-all"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-full disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
