import React from 'react';

type Accent = 'navy' | 'teal' | 'amber' | 'secondary' | 'slate';

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: Accent;
  trendLabel?: string;
  trendValue?: string;
  footer?: React.ReactNode;
}

const accentMap: Record<Accent, { icon: string; halo: string; indicator: string }> = {
  navy: {
    icon: 'text-brand-navy',
    halo: 'bg-brand-navy/10',
    indicator: 'text-brand-navy'
  },
  teal: {
    icon: 'text-brand-teal',
    halo: 'bg-brand-teal/10',
    indicator: 'text-brand-teal'
  },
  amber: {
    icon: 'text-brand-secondary',
    halo: 'bg-brand-secondary/10',
    indicator: 'text-brand-secondary'
  },
  secondary: {
    icon: 'text-status-info',
    halo: 'bg-status-info/10',
    indicator: 'text-status-info'
  },
  slate: {
    icon: 'text-brand-text/70',
    halo: 'bg-brand-outline/20',
    indicator: 'text-brand-text/70'
  }
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  accent = 'navy',
  trendLabel,
  trendValue,
  footer
}) => {
  const palette = accentMap[accent];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-outline/40 bg-white/95 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-sm sm:p-7">
      <div className="absolute -top-12 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-brand-background/60 to-transparent" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-text/50">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-brand-navy sm:text-4xl">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette.halo}`}>
          <Icon className={`h-5 w-5 ${palette.icon}`} />
        </div>
      </div>
      {(trendLabel || trendValue) && (
        <p className={`mt-4 text-sm font-medium ${palette.indicator}`}>
          {trendLabel} {trendValue}
        </p>
      )}
      {footer && <div className="mt-5 text-xs text-brand-text/60">{footer}</div>}
    </div>
  );
};

export default MetricCard;
