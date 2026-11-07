// Audit trail ATLAX: riwayat aktivitas yang hanya ditambah (append-only).
// Catatan: karena data disimpan di perangkat ini, pengguna yang punya akses ke browser masih bisa mengubah
// localStorage. Perlindungan kuat butuh backend dengan hak akses. Di sini riwayat hanya ditambah dan
// tidak ada fungsi hapus atau ubah di antarmuka.

export const AUDIT_STORAGE_KEY = 'atlax_audit_v1';

export interface AuditEntry {
  id: string;
  waktu: string;
  pengguna: string;
  modul: 'Jurnal' | 'Akun' | 'Bukti Potong' | 'Faktur Pajak' | 'Billing' | 'Administrasi Lainnya';
  aktivitas: string;
  dokumen: string;
  sebelum: string;
  sesudah: string;
  keterangan: string;
}

export const loadAudit = (): AuditEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
};

export const appendAudit = (entry: Omit<AuditEntry, 'id' | 'waktu' | 'pengguna'>) => {
  const current = loadAudit();
  const record: AuditEntry = {
    id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    waktu: new Date().toISOString(),
    pengguna: 'Pengguna perangkat ini',
    ...entry,
  };
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([...current, record]));
};
