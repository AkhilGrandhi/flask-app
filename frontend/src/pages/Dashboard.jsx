import { useAuth } from "../AuthContext";
export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h2>{user?.role === "admin" ? "Admin Panel" : "User Dashboard"}</h2>
      <p>Welcome, role: <b>{user?.role}</b>, id: <b>{user?.id}</b></p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
