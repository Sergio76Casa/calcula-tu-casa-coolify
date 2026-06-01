"use client";

import { useState, useEffect, useCallback } from "react";
import { pbClient } from "@/lib/pocketbase-client";

interface Agencia {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: boolean;
}

interface Zona {
  id: string;
  codigo_postal: string;
  inmobiliaria_id: string;
  expand?: {
    inmobiliaria_id?: Agencia;
  };
}

export default function AgenciesAdmin() {
  const [tab, setTab] = useState<"agencias" | "zonas">("agencias");
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  // Form states - Agencia
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  // Form states - Zona
  const [cp, setCp] = useState("");
  const [selectedAgencia, setSelectedAgencia] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const inmos = await pbClient.collection("inmobiliarias").getFullList<Agencia>({
        sort: "nombre",
      });
      const zns = await pbClient.collection("zonas_inmobiliarias").getFullList<Zona>({
        expand: "inmobiliaria_id",
        sort: "codigo_postal",
      });
      setAgencias(inmos);
      setZonas(zns);
    } catch (err) {
      console.error("Error al cargar inmobiliarias/zonas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddAgencia(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !email.trim()) return;
    try {
      await pbClient.collection("inmobiliarias").create({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        estado: true,
      });
      setNombre("");
      setTelefono("");
      setEmail("");
      fetchData();
    } catch (err) {
      alert("Error al guardar inmobiliaria");
    }
  }

  async function handleAddZona(e: React.FormEvent) {
    e.preventDefault();
    if (!cp.trim() || !selectedAgencia) return;
    try {
      await pbClient.collection("zonas_inmobiliarias").create({
        codigo_postal: cp.trim(),
        inmobiliaria_id: selectedAgencia,
      });
      setCp("");
      setSelectedAgencia("");
      fetchData();
    } catch (err) {
      alert("Error al asignar zona");
    }
  }

  async function handleToggleEstado(agencia: Agencia) {
    try {
      await pbClient.collection("inmobiliarias").update(agencia.id, {
        estado: !agencia.estado,
      });
      fetchData();
    } catch (err) {
      alert("Error al actualizar estado");
    }
  }

  async function handleDelete(collection: "inmobiliarias" | "zonas_inmobiliarias", id: string) {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;
    try {
      await pbClient.collection(collection).delete(id);
      fetchData();
    } catch (err) {
      alert("Error al eliminar");
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
          <span>🏢 Gestión de Inmobiliarias y Zonas de Captación</span>
        </button>

        {!collapsed && (
          <div className="flex bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setTab("agencias")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === "agencias" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Directorio Agencias
            </button>
            <button
              onClick={() => setTab("zonas")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === "zonas" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Asignación de Zonas
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="mt-6 space-y-6">
          <p className="text-slate-500 text-xs">
            Asigna códigos postales a inmobiliarias colaboradoras para enrutar leads automáticamente
          </p>

          {loading && <div className="text-slate-400 text-xs mb-4">Cargando datos...</div>}

          {/* Tab Directorio Agencias */}
          {tab === "agencias" && (
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Formulario */}
              <form onSubmit={handleAddAgencia} className="lg:col-span-4 bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Añadir Nueva Inmobiliaria</h3>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Nombre Comercial</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Inmobiliaria Sabadell" className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Teléfono Móvil (alertas)</label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required placeholder="+34 600 000 000" className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Email (reportes)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="agencia@web.com" className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors">Guardar Agencia</button>
              </form>

              {/* Tabla de Agencias */}
              <div className="lg:col-span-8 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-2">Nombre</th>
                      <th>Contacto</th>
                      <th>Estado</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {agencias.map(a => (
                      <tr key={a.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold text-white">{a.nombre}</td>
                        <td>
                          <div>{a.telefono}</div>
                          <div className="text-[10px] text-slate-500">{a.email}</div>
                        </td>
                        <td>
                          <button onClick={() => handleToggleEstado(a)} className={`px-2 py-1 rounded-full text-[9px] font-bold ${a.estado ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20" : "bg-red-500/10 text-red-400 border border-red-400/20"}`}>
                            {a.estado ? "Activa" : "Pausada"}
                          </button>
                        </td>
                        <td className="text-right">
                          <button onClick={() => handleDelete("inmobiliarias", a.id)} className="text-red-400 hover:text-red-300 transition-colors">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {agencias.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-slate-500">Ninguna agencia registrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Asignación de Zonas */}
          {tab === "zonas" && (
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Formulario */}
              <form onSubmit={handleAddZona} className="lg:col-span-4 bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Crear Asignación Zona</h3>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Código Postal (CP)</label>
                  <input type="text" value={cp} onChange={e => setCp(e.target.value)} required placeholder="08205" maxLength={5} className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Inmobiliaria Asignada</label>
                  <select value={selectedAgencia} onChange={e => setSelectedAgencia(e.target.value)} required className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-400">
                    <option value="">Selecciona...</option>
                    {agencias.filter(a => a.estado).map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors">Asignar Zona</button>
              </form>

              {/* Tabla de Zonas */}
              <div className="lg:col-span-8 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-2">Código Postal</th>
                      <th>Inmobiliaria Relacionada</th>
                      <th>Contacto Destinatario</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {zonas.map(z => (
                      <tr key={z.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-bold text-white tracking-wider">📍 {z.codigo_postal}</td>
                        <td>{z.expand?.inmobiliaria_id?.nombre || <span className="text-red-400">Sin asignar (agencia eliminada)</span>}</td>
                        <td className="text-slate-500">{z.expand?.inmobiliaria_id?.telefono || "—"}</td>
                        <td className="text-right">
                          <button onClick={() => handleDelete("zonas_inmobiliarias", z.id)} className="text-red-400 hover:text-red-300 transition-colors">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {zonas.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-slate-500">Ninguna zona asignada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
