// src/App.tsx

import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

function LoginPage() {
  const { login, logout, user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1>Welcome! 🎉</h1>
        <div
          style={{
            background: "#f5f5f5",
            padding: "1.5rem",
            borderRadius: "8px",
            marginTop: "1rem",
          }}
        >
          <h2>User Information:</h2>
          <p>
            <strong>Name:</strong> {user.name || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {user.email || "N/A"}
          </p>
          <p>
            <strong>Subject ID:</strong> {user.sub}
          </p>
          {user.given_name && (
            <p>
              <strong>First Name:</strong> {user.given_name}
            </p>
          )}
          {user.family_name && (
            <p>
              <strong>Last Name:</strong> {user.family_name}
            </p>
          )}
        </div>
        <button
          onClick={logout}
          style={{
            marginTop: "2rem",
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "2rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>OIDC Authentication Demo</h1>
        <p>Sign in with Velocity Frequent Flyer</p>
      </div>
      <button
        onClick={login}
        style={{
          padding: "12px 32px",
          fontSize: "18px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        Sign In with OIDC
      </button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

export default App;
