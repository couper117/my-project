import React from "react";

function Header({name}) {
  return (
    <header>
      <h2>Simba Supermarket</h2>
      <h1>{name}</h1>
    </header>
  );
}

export default Header;