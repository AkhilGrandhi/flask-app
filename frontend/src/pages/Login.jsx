import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

 const onSubmit = async (e) => {
  e.preventDefault();
  setErr("");
  try {
    await api("/auth/login", { method: "POST", body: { email, password } });
    const me = await api("/auth/me");
    if (me.user.role === "admin") nav("/admin", { replace: true });
    else nav("/recruiter", { replace: true });
  } catch (e) {
    setErr(e.message);
  }
};

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "4rem auto" }}>
      <h2>Sign in</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <label>Email</label>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} />
      <label>Password</label>
      <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
