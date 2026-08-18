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
      card: 'p-4 sm:p-5 border border-stone-200/80 rounded-2xl bg-white shadow-xs hover:border-teal-300/80 transition-all',
      title: 'text-[11px] text-stone-500 uppercase font-bold tracking-wider',
      value: 'text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-sans',
      sub: 'text-xs text-stone-500 mt-1',
      iconBg: 'bg-teal-50 text-teal-700',
    },
    red: {
      card: 'p-4 sm:p-5 border border-rose-200/80 rounded-2xl bg-white shadow-xs hover:border-rose-300 transition-all border-l-4 border-l-rose-500',
      title: 'text-[11px] text-rose-700 uppercase font-bold tracking-wider',
      value: 'text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-sans',
      sub: 'text-xs text-rose-600/80 mt-1 font-medium',
      iconBg: 'bg-rose-50 text-rose-600',
    },
    amber: {
      card: 'p-4 sm:p-5 border border-amber-200/80 rounded-2xl bg-white shadow-xs hover:border-amber-300 transition-all border-l-4 border-l-amber-500',
      title: 'text-[11px] text-amber-800 uppercase font-bold tracking-wider',
      value: 'text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-sans',
      sub: 'text-xs text-amber-700/80 mt-1 font-medium',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    emerald: {
      card: 'p-4 sm:p-5 border border-teal-200/80 rounded-2xl bg-white shadow-xs hover:border-teal-300 transition-all border-l-4 border-l-teal-600',
      title: 'text-[11px] text-teal-800 uppercase font-bold tracking-wider',
      value: 'text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-sans',
      sub: 'text-xs text-teal-700/80 mt-1 font-medium',
      iconBg: 'bg-teal-50 text-teal-600',
    },
    purple: {
      card: 'p-4 sm:p-5 border border-stone-200/80 rounded-2xl bg-white shadow-xs hover:border-teal-300/80 transition-all',
      title: 'text-[11px] text-stone-500 uppercase font-bold tracking-wider',
      value: 'text-2xl sm:text-3xl font-extrabold text-teal-800 mt-1 font-sans',
      sub: 'text-xs text-stone-500 mt-1',
      iconBg: 'bg-teal-50 text-teal-700',
    },
    dark: {
      card: 'p-4 sm:p-5 border border-stone-200/80 rounded-2xl bg-white shadow-xs hover:border-stone-300 transition-all',
      title: 'text-[11px] text-stone-500 uppercase font-bold tracking-wider',
      value: 'text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-sans',
      sub: 'text-xs text-stone-500 mt-1',
      iconBg: 'bg-stone-100 text-stone-700',
    },
  }[colorScheme] || {
    card: 'p-4 sm:p-5 border border-stone-200/80 rounded-2xl bg-white shadow-xs',
    title: 'text-[11px] text-stone-500 uppercase font-bold tracking-wider',
    value: 'text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-sans',
    sub: 'text-xs text-stone-500 mt-1',
    iconBg: 'bg-stone-100 text-stone-600',
  };

  return (
    <div className={styles.card}>
      <div className="flex items-center justify-between">
        <div className={styles.title}>{title}</div>
        <div className="flex items-center gap-1.5">
          {badgeText && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
              {badgeText}
            </span>
          )}
          {Icon && (
            <div className={`p-1.5 rounded-lg ${styles.iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
      <div className={styles.value}>{value}</div>
      {subtitle && <div className={styles.sub}>{subtitle}</div>}
    </div>
  );
};
