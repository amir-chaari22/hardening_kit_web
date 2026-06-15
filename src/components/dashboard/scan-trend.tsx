'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type TrendPoint = { date: string; approved: number; blocked: number; needs: number }

export default function ScanTrend({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scan trend (30 days)</CardTitle>
        <CardDescription>Daily scan decisions across all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradApprove" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradBlock" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="url(#gradApprove)" name="Approved" />
            <Area type="monotone" dataKey="blocked"  stackId="1" stroke="#ef4444" fill="url(#gradBlock)"   name="Blocked" />
            <Area type="monotone" dataKey="needs"    stackId="1" stroke="#f59e0b" fill="transparent"       name="Needs Fixes" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
