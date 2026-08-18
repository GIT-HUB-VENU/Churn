import React from 'react';

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  badgeText,
}) => {
  const styles = {
    blue: {
      card: 'p-3 border border-slate-200 rounded-lg bg-slate-50',
      title: 'text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider',
      value: 'text-2xl font-bold font-mono text-slate-900',
      sub: 'text-[10px] text-slate-400 mt-1',
    },
    red: {
      card: 'p-3 border rounded-lg border-red-100 bg-red-50',
      title: 'text-[10px] text-red-600 uppercase font-bold mb-1 tracking-wider',
      value: 'text-2xl font-bold font-mono text-red-700',
      sub: 'text-[10px] text-red-500 mt-1',
    },
    amber: {
      card: 'p-3 border rounded-lg border-orange-100 bg-orange-50',
      title: 'text-[10px] text-orange-600 uppercase font-bold mb-1 tracking-wider',
      value: 'text-2xl font-bold font-mono text-orange-700',
      sub: 'text-[10px] text-orange-500 mt-1',
    },
    emerald: {
      card: 'p-3 border rounded-lg border-green-100 bg-green-50',
      title: 'text-[10px] text-green-600 uppercase font-bold mb-1 tracking-wider',
      value: 'text-2xl font-bold font-mono text-green-700',
      sub: 'text-[10px] text-green-500 mt-1',
    },
    purple: {
      card: 'p-3 border rounded-lg border-purple-100 bg-purple-50',
      title: 'text-[10px] text-purple-600 uppercase font-bold mb-1 tracking-wider',
      value: 'text-2xl font-bold font-mono text-purple-700',
      sub: 'text-[10px] text-purple-500 mt-1',
    },
    dark: {
      card: 'p-3 border rounded-lg bg-slate-900 text-white border-slate-800',
      title: 'text-[10px] text-blue-300 uppercase font-bold mb-1 tracking-wider',
      value: 'text-2xl font-bold font-mono text-white',
      sub: 'text-[10px] text-blue-400 mt-1',
    },
  }[colorScheme];

  return (
    <div className={styles.card}>
      <div className="flex items-center justify-between">
        <div className={styles.title}>{title}</div>
        {badgeText && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-200 text-red-800">
            {badgeText}
          </span>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      {subtitle && <div className={styles.sub}>{subtitle}</div>}
    </div>
  );
};
