// src/components/ProductList.jsx
import React from "react";
import ProductCard from "./ProductCard";

// Example Parent Component
function ProductList() {
  const handleAddToCart = (productName) => {
    // Step 7.3: The log required by your instructions
    console.log("Added:", productName);
  };

  return (
    <div className="list">
      {products.map(p => (
        <ProductCard 
          key={p.id} 
          product={p} 
          onAddToCart={handleAddToCart} 
        />
      ))}
    </div>
  );
}

export default ProductList;