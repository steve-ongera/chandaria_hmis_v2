import React from "react";

export default function StatCard({ icon: Icon, label, value, meta }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className="stat-card-icon">
            <Icon />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {meta && <div className="stat-card-meta">{meta}</div>}
    </div>
  );
}