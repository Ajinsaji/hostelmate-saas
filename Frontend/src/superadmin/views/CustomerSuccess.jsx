import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, TrendingUp, HeartPulse, Activity } from "lucide-react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";

const MetricCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend !== undefined && (
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-white mt-1">{value}</p>
  </div>
);

export const CustomerSuccess = React.memo(() => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCS = async () => {
      try {
        const response = await api.get("/api/admin/customer-success");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching CS data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCS();
  }, []);

  const defaultMetrics = {
    conversionRate: data?.conversionRate || 0,
    retentionRate: data?.retentionRate || 0,
    churnRate: data?.churnRate || 0,
    activeHostels: data?.activeHostels || 0,
    monthlyRetention: data?.monthlyRetention || [],
    churnTrend: data?.churnTrend || [],
  };

  return (
    <PageContainer>
      <SectionHeader title="Customer Success" subtitle="Track user feature adoption rates and customer feedback pipelines" />
      
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-slate-900/50 h-36 rounded-xl border border-slate-800"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-pulse bg-slate-900/50 h-96 rounded-xl border border-slate-800"></div>
            <div className="animate-pulse bg-slate-900/50 h-96 rounded-xl border border-slate-800"></div>
          </div>
        </div>
      ) : (!data || Object.keys(data).length === 0) ? (
        <ContentContainer>
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Activity className="w-16 h-16 mb-4 text-slate-600 opacity-50" />
            <p className="text-xl text-white font-medium mb-2">No success metrics available</p>
            <p className="text-sm">Metrics will appear once enough customer data is gathered.</p>
          </div>
        </ContentContainer>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Conversion Rate" value={`${defaultMetrics.conversionRate}%`} icon={TrendingUp} trend={+5.2} colorClass="bg-indigo-500/10 text-indigo-400" />
            <MetricCard title="Retention Rate" value={`${defaultMetrics.retentionRate}%`} icon={HeartPulse} trend={+2.1} colorClass="bg-emerald-500/10 text-emerald-400" />
            <MetricCard title="Churn Rate" value={`${defaultMetrics.churnRate}%`} icon={Activity} trend={-1.5} colorClass="bg-red-500/10 text-red-400" />
            <MetricCard title="Active Hostels" value={defaultMetrics.activeHostels} icon={Users} trend={+12} colorClass="bg-blue-500/10 text-blue-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-6">Monthly Retention</h3>
              <div className="h-80 w-full">
                {defaultMetrics.monthlyRetention.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={defaultMetrics.monthlyRetention}>
                      <defs>
                        <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRetention)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-lg">Not enough data to render chart</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-6">Churn Trend</h3>
              <div className="h-80 w-full">
                {defaultMetrics.churnTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={defaultMetrics.churnTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#fff' }}
                        cursor={{fill: '#1e293b', opacity: 0.4}}
                      />
                      <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-lg">Not enough data to render chart</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
});

export default CustomerSuccess;
