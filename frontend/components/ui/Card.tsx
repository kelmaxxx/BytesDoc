import { ReactNode } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export type CardAccent = 'blue' | 'amber' | 'emerald' | 'violet' | 'slate'

interface CardProps {
  title: string
  value: string | number
  icon?: ReactNode
  delta?: number
  deltaLabel?: string
  sparkline?: number[]
  accent?: CardAccent
}

const ACCENTS: Record<CardAccent, { iconBg: string; iconColor: string; sparkColor: string }> = {
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    sparkColor: 'text-blue-500/80 dark:text-blue-400/80',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    sparkColor: 'text-emerald-500/80 dark:text-emerald-400/80',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    sparkColor: 'text-amber-500/80 dark:text-amber-400/80',
  },
  violet: {
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    sparkColor: 'text-violet-500/80 dark:text-violet-400/80',
  },
  slate: {
    iconBg: 'bg-gray-100 dark:bg-white/[0.06]',
    iconColor: 'text-gray-700 dark:text-gray-300',
    sparkColor: 'text-gray-500 dark:text-gray-400',
  },
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null
  const w = 80
  const h = 24
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const step = w / (values.length - 1)
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className ?? 'text-gray-700 dark:text-gray-300'}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export default function Card({ title, value, icon, delta, deltaLabel, sparkline, accent = 'slate' }: CardProps) {
  const hasDelta = typeof delta === 'number'
  const isPositive = hasDelta && delta! >= 0
  const deltaColor = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'
  const DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight
  const cfg = ACCENTS[accent]

  return (
    <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft border border-border-subtle dark:border-white/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 tabular-nums">{value}</p>
          {hasDelta && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${deltaColor}`}>
              <DeltaIcon size={14} />
              <span>{isPositive ? '+' : ''}{delta}</span>
              {deltaLabel && <span className="text-gray-500 dark:text-gray-500 font-normal ml-1">{deltaLabel}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          {icon && (
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${cfg.iconBg} ${cfg.iconColor}`}>
              {icon}
            </div>
          )}
          {sparkline && sparkline.length > 1 && <Sparkline values={sparkline} className={cfg.sparkColor} />}
        </div>
      </div>
    </div>
  )
}
