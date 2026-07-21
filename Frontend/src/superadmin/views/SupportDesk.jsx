import React, { useState, useEffect } from "react";
import { MessageSquare, AlertTriangle, Clock, CheckCircle2, ChevronRight, X, Reply } from "lucide-react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";

export const SupportDesk = React.memo(() => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchSupport = async () => {
      try {
        const response = await api.get("/api/admin/support");
        if (response.data.success) {
          setData(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching Support data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSupport();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <PageContainer>
      <SectionHeader title="Support Desk" subtitle="Manage and assign technical or billing support tickets" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-4">
          <ContentContainer className="p-0 overflow-hidden border-slate-800">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
              <h3 className="text-white font-medium">Recent Tickets</h3>
              <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Open</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> In Progress</span>
              </div>
            </div>
            
            <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto bg-slate-900/30">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-slate-800/50 h-20 rounded-lg"></div>
                  ))}
                </div>
              ) : data.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-50" />
                  <p className="text-slate-300 font-medium mb-1">No support tickets found.</p>
                  <p className="text-sm">All user queries will appear here.</p>
                </div>
              ) : (
                data.map(ticket => (
                  <div 
                    key={ticket._id} 
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-all flex items-center justify-between gap-4 ${selectedTicket?._id === ticket._id ? 'bg-slate-800/70 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(ticket.status)} font-medium uppercase tracking-wider`}>
                          {ticket.status}
                        </span>
                        <h4 className="text-sm font-medium text-white truncate">{ticket.subject}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className={`w-3.5 h-3.5 ${getPriorityColor(ticket.priority)}`} />
                          <span className="capitalize">{ticket.priority} Priority</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                          {ticket.category || 'General'}
                        </span>
                        <span className="flex items-center gap-1.5 ml-auto">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(ticket.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedTicket?._id === ticket._id ? 'text-indigo-400 translate-x-1' : 'text-slate-600'}`} />
                  </div>
                ))
              )}
            </div>
          </ContentContainer>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[600px] sticky top-6 shadow-xl">
              <div className="p-5 border-b border-slate-800 flex justify-between items-start bg-slate-900/80 rounded-t-xl">
                <div>
                  <h3 className="text-white font-medium mb-3 leading-tight pr-4">{selectedTicket.subject}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-md border ${getStatusColor(selectedTicket.status)} uppercase tracking-wider font-semibold`}>
                      {selectedTicket.status}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {selectedTicket.category || 'General'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 flex-1 overflow-y-auto bg-slate-900/30">
                <div className="mb-8">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                        {(selectedTicket.userName || 'U')[0]}
                      </div>
                      <span className="font-medium text-slate-300">{selectedTicket.userName || 'User'}</span>
                    </div>
                    <span>{new Date(selectedTicket.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/40 p-4 rounded-xl text-sm text-slate-300 whitespace-pre-wrap border border-slate-700/50 leading-relaxed">
                    {selectedTicket.description || 'No description provided.'}
                  </div>
                </div>
                
                {/* Timeline / Replies */}
                <div className="space-y-4">
                  {selectedTicket.replies?.map((reply, i) => (
                    <div key={i} className="pl-4 border-l-2 border-indigo-500/50">
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                        <span className="font-medium text-indigo-400">{reply.author || 'Support Agent'}</span>
                        <span>{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg rounded-tl-none">{reply.message}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 rounded-b-xl">
                <div className="flex gap-3">
                  <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                    <Reply className="w-4 h-4" /> Reply
                  </button>
                  {selectedTicket.status?.toLowerCase() !== 'resolved' && (
                    <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Close Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl h-[600px] flex flex-col items-center justify-center text-slate-500 sticky top-6 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-300 font-medium">Select a ticket</p>
              <p className="text-sm mt-1">Choose a ticket from the list to view its details</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
});

export default SupportDesk;
