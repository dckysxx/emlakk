'use client';
import { useState } from 'react';

export default function AddListingModal({ onClose }) {
  const [form, setForm] = useState({
    title: '', price: '', rooms: '2+1', type: 'Satılık', description: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.title || !form.price) return alert('Başlık ve fiyat zorunludur');
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-800">🏠 Yeni İlan Ekle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <p className="text-5xl mb-4">🎉</p>
            <p className="font-semibold text-slate-800 text-lg">İlanınız onay bekliyor!</p>
            <p className="text-slate-400 text-sm mt-2">İncelendikten sonra yayına alınacak.</p>
            <button onClick={onClose} className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm">Tamam</button>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-4">

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">İlan Başlığı</label>
              <input
                type="text"
                placeholder="Örn: Çorlu Merkezde 3+1 Satılık Daire"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Fiyat</label>
              <input
                type="text"
                placeholder="Örn: 2.800.000 ₺"
                value={form.price}
                onChange={e => update('price', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">İlan Tipi</label>
              <div className="flex gap-3">
                {['Satılık', 'Kiralık'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => update('type', opt)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${
                      form.type === opt ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Oda Sayısı</label>
              <div className="flex gap-2 flex-wrap">
                {['1+1', '2+1', '3+1', '4+1', '5+'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => update('rooms', opt)}
                    className={`px-4 py-2 rounded-xl text-sm transition border ${
                      form.rooms === opt ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Fotoğraf Yükle</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm hover:border-emerald-300 transition cursor-pointer">
                📷 Fotoğraf seçmek için tıklayın
                <p className="text-xs mt-1 text-slate-300">JPG, PNG · Maks 5MB</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Açıklama</label>
              <textarea
                placeholder="İlan hakkında detaylı bilgi..."
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition mt-2"
            >
              İlanı Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}