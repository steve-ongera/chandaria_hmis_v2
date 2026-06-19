import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#136a71", "#2ba6a8", "#5b6fb0", "#b0701a", "#2e8b57", "#8a6d3b", "#c0392b", "#1f7fae"];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div style={{
      background: "var(--ink-900)", color: "var(--text-on-dark)",
      padding: "8px 12px", borderRadius: 8, fontSize: 12.5,
    }}>
      <div style={{ fontWeight: 700 }}>{row.name}</div>
      <div style={{ opacity: 0.8 }}>
        {row.isCurrency ? `KES ${Number(row.value).toLocaleString()}` : row.value}
      </div>
    </div>
  );
}

export default function BreakdownChart({ data, title, subtitle, isCurrency = false }) {
  const hasData = data && data.length > 0;
  const enriched = hasData ? data.map((d) => ({ ...d, isCurrency })) : [];

  return (
    <div className="chart-card">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={enriched}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {enriched.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconSize={8}
              wrapperStyle={{ fontSize: 11.5, color: "var(--text-secondary)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">No data for this period yet.</div>
      )}
    </div>
  );
}