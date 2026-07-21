// src/App.jsx
import React, { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import SearchBar from "./components/SearchBar"; 
import ProductList from "./components/ProductList";
import { PRODUCTS } from "./data/products"; 
import UserForm from "./components/Form";

import './App.css';

function App() {
  const [showSpecial, setShowSpecial] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddToCart = (productName) => {
    console.log("Added:", productName);
  };

  const filteredProducts = PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* <Header name = {"keke"} />
      <Hero /> */}
      <UserForm />

      {/* <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <button className="counter" onClick={() => setShowSpecial(!showSpecial)}>
        {showSpecial ? "Hide Today's Special" : "Show Today's Special"}
      </button>

      {showSpecial && <ProductCard product={PRODUCTS[0]} onAddToCart={handleAddToCart} />}

      <ProductList 
        products={filteredProducts} 
        onAddToCart={handleAddToCart} 
      />

      <Footer /> */}
    </>
  );
}

export default App; 