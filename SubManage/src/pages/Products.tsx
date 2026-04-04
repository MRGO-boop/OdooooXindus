import React from "react";
import "./Products.css";

type Plan = {
  name: string;
  price: string;
};

type Product = {
  name: string;
  description: string;
  image: string;
  plans: Plan[];
};

const Products: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="products">
      <div className="product-container">
        {/* LEFT SIDE */}
        <div className="product-left">
          <div className="product-image">
            <img src={product.image} alt={product.name} />
          </div>

          <h1 className="product-title">{product.name}</h1>
          <p className="product-desc">{product.description}</p>
        </div>

        {/* RIGHT SIDE */}
        <div className="product-right">
          <h2 className="plans-title">Plans</h2>

          <div className="plans-list">
            {product.plans.map((plan, index) => (
              <div key={index} className="plan-card">
                <span>{plan.name}</span>
                <span>{plan.price}</span>
              </div>
            ))}
          </div>

          <div className="divider"></div>

          <p className="confirm-text">Confirmation Dialogue Box</p>

          <div className="product-actions">
            <button className="btn secondary">Add to Cart</button>
            <button className="btn primary">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
