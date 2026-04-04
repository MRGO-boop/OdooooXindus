import React, { useState } from "react";
import "./Shop.css";

const Shop: React.FC = () => {
  const [search, setSearch] = useState("");

  // Temp Data
  const products = [
    { id: 1, name: "Netflix", price: 499 },
    { id: 2, name: "Spotify", price: 199 },
    { id: 3, name: "Amazon Prime", price: 299 },
    { id: 4, name: "Disney+", price: 399 },
    { id: 5, name: "Crunchyroll", price: 89 },
  ];

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="shop-page">
      <div className="shop-container">
        <div className="sidebar">
          <h3>Filters</h3>
          <p>All Products</p>
        </div>

        <div className="main-shop">
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="product-grid">
            {filtered.map((p) => (
              <div key={p.id} className="product-card">
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

export default Shop;
