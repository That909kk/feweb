import React from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  headerSpacing?: 'default' | 'compact';
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  actions,
  className,
  children,
  headerSpacing = 'default'
}) => {
  const hasHeader = title || description || actions;

  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl border border-brand-outline/40 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-sm sm:p-7',
        className ?? ''
      ].join(' ')}
    >
      {hasHeader && (
        <div
          className={`flex flex-wrap items-start justify-between gap-4 ${headerSpacing === 'compact' ? 'mb-4' : 'mb-6'}`}
        >
          <div>
            {title && <h2 className="text-xl font-semibold text-brand-navy">{title}</h2>}
            {description && <p className="mt-1 max-w-2xl text-sm text-brand-text/60">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default SectionCard;
