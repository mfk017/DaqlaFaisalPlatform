"use client";

import React from 'react';
import { Check, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  order_index: number;
}

interface ProductionLineProps {
  stages: Stage[];
  currentStageId: string;
  status: string; // 'in_progress', 'completed', 'returned', 'canceled'
  currentAssigneeName?: string | null;
}

export function ProductionLine({ stages, currentStageId, status, currentAssigneeName }: ProductionLineProps) {
  // Sort stages by order_index just in case
  const sortedStages = [...stages].sort((a, b) => a.order_index - b.order_index);
  
  const currentIndex = sortedStages.findIndex(s => s.id === currentStageId);
  const isReturned = status === 'returned';
  const isCompleted = status === 'completed';
  const isCanceled = status === 'canceled';

  return (
    <div style={{ 
      padding: '24px 0', 
      width: '100%', 
      overflowX: 'auto',
      direction: 'rtl' // Ensure RTL layout
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        minWidth: 'max-content',
        padding: '0 20px',
        position: 'relative'
      }}>
        {sortedStages.map((stage, idx) => {
          const isPast = isCompleted || (currentIndex > -1 && idx < currentIndex);
          const isCurrent = !isCompleted && !isCanceled && currentIndex === idx;
          const isFuture = !isCompleted && !isCanceled && (currentIndex === -1 || idx > currentIndex);

          // Node styling
          let bgColor = 'var(--bg-card)';
          let borderColor = 'var(--border-light)';
          let textColor = 'var(--text-secondary)';
          let icon = null;
          let nodeClasses = '';

          if (isPast) {
            bgColor = 'var(--success)';
            borderColor = 'var(--success)';
            textColor = '#fff';
            icon = <Check size={16} />;
          } else if (isCurrent) {
            bgColor = isReturned ? 'var(--danger)' : 'var(--warning)';
            borderColor = isReturned ? 'var(--danger)' : 'var(--warning)';
            textColor = '#fff';
            nodeClasses = isReturned ? 'animate-pulse' : 'animate-pulse';
            icon = isReturned ? <AlertTriangle size={16} /> : <Clock size={16} />;
          } else if (isCanceled) {
            bgColor = 'var(--bg-card)';
            borderColor = 'var(--danger)';
            textColor = 'var(--danger)';
            if (currentIndex === idx) {
               bgColor = 'var(--danger)';
               textColor = '#fff';
            }
          }

          const hasNext = idx < sortedStages.length - 1;

          return (
            <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '140px' }}>
              
              {/* Connector Line */}
              {hasNext && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '50%', // rtl
                  width: '100%',
                  height: '2px',
                  background: isPast ? 'var(--success)' : 'var(--border-light)',
                  zIndex: 0
                }} />
              )}
              
              {/* Node */}
              <div 
                className={nodeClasses}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: textColor,
                  zIndex: 1,
                  boxShadow: 'var(--bg-page) 0 0 0 4px', // gap effect
                  marginBottom: '12px'
                }}
              >
                {icon ? icon : <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{idx + 1}</span>}
              </div>

              {/* Text */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-heading)',
                  marginBottom: '4px'
                }}>
                  {stage.name}
                </div>
                
                {isCurrent && currentAssigneeName && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: isReturned ? 'var(--danger)' : 'var(--warning)',
                    background: isReturned ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius)',
                    display: 'inline-block',
                    border: `1px solid ${isReturned ? 'var(--danger)' : 'var(--warning)'}`
                  }}>
                    {currentAssigneeName}
                  </div>
                )}
                
                {isCurrent && isReturned && (
                  <div style={{ 
                    position: 'absolute',
                    top: '-30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    <ArrowRight size={14} /> مرفوض
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
