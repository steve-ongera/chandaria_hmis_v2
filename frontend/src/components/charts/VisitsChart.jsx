import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
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
      <div style={{ fontWeight: 700 }}>{payload[0].value} visits</div>
    </div>
  );
}

export default function VisitsChart({ data, title = "Visits", subtitle }) {
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
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
              width={32}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--teal-50)" }} />
            <Bar dataKey="visits" fill="var(--teal-400)" radius={[5, 5, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">No visits recorded in this period yet.</div>
      )}
    </div>
  );
}