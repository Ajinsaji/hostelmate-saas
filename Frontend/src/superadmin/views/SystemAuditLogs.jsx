import React, { useState, useEffect, useMemo } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";
import { Search, Calendar, Activity, Clock, ShieldAlert, Monitor } from "lucide-react";

export const SystemAuditLogs = React.memo(() => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await api.get("/api/admin/audit-trails");
        if (response.data.success) {
          setData(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching Audit data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.actionType?.toLowerCase().includes(search.toLowerCase()) || 
                            item.entity?.toLowerCase().includes(search.toLowerCase()) ||
                            item.ip?.includes(search);
      
      const itemDate = new Date(item.timestamp);
      const matchesStart = startDate ? itemDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? itemDate <= new Date(endDate) : true;
      
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [data, search, startDate, endDate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  };

  const truncate = (val) => {
    if (!val) return "-";
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return str.length > 30 ? str.substring(0, 30) + '...' : str;
  };

  return (
    <PageContainer>
      <SectionHeader title="System Audit Trails" subtitle="Review platform configuration mutations and security logs" />
      <ContentContainer>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Search by action, entity or IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-sm [color-scheme:dark]"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-sm [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-700/50">Action</th>
                  <th className="px-4 py-3 border-b border-slate-700/50">Entity</th>
                  <th className="px-4 py-3 border-b border-slate-700/50">Old Value</th>
                  <th className="px-4 py-3 border-b border-slate-700/50">New Value</th>
                  <th className="px-4 py-3 border-b border-slate-700/50">IP Address</th>
                  <th className="px-4 py-3 border-b border-slate-700/50">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                      <Activity className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading audit logs...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                      <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                      No audit trails found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-indigo-400">{log.actionType || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                          {log.entity || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-rose-400/80">{truncate(log.oldValue)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400/80">{truncate(log.newValue)}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-3 h-3" />
                          {log.ip || "Unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ContentContainer>
    </PageContainer>
  );
});

export default SystemAuditLogs;
