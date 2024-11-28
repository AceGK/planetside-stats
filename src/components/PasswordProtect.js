'use client';

import { useState } from "react";

export default function PasswordProtect({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const correctPassword = "dread"; // Replace with your password
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h1>Coming Soon</h1>
        <form onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "10px", fontSize: "16px" }}
          />
          <button
            type="submit"
            style={{ padding: "10px", fontSize: "16px", marginLeft: "10px" }}
          >
            Submit
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
