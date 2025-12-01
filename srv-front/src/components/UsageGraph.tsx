/**
 * UsageGraph Component
 * Displays usage data in a bar chart
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { cn } from '@/lib/utils';

export interface UsageDataPoint {
  date: string;
  minutes: number;
  label?: string;
}

export interface UsageGraphProps {
  data: UsageDataPoint[];
  title: string;
  period: 'daily' | 'weekly' | 'monthly';
  className?: string;
}

export function UsageGraph({ data, title, period, className }: UsageGraphProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      name: point.label || formatDateLabel(point.date, period),
      minutes: point.minutes,
      hours: (point.minutes / 60).toFixed(1),
    }));
  }, [data, period]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-zinc-200 dark:stroke-zinc-700"
            />
            <XAxis
              dataKey="name"
              className="text-xs text-zinc-600 dark:text-zinc-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs text-zinc-600 dark:text-zinc-400"
              tick={{ fill: 'currentColor' }}
              label={{
                value: 'Minutes',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Legend />
            <Bar
              dataKey="minutes"
              fill="#0D9488"
              name="Usage (minutes)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
        {data.name}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {data.minutes} minutes ({data.hours} hours)
      </p>
    </div>
  );
}

function formatDateLabel(date: string, period: 'daily' | 'weekly' | 'monthly'): string {
  const d = new Date(date);

  if (period === 'daily') {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  if (period === 'weekly') {
    return `Week ${getWeekNumber(d)}`;
  }

  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
