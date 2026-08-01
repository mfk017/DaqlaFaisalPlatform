import { useTranslation } from "@/components/layout/I18nProvider";
import React from 'react';

type StageData = {
  name: string;
  count: number;
};

interface FactoryHeatMapProps {
  stages: StageData[];
}

export function FactoryHeatMap({ stages }: FactoryHeatMapProps) {
  const { t } = useTranslation();

  // Threshold configuration (easy to adjust later)
  const THRESHOLDS = {
    WARNING: 5,   // 5 or more = Busy (Yellow)
    CRITICAL: 10  // 10 or more = Overloaded (Red)
  };

  const getHeatColor = (count: number) => {
    if (count >= THRESHOLDS.CRITICAL) return 'var(--danger)'; // Red
    if (count >= THRESHOLDS.WARNING) return 'var(--warning)'; // Yellow
    return 'var(--success)'; // Green
  };

  const getHeatBackground = (count: number) => {
    if (count >= THRESHOLDS.CRITICAL) return 'var(--danger-bg)';
    if (count >= THRESHOLDS.WARNING) return 'rgba(245, 158, 11, 0.1)'; // Yellow bg
    return 'var(--success-bg)';
  };

  const getStatusText = (count: number) => {
    if (count >= THRESHOLDS.CRITICAL) return t("very_busy");
    if (count >= THRESHOLDS.WARNING) return t("busy");
    return t("normal");
  };

  return (
    <div className="auth-card" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t("factory_heatmap")}</h2>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)' }}></span> طبيعي
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning)' }}></span> مزدحم (5+)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)' }}></span> مزدحم جداً (10+)
          </div>
        </div>
      </div>
      
      {stages.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
          المصنع فارغ حالياً
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gap: '16px' 
        }}>
          {stages.map((stage) => (
            <div key={stage.name} style={{
              background: getHeatBackground(stage.count),
              border: `1px solid ${getHeatColor(stage.count)}`,
              borderRadius: 'var(--radius)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
                {stage.name}
              </div>
              <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: getHeatColor(stage.count), lineHeight: 1 }}>
                {stage.count}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: getHeatColor(stage.count) }}>
                {getStatusText(stage.count)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
