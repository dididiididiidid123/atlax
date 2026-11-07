// Pesan singkat yang muncul di pojok bawah setelah suatu tindakan (simpan, hapus, cetak, dan sebagainya).
// Dipanggil dari mana saja: notify('ok', 'Data tersimpan.') atau notify('error', 'NIK belum lengkap.').
// ToastHost (di App) yang menampilkannya.

export type ToastType = 'ok' | 'error';
export interface ToastDetail {
  type: ToastType;
  text: string;
}

export const TOAST_EVENT = 'atlax:toast';

export const notify = (type: ToastType, text: string) => {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { type, text } }));
};
