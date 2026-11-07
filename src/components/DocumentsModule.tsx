import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DraftDocuments } from './DraftDocuments';
import { EmptyState } from './EmptyState';
import { DOKUMEN_EVENT, SavedDoc, deleteDoc, loadDocs } from '../utils/dokumenStore';
import { formatRupiah } from '../utils/taxCalculator';
import { ComprehensiveTaxState, TaxFormData, TaxCalculationResult, UniversalTaxResult } from '../types/tax';
import { FileCheck } from 'lucide-react';

interface DocumentsModuleProps {
  wizardData: TaxFormData;
  wizardCalc: TaxCalculationResult;
  multiState: ComprehensiveTaxState;
  multiCalc: UniversalTaxResult;
}

// Modul Dokumen: SPT Tahunan, SSP, SKP, dan STP dibuat otomatis dari hitungan, lalu dokumen yang sudah disimpan.
export const DocumentsModule: React.FC<DocumentsModuleProps> = (props) => {
  const [docs, setDocs] = useState<SavedDoc[]>(loadDocs);

  useEffect(() => {
    const refresh = () => setDocs(loadDocs());
    window.addEventListener(DOKUMEN_EVENT, refresh);
    return () => window.removeEventListener(DOKUMEN_EVENT, refresh);
  }, []);

  const remove = (doc: SavedDoc) => {
    if (window.confirm(`Hapus dokumen "${doc.title}" dari daftar ini?`)) deleteDoc(doc.id);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <p className="t-card">Dokumen dari hitungan Anda</p>
          <p className="t-note">SPT Tahunan, SSP, SKP, dan STP terisi otomatis dari angka di Kalkulator dan Panduan SPT.</p>
        </div>
        <DraftDocuments {...props} kinds={['SPT', 'SSP', 'SKP', 'STP']} />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="t-card">Dokumen tersimpan</p>
            <p className="t-note">Yang sudah Anda simpan dengan tombol Simpan dokumen.</p>
          </div>
          <span className="chip-neutral chip">{docs.length} dokumen</span>
        </div>

        {docs.length === 0 ? (
          <div className="card">
            <EmptyState icon={FileCheck} text="Belum ada dokumen tersimpan. Buka dokumen di atas, lalu tekan Simpan dokumen." />
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {docs.map((doc) => (
              <li key={doc.id} className="card space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="chip-info chip">{doc.kind}</span>
                    <p className="t-card mt-2">{doc.title}</p>
                    <p className="t-note">Disimpan {new Date(doc.savedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <button type="button" onClick={() => remove(doc)} className="btn-secondary btn-sm" aria-label={`Hapus ${doc.title}`}>
                    <Trash2 className="h-5 w-5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
                <p className="t-result">{formatRupiah(doc.amount)}</p>
                <p className="t-body">{doc.status}</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-200 pt-3">
                  {doc.rows.map((r) => (
                    <React.Fragment key={r.label}>
                      <dt className="t-note">{r.label}</dt>
                      <dd className="t-body font-semibold text-slate-900">{r.value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
