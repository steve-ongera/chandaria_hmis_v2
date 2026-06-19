import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div style={{
      background: "var(--ink-900)", color: "var(--text-on-dark)",
      padding: "8px 12px", borderRadius: 8, fontSize: 12.5,
    }}>
      <div style={{ fontWeight: 700 }}>{row.name}</div>
      <div style={{ opacity: 0.8 }}>Stock: {row.stock_quantity} · Reorder at: {row.reorder_level}</div>
    </div>
  );
}

export default function StockChart({ data, title = "Low Stock Medicines", subtitle }) {
  const hasData = data && data.length > 0;

  return (
    <div className="chart-card">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 38)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 24, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--text-primary)" }}
              axisLine={false}
              tickLine={false}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--teal-50)" }} />
            <Bar dataKey="stock_quantity" radius={[0, 5, 5, 0]} maxBarSize={18}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.stock_quantity <= entry.reorder_level ? "var(--danger)" : "var(--teal-400)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">All stock levels are healthy.</div>
      )}
    </div>
  );
}