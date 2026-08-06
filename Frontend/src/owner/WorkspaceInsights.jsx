import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useTheme } from '../design-system/ThemeProvider';
import { Sparkles, AlertTriangle, CheckCircle, Info, RefreshCcw } from 'lucide-react';

export default function WorkspaceInsights() {
  const { colors, spacing, radius, typography } = useTheme();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v2/workspaces/insights');
      if (response.data && response.data.success) {
        setInsights(response.data.insights || []);
      } else {
        throw new Error('Failed to load workspace insights');
      }
    } catch (err) {
      setError(err.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInsights();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchInsights]);

  if (loading) {
    return (
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.05), rgba(108, 76, 245, 0.05))',
          backdropFilter: 'blur(16px)',
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          borderRadius: radius.xxl || '24px',
          padding: spacing.lg || '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        <div style={{ height: '24px', width: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} className="animate-pulse" />
        <div style={{ display: 'flex', gap: spacing.md }}>
          <div style={{ flex: 1, height: '60px', background: 'rgba(255,255,255,0.04)', borderRadius: radius.md }} className="animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{
          background: colors.background.card || '#162032',
          border: `1px solid ${colors.border.default || '#22304A'}`,
          borderRadius: radius.xxl || '24px',
          padding: spacing.lg || '24px',
          textAlign: 'center',
          color: colors.text.muted || '#CBD5E1',
        }}
      >
        <p style={{ margin: '0 0 12px' }}>{error}</p>
        <button 
          onClick={fetchInsights}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: colors.accent.primary || '#16A34A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: radius.md || '8px',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          <RefreshCcw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.03), rgba(108, 76, 245, 0.03))',
          backdropFilter: 'blur(16px)',
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: radius.xxl || '24px',
          padding: spacing.lg || '24px',
          fontFamily: typography.fontFamily,
          textAlign: 'center',
          color: colors.text.muted || '#CBD5E1',
        }}
      >
        <Sparkles size={32} style={{ color: colors.accent.secondary || '#6C4CF5', opacity: 0.5, margin: '0 auto 12px' }} />
        <p style={{ margin: 0, fontSize: typography.sizes.sm }}>
          Insights will appear after more operational data is collected.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.03), rgba(108, 76, 245, 0.03))',
        backdropFilter: 'blur(16px)',
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: radius.xxl || '24px',
        padding: spacing.lg || '24px',
        fontFamily: typography.fontFamily,
      }}
    >
      <h3 
        style={{ 
          fontSize: typography.sizes.md, 
          fontWeight: typography.weights.bold, 
          color: colors.text.primary || '#FFFFFF',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Sparkles size={16} style={{ color: colors.accent.secondary || '#6C4CF5' }} /> AI Recommendations
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((ins, index) => {
          const isWarning = ins.type === 'warning';
          const isSuccess = ins.type === 'success';
          const Icon = isWarning ? AlertTriangle : isSuccess ? CheckCircle : Info;
          const statusColor = isWarning ? '#F59E0B' : isSuccess ? '#10B981' : '#3B82F6';
          
          return (
            <div 
              key={index}
              style={{
                display: 'flex',
                gap: spacing.md,
                padding: spacing.md,
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isWarning ? 'rgba(245, 158, 11, 0.15)' : isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: radius.lg || '12px',
                alignItems: 'flex-start',
              }}
            >
              <div 
                style={{ 
                  color: statusColor, 
                  marginTop: '2px', 
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text.primary || '#FFFFFF' }}>
                  {ins.title}
                </div>
                <div style={{ fontSize: typography.sizes.sm, color: colors.text.muted || '#CBD5E1', marginTop: '2px', lineHeight: 1.4 }}>
                  {ins.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
