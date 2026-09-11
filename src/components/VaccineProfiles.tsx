import { Snowflake, Thermometer, TriangleAlert } from 'lucide-react';

const profiles = [
  { vaccine: 'Engerix-B', type: 'Hepatitis B', band: '2°C — 8°C', budget: '120 min', warning: 'Freeze-sensitive: lock below 0.5°C', tone: 'cyan' },
  { vaccine: 'Flucelvax', type: 'Influenza', band: '2°C — 8°C', budget: '180 min', warning: 'Freeze-sensitive: lock below 1°C', tone: 'cyan' },
  { vaccine: 'RabAvert', type: 'Rabies PCEC', band: '2°C — 8°C', budget: '90 min', warning: 'Freeze-sensitive: lock below 0°C', tone: 'cyan' },
  { vaccine: 'M-M-R II', type: 'Measles, Mumps, Rubella', band: '-25°C — -15°C', budget: '60 min', warning: 'Deep-frozen profile', tone: 'blue' },
  { vaccine: 'Comirnaty', type: 'mRNA COVID-19', band: '-80°C — -60°C', budget: '30 min', warning: 'Ultra-cold: heat critical above -50°C', tone: 'violet' },
  { vaccine: 'Ervebo', type: 'Ebola Zaire Live', band: '-85°C — -65°C', budget: '25 min', warning: 'Ultra-cold profile', tone: 'violet' },
];

export function VaccineProfiles() {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
      <div className="mb-4 flex items-start gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><Snowflake className="h-5 w-5" /></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">Stability matrix</p><h2 className="text-base font-semibold text-white">Vaccine safety profiles</h2></div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <article key={profile.vaccine} className="rounded-xl border border-slate-700/50 bg-slate-950/35 p-3">
            <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold text-slate-100">{profile.vaccine}</h3><p className="text-xs text-slate-500">{profile.type}</p></div><Thermometer className={`h-4 w-4 ${profile.tone === 'violet' ? 'text-violet-300' : 'text-cyan-300'}`} /></div>
            <div className="mt-3 flex justify-between text-xs"><span className="text-slate-500">Storage</span><span className="font-medium text-cyan-200">{profile.band}</span></div>
            <div className="mt-1 flex justify-between text-xs"><span className="text-slate-500">Thermal budget</span><span className="text-slate-300">{profile.budget}</span></div>
            <p className="mt-2 flex gap-1 text-[11px] leading-4 text-amber-200"><TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />{profile.warning}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
