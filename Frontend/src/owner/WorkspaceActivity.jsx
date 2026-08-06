import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useTheme } from '../design-system/ThemeProvider';
import { Clock, RefreshCcw, Activity } from 'lucide-react';

export default function WorkspaceActivity() {
  const { colors, spacing, radius, typography } = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v2/workspaces/activity');
      if (response.data && response.data.success) {
        setActivities(response.data.activities || []);
      } else {
        throw new Error('Failed to load workspace timeline');
      }
    } catch (err) {
      setError(err.message || 'Failed to load timeline feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivity();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchActivity]);

  if (loading) {
    return (
      <div 
        style={{
          background: colors.background.card || '#162032',
          border: `1px solid ${colors.border.default || '#22304A'}`,
          borderRadius: radius.xxl || '24px',
          padding: spacing.lg || '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        <div style={{ height: '24px', width: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} className="animate-pulse" />
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} className="animate-pulse" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ height: '14px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} className="animate-pulse" />
              <div style={{ height: '10px', width: '30%', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} className="animate-pulse" />
            </div>
          </div>
        ))}
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
          fontFamily: typography.fontFamily,
        }}
      >
        <p style={{ margin: '0 0 12px' }}>{error}</p>
        <button 
          onClick={fetchActivity}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: colors.accent.primary || '#16A34A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: radius.md || '8px',
            padding: '8px 16px',
            fontSize: typography.sizes.sm,
            cursor: 'pointer',
          }}
        >
          <RefreshCcw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div 
        style={{
          background: colors.background.card || '#162032',
          border: `1px solid ${colors.border.default || '#22304A'}`,
          borderRadius: radius.xxl || '24px',
          padding: spacing.lg || '24px',
          textAlign: 'center',
          color: colors.text.muted || '#CBD5E1',
          fontFamily: typography.fontFamily,
        }}
      >
        <Activity size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '8px' }} />
        <p style={{ margin: 0 }}>No activity logged in your workspace yet.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: colors.background.card || '#162032',
        border: `1px solid ${colors.border.default || '#22304A'}`,
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
        <Clock size={16} style={{ color: colors.accent.primary || '#16A34A' }} /> Recent Activities
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        {/* Visual Line */}
        <div 
          style={{
            position: 'absolute',
            left: '5px',
            top: '8px',
            bottom: '8px',
            width: '1px',
            background: 'rgba(255,255,255,0.06)',
          }}
        />

        {activities.map((act) => (
          <div key={act.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative' }}>
            <div 
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                background: act.type === 'CREATE' ? (colors.accent.primary || '#16A34A') : 'rgba(255,255,255,0.2)',
                border: `3px solid ${colors.background.card || '#162032'}`,
                zIndex: 10,
                marginTop: '4px',
              }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text.primary || '#FFFFFF' }}>
                {act.title}
              </p>
              <span style={{ fontSize: '10.5px', color: colors.text.muted || '#CBD5E1', display: 'block', marginTop: '2px' }}>
                {new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
