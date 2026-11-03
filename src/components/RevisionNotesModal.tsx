import React from 'react';
import { BookOpen, X, Calculator, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RevisionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RevisionNotesModal: React.FC<RevisionNotesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-neutral-900 border-2 border-emerald-500/50 rounded-2xl shadow-2xl p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Fredoka'] text-emerald-400">
                Nota Poket Matematik Tingkatan 1
              </h2>
              <p className="text-xs text-neutral-400">
                Bab 4.5: Perkaitan Nisbah, Kadar, Kadaran dengan Peratusan, Pecahan & Perpuluhan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 my-4 text-sm">
          {/* Card 1: Segi Tiga Penukaran */}
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-2 font-semibold text-emerald-300">
              <Calculator className="w-4 h-4" />
              <span>1. Segi Tiga Penukaran Asas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                <span className="font-bold text-amber-400 block mb-1">Nisbah ➔ Peratus</span>
                <p className="text-neutral-300">Tulis nisbah sebagai pecahan, kemudian darab 100%.</p>
                <code className="text-emerald-400 block mt-1">3 : 5 = 3/5 × 100% = 60%</code>
              </div>
              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                <span className="font-bold text-sky-400 block mb-1">Peratus ➔ Nisbah</span>
                <p className="text-neutral-300">Tulis atas penyebut 100, permudahkan ke bentuk termudah.</p>
                <code className="text-emerald-400 block mt-1">45% = 45/100 = 9 : 20</code>
              </div>
              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                <span className="font-bold text-purple-400 block mb-1">Perpuluhan ➔ Peratus</span>
                <p className="text-neutral-300">Darabkan dengan 100% (gerakkan titik 2 kali ke kanan).</p>
                <code className="text-emerald-400 block mt-1">0.75 × 100% = 75% = 3 : 4</code>
              </div>
            </div>
          </div>

          {/* Card 2: Konsep Kadaran */}
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-2 font-semibold text-sky-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>2. Menentukan Nilai Menggunakan Kaedah Kadaran</span>
            </div>
            <p className="text-xs text-neutral-300 mb-2">
              Kadaran ialah satu hubungan yang menyatakan bahawa dua nisbah atau dua kadar adalah setara:
            </p>
            <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 text-xs space-y-1.5 font-mono">
              <p className="text-neutral-200">
                <span className="text-amber-400">Kuantiti sebahagian / Jumlah kuantiti</span> = <span className="text-sky-400">p / 100</span>
              </p>
              <p className="text-neutral-400">
                Contoh: Cari peratus bagi 18 orang murid daripada 25 orang murid.
              </p>
              <p className="text-emerald-400">
                18 / 25 = p / 100 ➔ p = (18 × 100) ÷ 25 = 72%
              </p>
            </div>
          </div>

          {/* Card 3: Situasi Harian */}
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-2 font-semibold text-purple-300">
              <ArrowRight className="w-4 h-4" />
              <span>3. Situasi Masalah Harian (Diskaun, Bancuhan, Kadar)</span>
            </div>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Nisbah Bahagian Campuran:</strong> Jika bancuhan sirap kepada air ialah 1 : 4, jumlah bahagian ialah 1 + 4 = 5 bahagian. Peratus sirap ialah 1/5 × 100% = 20%.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Diskaun dan Peratusan Jualan:</strong> Jika harga barang mendapat diskaun 25%, peratus harga yang perlu dibayar ialah 100% - 25% = 75%. Nisbah diskaun kepada harga jualan = 25 : 75 = 1 : 3.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Nisbah Tiga Kuantiti:</strong> Diberi nisbah A : B : C = 2 : 3 : 5. Jumlah bahagian = 2 + 3 + 5 = 10 bahagian. Peratusan A = (2/10) × 100% = 20%.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition"
          >
            Faham & Teruskan Misi
          </button>
        </div>
      </div>
    </div>
  );
};
