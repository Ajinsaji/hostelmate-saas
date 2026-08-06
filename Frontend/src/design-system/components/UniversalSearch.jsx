import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { useTheme } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';

export function UniversalSearch() {
  const { colors, spacing, radius, typography, shadows } = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Debounced query logic
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await api.get(`/api/v2/workspaces/search?q=${encodeURIComponent(query)}`);
        if (response.data && response.data.success) {
          setResults(response.data.results);
        }
      } catch (err) {
        console.warn('Search query failed', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = results
    ? Object.values(results).reduce((acc, list) => acc + list.length, 0)
    : 0;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '380px', fontFamily: typography.fontFamily }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.text.muted || '#CBD5E1',
          }}
        />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search residents, rooms, payments..."
          style={{
            width: '100%',
            padding: '10px 40px 10px 42px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${colors.border.default || '#22304A'}`,
            borderRadius: radius.lg || '12px',
            color: colors.text.primary || '#FFFFFF',
            fontSize: typography.sizes.sm,
            outline: 'none',
            transition: 'border-color 150ms ease',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
        />
        {loading && (
          <Loader
            size={14}
            className="animate-spin"
            style={{
              position: 'absolute',
              right: '34px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.text.muted || '#CBD5E1',
            }}
          />
        )}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.text.muted || '#CBD5E1',
              padding: 0,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: colors.background.card || '#162032',
            border: `1px solid ${colors.border.default || '#22304A'}`,
            borderRadius: radius.lg || '12px',
            boxShadow: shadows.elevated || '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            maxHeight: '360px',
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          {loading && !results && (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.text.muted || '#CBD5E1', fontSize: typography.sizes.sm }}>
              Searching...
            </div>
          )}

          {results && totalResults === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.text.muted || '#CBD5E1', fontSize: typography.sizes.sm }}>
              No matches found for "{query}"
            </div>
          )}

          {results && (
            <div style={{ padding: '8px 0' }}>
              {/* Residents category */}
              {results.residents.length > 0 && (
                <div style={{ marginBottom: spacing.xs }}>
                  <div style={{ padding: '6px 16px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.accent.primary || '#16A34A', fontWeight: typography.weights.bold }}>
                    Residents
                  </div>
                  {results.residents.map(resItem => (
                    <button
                      key={resItem.id}
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/residents');
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: colors.text.primary || '#FFFFFF',
                        fontSize: typography.sizes.sm,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{resItem.name}</span>
                      <span style={{ fontSize: '11px', color: colors.text.muted || '#CBD5E1' }}>{resItem.phone}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Rooms category */}
              {results.rooms.length > 0 && (
                <div style={{ marginBottom: spacing.xs }}>
                  <div style={{ padding: '6px 16px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.accent.secondary || '#6C4CF5', fontWeight: typography.weights.bold }}>
                    Rooms
                  </div>
                  {results.rooms.map(roomItem => (
                    <button
                      key={roomItem.id}
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/rooms');
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: colors.text.primary || '#FFFFFF',
                        fontSize: typography.sizes.sm,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>Room {roomItem.roomNumber}</span>
                      <span style={{ fontSize: '11px', color: colors.text.muted || '#CBD5E1' }}>{roomItem.roomType}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Payments category */}
              {results.payments.length > 0 && (
                <div style={{ marginBottom: spacing.xs }}>
                  <div style={{ padding: '6px 16px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3B82F6', fontWeight: typography.weights.bold }}>
                    Payments
                  </div>
                  {results.payments.map(payItem => (
                    <button
                      key={payItem.id}
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/payments');
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: colors.text.primary || '#FFFFFF',
                        fontSize: typography.sizes.sm,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div>
                        <span>{payItem.residentName}</span>
                        <span style={{ fontSize: '11px', color: colors.text.muted || '#CBD5E1', marginLeft: '6px' }}>({payItem.month})</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: typography.weights.bold, color: payItem.status === 'paid' ? (colors.accent.success || '#22C55E') : '#F59E0B' }}>
                        ₹{payItem.amount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default UniversalSearch;
