"use client";

import { useState } from "react";
import { T, type Lang } from "@/lib/translations";

export default function ProfitabilitySimulator({ lang = "es" }: { lang?: Lang }) {
  const [budget, setBudget] = useState(150); // € mensual
  const [cpl, setCpl] = useState(5);       // € coste por lead
  const [salePrice, setSalePrice] = useState(30); // € venta del lead

  const leads = Math.floor(budget / cpl);
  const totalCost = budget;
  const revenue = leads * salePrice;
  const netProfit = revenue - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  const t = T(lang).roadmap;

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h2 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
        {t.simTitle}
      </h2>
      <p className="text-slate-400 text-xs mb-6">
        {t.simDesc}
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Sliders de Configuración */}
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-300 font-medium">{t.simBudget}</span>
              <span className="text-blue-400 font-bold">{budget} €</span>
            </div>
            <input
              type="range"
              min="50"
              max="1500"
              step="10"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>50 €</span>
              <span>1.500 €</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-300 font-medium">{t.simCpl}</span>
              <span className="text-amber-400 font-bold">{cpl} €</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="0.5"
              value={cpl}
              onChange={(e) => setCpl(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>2 € ({t.simCplExcellent})</span>
              <span>20 € ({t.simCplExpensive})</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-300 font-medium">{t.simSalePrice}</span>
              <span className="text-emerald-400 font-bold">{salePrice} €</span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={salePrice}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>15 € ({t.simSalePriceLow})</span>
              <span>120 € ({t.simSalePriceExcl})</span>
            </div>
          </div>
        </div>

        {/* Métricas Resultantes */}
        <div className="grid grid-cols-2 gap-4 bg-slate-900/60 border border-white/5 rounded-xl p-5">
          <div className="col-span-2 text-center pb-2 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{t.simLeadsCaptured}</p>
            <p className="text-3xl font-black text-white mt-1">{leads} <span className="text-sm font-normal text-slate-400">{t.simLeadsPerMonth}</span></p>
          </div>

          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{t.simInvestment}</p>
            <p className="text-lg font-bold text-slate-300 mt-0.5">{totalCost} €</p>
          </div>

          <div className="pt-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{t.simRevenue}</p>
            <p className="text-lg font-bold text-slate-300 mt-0.5">{revenue} €</p>
          </div>

          <div className="col-span-2 pt-4 border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">{t.simNetProfit}</p>
              <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} mt-0.5`}>
                {netProfit.toLocaleString("es-ES")} €
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">{t.simRoi}</p>
              <p className={`text-lg font-extrabold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'} mt-0.5`}>
                {roi.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
