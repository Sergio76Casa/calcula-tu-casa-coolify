"use client";

import { useState } from "react";
import { pbClient } from "@/lib/pocketbase-client";

export default function LoginGate() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await pbClient.collection("_superusers").authWithPassword(email, password);
    } catch (err) {
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/10 border border-blue-400/20 rounded-2xl mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-black text-white">Panel Admin</h1>
          <p className="text-slate-500 text-sm mt-1">ValorExacto · Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <input
              type="email" value={email} required autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 focus:border-blue-400 rounded-xl text-white outline-none transition-colors placeholder-slate-600"
              placeholder="admin@tudominio.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Contraseña</label>
            <input
              type="password" value={password} required autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 focus:border-blue-400 rounded-xl text-white outline-none transition-colors"
            />
          </div>

          {error && (
            <p role="alert" className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-200">
            {loading ? "Accediendo..." : "Acceder al panel"}
          </button>
        </form>

      </div>
    </div>
  );
}
