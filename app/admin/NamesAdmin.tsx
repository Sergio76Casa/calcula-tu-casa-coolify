"use client";

import { useState, useEffect, useCallback } from "react";
import { pbClient } from "@/lib/pocketbase-client";
import { T, type Lang } from "@/lib/translations";

interface SocialProofName {
  id: string;
  name: string;
}

interface NamesAdminProps {
  lang?: Lang;
}

export default function NamesAdmin({ lang = "es" }: NamesAdminProps) {
  const [names, setNames] = useState<SocialProofName[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const t = T(lang).admin.names;

  const fetchNames = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pbClient.collection("social_proof_names").getFullList({
        sort: "name",
      });
      setNames((data as unknown as SocialProofName[]) ?? []);
    } catch (err) {
      console.error("Error al cargar nombres:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  async function handleAddName(e: React.FormEvent) {
    e.preventDefault();
    const nameToAdd = newName.trim();
    if (!nameToAdd) return;

    if (names.some(n => n.name.toLowerCase() === nameToAdd.toLowerCase())) {
      alert(t.alreadyRegistered);
      return;
    }

    try {
      await pbClient.collection("social_proof_names").create({
        name: nameToAdd,
      });
      setNewName("");
      fetchNames();
    } catch (err) {
      alert(t.errorSave);
    }
  }

  async function handleDeleteName(id: string) {
    try {
      await pbClient.collection("social_proof_names").delete(id);
      fetchNames();
    } catch (err) {
      alert(t.errorDelete);
    }
  }

  return (
    <section className="bg-slate-900 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <span className="text-[10px]">{collapsed ? "▶" : "▼"}</span>
          <span>{t.title.replace("{count}", String(names.length))}</span>
        </button>
      </div>

      {!collapsed && (
        <div className="mt-6 space-y-6">
          <p className="text-slate-500 text-xs">
            {t.info}
          </p>

          {/* Formulario de Adición */}
          <form onSubmit={handleAddName} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t.placeholder}
              required
              className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400 placeholder-slate-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              {t.add}
            </button>
          </form>

          {loading && <div className="text-slate-400 text-xs">{t.loading}</div>}

          {/* Listado de Nombres */}
          <div className="flex flex-wrap gap-2 pt-2 max-h-60 overflow-y-auto pr-1">
            {names.map(n => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-white/5 text-slate-200 text-xs rounded-full font-medium transition-colors hover:border-red-500/30 group"
              >
                <span>{n.name}</span>
                <button
                  onClick={() => handleDeleteName(n.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-0.5 rounded"
                  title={`Eliminar ${n.name}`}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </span>
            ))}
            {names.length === 0 && !loading && (
              <span className="text-slate-500 text-xs">{t.empty}</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
