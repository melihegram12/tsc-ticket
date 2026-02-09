'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface ChartProps {
    data: any[];
}

export function TicketVolumeChart({ data }: ChartProps) {
    return (
        <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Trendi (Son 7 Gün)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area
                        type="monotone"
                        dataKey="created"
                        name="Açılan"
                        stackId="1"
                        stroke="#6366f1"
                        fill="#818cf8"
                        fillOpacity={0.2}
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="resolved"
                        name="Çözülen"
                        stackId="2"
                        stroke="#10b981"
                        fill="#34d399"
                        fillOpacity={0.2}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
