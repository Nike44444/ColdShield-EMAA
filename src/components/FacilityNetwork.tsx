import { Building2, MapPin, Navigation } from 'lucide-react';

const facilities = [
  { name: 'National Vaccine Store', country: 'India', state: 'Kerala', district: 'Thiruvananthapuram', role: 'Source cold room' },
  { name: 'District Cold Chain Hub', country: 'India', state: 'Kerala', district: 'Kollam', role: 'Transit replenishment' },
  { name: 'Primary Health Centre', country: 'India', state: 'Kerala', district: 'Kollam', role: 'Destination pharmacist' },
];

export function FacilityNetwork() {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
      <div className="mb-4 flex items-start gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300"><Building2 className="h-5 w-5" /></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">Facility network</p><h2 className="text-base font-semibold text-white">Last-mile route locations</h2></div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {facilities.map((facility, index) => (
          <article key={facility.name} className="relative rounded-xl border border-slate-700/50 bg-slate-950/35 p-3">
            <span className="absolute right-3 top-3 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">{index + 1}</span>
            <p className="pr-8 text-sm font-semibold text-slate-100">{facility.name}</p>
            <p className="mt-1 text-xs text-cyan-300">{facility.role}</p>
            <p className="mt-3 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" /> {facility.country}</p>
            <p className="text-xs text-slate-500">{facility.state} • {facility.district}</p>
          </article>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><Navigation className="h-3.5 w-3.5 text-cyan-400" /> Location records are stored with transit timestamps for the handover audit.</p>
    </section>
  );
}
