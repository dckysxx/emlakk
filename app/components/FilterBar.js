'use client';

const ROOM_OPTIONS = ['Tümü', '1+1', '2+1', '3+1', '4+1'];
const TYPE_OPTIONS = ['Tümü', 'Satılık', 'Kiralık'];
const LOCATION_OPTIONS = ['Tümü', 'Tekirdağ', 'Çorlu'];

export default function FilterBar({ filters, setFilters }) {
  const update = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center border border-slate-100">
      
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 font-medium">Tür</label>
        <div className="flex gap-2">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => update('type', opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filters.type === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 font-medium">📍 Konum</label>
        <div className="flex gap-2">
          {LOCATION_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => update('location', opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filters.location === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 font-medium">Oda Sayısı</label>
        <div className="flex gap-2 flex-wrap">
          {ROOM_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => update('rooms', opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filters.rooms === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}