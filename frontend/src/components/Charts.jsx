import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DAYS, formatINR, shortDate } from '../utils/format';

const tick = { fontSize: 12, fill: '#64748B' };
const rupee = (v) => `₹${Math.round(v / 100)}`;
const money = (v) => formatINR(v);

export function DailyBars({ days }) {
  const data = days.map((d, i) => ({ name: DAYS[i].slice(0, 3), 'Already in pantry': d.totalCost - d.additionalCost, 'To buy': d.additionalCost }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -10, right: 8 }}>
        <CartesianGrid vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} tickFormatter={rupee} axisLine={false} tickLine={false} />
        <Tooltip formatter={money} cursor={{ fill: '#F0FDF4' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Already in pantry" stackId="a" fill="#BBF7D0" />
        <Bar dataKey="To buy" stackId="a" fill="#166534" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, format = money }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <p className="py-16 text-center text-sm text-slate-500">Nothing to show yet.</p>;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={format} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600">{d.name}</span>
            <span className="ml-auto pl-3 font-semibold">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendLine({ trend }) {
  const data = trend.map((t) => ({ name: shortDate(t.weekStart), Spent: t.spent, 'Meal plan value': t.planned, Budget: t.budget }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -10, right: 8 }}>
        <CartesianGrid vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
        <YAxis tick={tick} tickFormatter={rupee} axisLine={false} tickLine={false} />
        <Tooltip formatter={money} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="Budget" stroke="#94A3B8" strokeDasharray="5 4" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="Meal plan value" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Spent" stroke="#166534" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HBars({ data }) {
  if (!data.length) return <p className="py-16 text-center text-sm text-slate-500">Plan some meals to see your most used ingredients.</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 16 }}>
        <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={tick} width={110} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => [`${v} planned meals`, 'Used in']} cursor={{ fill: '#F0FDF4' }} />
        <Bar dataKey="count" fill="#10B981" radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
