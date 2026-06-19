import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  IconDashboard, IconUserPlus, IconActivity, IconCash, IconShoppingBag,
  IconQueue, IconBox, IconTag, IconCode, IconNote, IconUsers,
} from "./icons";

const NAV_BY_ROLE = {
  NURSE: [
    { to: "/nurse/dashboard", label: "Dashboard", icon: IconDashboard },
    { to: "/nurse/reception", label: "Reception", icon: IconUserPlus },
    { to: "/nurse/triage", label: "Triage", icon: IconActivity },
    { to: "/nurse/billing", label: "Billing & Dispensing", icon: IconCash },
    { to: "/nurse/walkin", label: "Walk-in Sale", icon: IconShoppingBag },
  ],
  DOCTOR: [
    { to: "/doctor/dashboard", label: "Dashboard", icon: IconDashboard },
    { to: "/doctor/queue", label: "Consultation Queue", icon: IconQueue },
  ],
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", icon: IconDashboard },
    { to: "/admin/medicines", label: "Medicines", icon: IconBox },
    { to: "/admin/consultation-types", label: "Consultation Types", icon: IconTag },
    { to: "/admin/icd10-codes", label: "ICD-10 Codes", icon: IconCode },
    { to: "/admin/diagnosis-notes", label: "Diagnosis Notes", icon: IconNote },
    { to: "/admin/users", label: "Users", icon: IconUsers },
  ],
};

const ROLE_LABEL = { ADMIN: "Admin", DOCTOR: "Doctor", NURSE: "Nurse" };

export default function Sidebar() {
  const { role } = useAuth();
  const links = NAV_BY_ROLE[role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">H</div>
        <div>
          <div className="sidebar-brand-text">South B HMIS</div>
          <div className="sidebar-brand-sub">{ROLE_LABEL[role]} Workspace</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <link.icon />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">South B Hospital · Level 5</div>
    </aside>
  );
}