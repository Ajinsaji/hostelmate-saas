import React, { useState, useEffect } from "react";
import { Search, Filter, Mail, MailOpen, Trash2, Bell, AlertCircle, CheckCircle } from "lucide-react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";

export const CommunicationConsole = React.memo(() => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, unread, read

  useEffect(() => {
    const fetchComms = async () => {
      try {
        const response = await api.get("/api/admin/communications");
        if (response.data.success) {
          setData(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching Comms data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComms();
  }, []);

  const handleMarkRead = (id) => {
    setData(prev => prev.map(item => item._id === id ? { ...item, isRead: true } : item));
  };

  const handleDelete = (id) => {
    setData(prev => prev.filter(item => item._id !== id));
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase()) || 
                          item.message?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ? true : filter === "unread" ? !item.isRead : item.isRead;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = data.filter(item => !item.isRead).length;

  return (
    <PageContainer>
      <SectionHeader 
        title={
          <div className="flex items-center gap-3">
            Communication Desk
            {unreadCount > 0 && (
              <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full font-medium">
                {unreadCount} Unread
              </span>
            )}
          </div>
        } 
        subtitle="Broadcast system alerts, emails and WhatsApp notifications" 
      />
      
      <ContentContainer>
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
            {['all', 'unread', 'read'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm rounded-md capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-900/50 rounded-xl p-5 border border-slate-800 flex gap-4 h-24"></div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Bell className="w-12 h-12 mb-4 text-slate-600 opacity-50" />
            <p className="text-lg text-white mb-1">No notifications found.</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredData.map(notification => (
              <div 
                key={notification._id} 
                className={`group relative bg-slate-900 border ${!notification.isRead ? 'border-l-4 border-l-indigo-500 border-t-slate-800 border-r-slate-800 border-b-slate-800' : 'border-slate-800'} rounded-xl p-5 hover:bg-slate-800/50 transition-all flex gap-4 items-start`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${notification.priority === 'high' ? 'bg-red-500/10 text-red-400' : notification.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  {notification.priority === 'high' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-base font-medium ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>{notification.title}</h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                      {new Date(notification.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-3">{notification.message}</p>
                  
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-md bg-slate-950 border border-slate-800 capitalize`}>
                      {notification.type || 'System'}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <button onClick={() => handleMarkRead(notification._id)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Mark as read">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(notification._id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default CommunicationConsole;
