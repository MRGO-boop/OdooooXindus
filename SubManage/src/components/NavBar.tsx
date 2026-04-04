import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";

const NavBar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="logo-text">Subs Manage</span>
      </div>

      <div className="navbar-center">
        <Link
          to="/"
          className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
        >
          Home
        </Link>
      </div>

      <div className="navbar-right">
        <Link to="/cart" className="nav-link">
          Cart
        </Link>
        <Link to="/profile" className="nav-link">
          Profile
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
