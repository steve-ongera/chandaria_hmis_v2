import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--ink-900)", color: "var(--text-on-dark)",
      padding: "8px 12px", borderRadius: 8, fontSize: 12.5,
    }}>
      <div style={{ opacity: 0.7, marginBottom: 2 }}>{formatDate(label)}</div>
      <div style={{ fontWeight: 700 }}>KES {Number(payload[0].value).toLocaleString()}</div>
    </div>
  );
}

export default function RevenueChart({ data, title = "Revenue", subtitle }) {
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
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--teal-600)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--teal-600)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">No revenue recorded in this period yet.</div>
      )}
    </div>
  );
}