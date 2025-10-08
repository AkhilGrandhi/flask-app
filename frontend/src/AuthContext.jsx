import { createContext, useContext, useEffect, useState } from "react";
import { meApi, logoutApi } from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meApi().then(d => setUser(d.user)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const logout = async () => { await logoutApi(); setUser(null); };

  return <AuthCtx.Provider value={{ user, setUser, loading, logout }}>{children}</AuthCtx.Provider>;
}
