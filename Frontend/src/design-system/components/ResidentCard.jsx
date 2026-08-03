import React from 'react';
import clsx from "clsx";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";
import { Button } from "./Button";
import { Sparkles, Calendar, DollarSign, MoreVertical, BedDouble } from "lucide-react";
import buildFileUrl from "../../utils/buildFileUrl";
import { useTheme } from "../ThemeProvider";

export default function ResidentCard({ resident, onAction }) {
  const { colors, spacing, radius, typography, shadows } = useTheme();

  // Compute pending status
  const pendingAmount = resident.pendingRent || 0;
  const isOverdue = pendingAmount > 0;
  
  // Resolve status color
  let statusVariant = "default";
  if (resident.status === "Active") statusVariant = "success";
  if (resident.status === "Pending Admission") statusVariant = "warning";
  if (resident.status === "Checked Out") statusVariant = "error";

  // Build photo url
  const photoUrl = resident.photoUrl 
    ? buildFileUrl(resident.photoUrl)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${resident.firstName} ${resident.lastName}`)}&background=1C2740&color=CBD5E1`;

  return (
    <Card 
      hover 
      className="flex flex-col group overflow-visible"
      style={{ padding: '0px' }}
    >
      <div 
        style={{
          padding: spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          gap: spacing.md,
          position: 'relative',
        }}
      >
        {/* Top row: Avatar & Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyBetween: 'space-between' }}>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: radius.full,
                overflow: 'hidden',
                border: `2px solid ${colors.border.default}`,
                background: colors.background.elevated,
                boxShadow: shadows.sm,
                flexShrink: 0,
              }}
            >
              <img 
                src={photoUrl} 
                alt={`${resident.firstName} ${resident.lastName}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${resident.firstName} ${resident.lastName}`)}&background=1C2740&color=CBD5E1`;
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 
                style={{
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.semibold,
                  color: colors.text.primary,
                  margin: 0,
                  fontFamily: typography.fontFamily,
                  lineHeight: '1.2',
                }}
              >
                {resident.firstName} {resident.lastName}
              </h3>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  marginTop: '4px',
                  fontSize: typography.sizes.sm,
                  color: colors.text.muted,
                  fontFamily: typography.fontFamily,
                }}
              >
                <BedDouble size={14} style={{ color: colors.text.disabled }} />
                <span>
                  {resident.room?.roomNumber || "No Room"} 
                  {resident.bed?.bedNumber && ` • Bed ${resident.bed.bedNumber}`}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <StatusPill status={resident.status} variant={statusVariant} size="sm" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, marginTop: '4px' }}>
          <div 
            style={{
              background: colors.background.elevated,
              borderRadius: radius.md,
              padding: spacing.md,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            <div 
              style={{
                fontSize: typography.sizes.xs,
                color: colors.text.muted,
                marginBottom: '4px',
                fontFamily: typography.fontFamily,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <DollarSign size={12} />
              Outstanding
            </div>
            <div 
              style={{
                fontWeight: typography.weights.semibold,
                fontSize: typography.sizes.base,
                color: isOverdue ? colors.accent.danger : colors.text.primary,
                fontFamily: typography.fontFamily,
              }}
            >
              ₹{pendingAmount.toLocaleString()}
            </div>
          </div>
          
          <div 
            style={{
              background: colors.background.elevated,
              borderRadius: radius.md,
              padding: spacing.md,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            <div 
              style={{
                fontSize: typography.sizes.xs,
                color: colors.text.muted,
                marginBottom: '4px',
                fontFamily: typography.fontFamily,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Calendar size={12} />
              Move-in
            </div>
            <div 
              style={{
                fontWeight: typography.weights.semibold,
                fontSize: typography.sizes.base,
                color: colors.text.primary,
                fontFamily: typography.fontFamily,
              }}
            >
              {resident.dateOfJoining ? new Date(resident.dateOfJoining).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
            </div>
          </div>
        </div>

        {/* AI Insight (If provided) */}
        {resident.aiInsight && (
          <div 
            style={{
              background: 'rgba(108, 76, 245, 0.08)',
              border: '1px solid rgba(108, 76, 245, 0.2)',
              borderRadius: radius.md,
              padding: spacing.md,
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.xs,
              marginTop: 'auto',
            }}
          >
            <Sparkles size={14} style={{ color: colors.accent.ai, flexShrink: 0, marginTop: '2px' }} />
            <p 
              style={{
                fontSize: typography.sizes.xs,
                color: colors.accent.ai,
                fontWeight: typography.weights.medium,
                lineHeight: typography.lineHeights.normal,
                margin: 0,
                fontFamily: typography.fontFamily,
              }}
            >
              {resident.aiInsight}
            </p>
          </div>
        )}
        
        {!resident.aiInsight && <div style={{ marginTop: 'auto' }}></div>}
      </div>
      
      {/* Quick Actions Footer */}
      <div 
        style={{
          padding: `${spacing.sm} ${spacing.xl}`,
          borderTop: `1px solid ${colors.border.default}`,
          background: 'rgba(255, 255, 255, 0.01)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          marginTop: 'auto',
          borderBottomLeftRadius: radius.xl,
          borderBottomRightRadius: radius.xl,
        }}
      >
        <div style={{ display: 'flex', gap: spacing.sm, width: '100%' }}>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1"
            onClick={() => onAction('view', resident)}
          >
            View Profile
          </Button>
          {isOverdue && (
            <Button 
              variant="primary" 
              size="sm" 
              className="flex-1"
              onClick={() => onAction('collect_rent', resident)}
            >
              Collect
            </Button>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            style={{
              padding: spacing.xs,
              color: colors.text.muted,
              background: 'transparent',
              border: 'none',
              borderRadius: radius.md,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = colors.text.primary;
              e.currentTarget.style.background = colors.background.elevated;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = colors.text.muted;
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={(e) => {
              e.stopPropagation();
              onAction('more', resident);
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </Card>
  );
}
