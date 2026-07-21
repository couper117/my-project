// src/components/ProductCard.jsx
import React from "react";

// Step 7.1 & 7.2: Destructure onAddToCart from props
function ProductCard({ product, onAddToCart }) {
  const { name, priceRwf, image, inStock } = product;

  const formattedPrice = new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF"
  }).format(priceRwf);

  return (
    <div className="product-card">
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p>{formattedPrice}</p>
      <p style={{ color: inStock ? "green" : "red" }}>
        {inStock ? "In Stock" : "Out of Stock"}
      </p>
      
      {/* Step 7.1: Add the "Add to cart" button */}
      <button 
        onClick={() => onAddToCart(name)} 
        disabled={!inStock}
      >
        Add to cart
      </button>
    </div>
  );
}

export default ProductCard;