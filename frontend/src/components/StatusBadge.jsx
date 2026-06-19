import React from "react";

const LABELS = {
  REGISTERED: "Registered",
  TRIAGED: "Triaged",
  QUEUED: "Queued",
  IN_CONSULTATION: "In Consultation",
  COMPLETED: "Completed",
};

export default function StatusBadge({ status }) {
  const cls = status ? status.toLowerCase() : "neutral";
  return <span className={`badge badge-${cls}`}>{LABELS[status] || status}</span>;
}