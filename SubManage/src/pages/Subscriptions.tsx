import React from "react";
import { useState } from "react";
import "./Subscriptions.css";

// Products in Subscriptions lead to Products Page
const Subscriptions: React.FC = () => {
  const [search, setSearch] = useState("");

  // Temp Data
  const products = [
    { id: 1, name: "Netflix", price: 499 },
    { id: 2, name: "Spotify", price: 199 },
    { id: 5, name: "Crunchyroll", price: 89 },
  ];

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="subs-page">
      <div className="subs-container">
        <div className="sidebar">
          <h3>Filters</h3>
          <p>All Subscriptions</p>
        </div>

        <div className="main-subs">
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="subs-grid">
            {filtered.map((p) => (
              <div key={p.id} className="subs-card">
                <h3>{p.name}</h3>
                <p>₹{p.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
