"use client";

import { useState } from "react";
import { T, type Lang } from "@/lib/translations";

type GuideTab = "pixel" | "manychat";

export default function SetupGuides({ lang = "es" }: { lang?: Lang }) {
  const [activeTab, setActiveTab] = useState<GuideTab>("pixel");
  const t = T(lang).roadmap;

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h2 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
        {t.guideTitle}
      </h2>
      <p className="text-slate-400 text-xs mb-6">
        {t.guideDesc}
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveTab("pixel")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "pixel"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          }`}
        >
          {t.tabPixel}
        </button>
        <button
          onClick={() => setActiveTab("manychat")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "manychat"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          }`}
        >
          {t.tabManychat}
        </button>
      </div>

      {activeTab === "pixel" ? (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p className="text-slate-400 text-xs">
            {t.pixelIntro}
          </p>
          <div className="space-y-3">
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Event 1</span>
              <h4 className="text-white font-bold text-sm">{t.pixelEvent1Title}</h4>
              <p className="text-slate-400 text-xs mt-1">{t.pixelEvent1Desc}</p>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">Event 2</span>
              <h4 className="text-white font-bold text-sm">{t.pixelEvent2Title}</h4>
              <p className="text-slate-400 text-xs mt-1">{t.pixelEvent2Desc}</p>
            </div>
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Event 3</span>
              <h4 className="text-white font-bold text-sm">{t.pixelEvent3Title}</h4>
              <p className="text-slate-400 text-xs mt-1">{t.pixelEvent3Desc}</p>
            </div>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-200 mt-2">
            {t.pixelTip}
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p className="text-slate-400 text-xs">
            {t.manychatIntro}
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-300">
            <li>
              {t.manychatStep1}
            </li>
            <li>
              {t.manychatStep2}
              <ul className="list-disc pl-5 mt-1 text-slate-400 space-y-1">
                <li><code className="text-slate-300">direccion</code></li>
                <li><code className="text-slate-300">m2</code></li>
                <li><code className="text-slate-300">estado</code> (nuevo, bueno, regular, a_reformar)</li>
              </ul>
            </li>
            <li>
              {t.manychatStep3}
              <ul className="list-disc pl-5 mt-1 text-slate-400">
                <li>{t.manychatStep3Url}</li>
                <li>{t.manychatStep3Body}</li>
              </ul>
            </li>
            <li>
              {t.manychatStep4}
            </li>
            <li>
              {t.manychatStep5}
            </li>
          </ol>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-300">
            {t.manychatTip}
          </div>
        </div>
      )}
    </div>
  );
}
