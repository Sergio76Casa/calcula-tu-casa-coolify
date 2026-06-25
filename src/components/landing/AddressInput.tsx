"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const MapPreview = dynamic(() => import("./MapPreview"), { ssr: false });

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface Coords { lat: number; lng: number }

interface AddressInputProps {
  value:       string;
  placeholder: string;
  onChange:    (v: string) => void;
}

// ─── Subcomponente: icono casa ────────────────────────────────────────────────

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSuggestion(displayName: string): string {
  // Nominatim devuelve: "Calle X, 28, Ciudad, Provincia, CC.AA., España"
  // Queremos: "Calle X, 28, Ciudad"
  const parts = displayName.split(",").map((p) => p.trim());
  const stopWords = [
    'España', 'Spain', 'Espanya', 'Catalunya', 'Cataluña', 'Andalucía', 'Madrid',
    'Comunitat Valenciana', 'País Vasco', 'Galicia', 'Castilla', 'Aragón', 'Murcia',
    'Navarra', 'Asturias', 'Cantabria', 'Rioja', 'Extremadura', 'Baleares', 'Canarias',
    'Ceuta', 'Melilla',
  ];
  const filtered = parts.filter(
    (p) => !stopWords.some((sw) => p.toLowerCase().includes(sw.toLowerCase()))
  );
  return filtered.slice(0, 3).join(", ");
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AddressInput({ value, placeholder, onChange }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open,        setOpen]        = useState(false);
  const [searching,   setSearching]   = useState(false);
  const [coords,      setCoords]      = useState<Coords | null>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function handleChange(text: string) {
    onChange(text);
    setCoords(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 5) { setSuggestions([]); setOpen(false); return; }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&addressdetails=0&countrycodes=es`;
        const res  = await fetch(url, { headers: { "User-Agent": "CalculaTuCasa/1.0" } });
        const data = (await res.json()) as Suggestion[];
        setSuggestions(data.slice(0, 5));
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 420);
  }

  function selectSuggestion(s: Suggestion) {
    onChange(s.display_name);
    setCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="w-full space-y-0">
      {/* Input row */}
      <div ref={containerRef} className="relative flex-1">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
          <IconHome />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus
          className="w-full pl-12 pr-10 py-4 bg-transparent text-white placeholder-slate-500 text-lg outline-none"
          aria-label="Dirección de la propiedad"
          aria-autocomplete="list"
          aria-expanded={open}
        />

        {/* Spinner */}
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <li key={i} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors flex items-start gap-2"
                >
                  <span className="text-emerald-400 flex-shrink-0 mt-0.5 text-xs">📍</span>
                  <span className="line-clamp-2 leading-snug">{formatSuggestion(s.display_name)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map preview — shown only after a suggestion is selected */}
      {coords && (
        <div className="h-52 rounded-2xl overflow-hidden border border-white/10 mt-3">
          <MapPreview lat={coords.lat} lng={coords.lng} address={value} />
        </div>
      )}
    </div>
  );
}
