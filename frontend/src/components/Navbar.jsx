import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { IconLogout } from "./icons";

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || user.username[0].toUpperCase()
    : "";

  return (
    <header className="navbar">
      <div className="navbar-title">{title}</div>
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-user-avatar">{initials}</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </span>
            <span className="navbar-user-role">{user?.role?.toLowerCase()}</span>
          </div>
        </div>
        <button className="navbar-logout" onClick={handleLogout}>
          <IconLogout style={{ width: 14, height: 14, marginRight: 5 }} />
          Logout
        </button>
      </div>
    </header>
  );
}