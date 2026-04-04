import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

const HomePage: React.FC = () => {
  return (
    <div className="homepage">
      <div className="main-content">
        <div className="left-section">
          <h1 className="main-title">Subs Manage</h1>
          <p className="subtitle">Your all in one subscription manager</p>
        </div>

        <div className="right-section">
          <div>
            <h2>Manage Subscriptions</h2>
            <Link
              to="/subs"
              className={`nav-link ${
                location.pathname === "/subs" ? "active" : ""
              }`}
            >
              <button className="go-button">GO</button>
            </Link>
          </div>

          <div>
            <h2>Explore Services</h2>
            <Link
              to="/shop"
              className={`nav-link ${
                location.pathname === "/shop" ? "active" : ""
              }`}
            >
              <button className="go-button">GO</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
