/**
 * Muat ulang otomatis saat ada versi baru aplikasi (hasil deploy ulang).
 *
 * Cara kerja:
 * 1. Mencatat berkas aset build yang sedang dimuat (file JS/CSS di /assets/).
 * 2. Berkala mengambil ulang halaman utama tanpa cache dan membandingkan daftar aset-nya.
 * 3. Jika berbeda, versi baru ditandai. Halaman dimuat ulang saat tidak sedang dipakai:
 *    tab disembunyikan, atau tidak ada aktivitas selama 60 detik dan tidak ada kolom isian yang sedang difokus.
 *
 * Hanya aktif pada build produksi.
 */

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // cek versi baru setiap 5 menit
const FIRST_CHECK_DELAY_MS = 60 * 1000; // cek pertama setelah 1 menit
const IDLE_BEFORE_RELOAD_MS = 60 * 1000; // tunggu 1 menit tanpa aktivitas
const RELOAD_POLL_MS = 10 * 1000; // periksa kesempatan muat ulang tiap 10 detik

const ASSET_PATTERN = /(?:src|href)="(\/assets\/[^"]+)"/g;

function currentAssets(): string {
  const found: string[] = [];
  document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[href]').forEach(el => {
    const url = el.getAttribute('src') || el.getAttribute('href') || '';
    if (url.includes('/assets/')) found.push(url);
  });
  return found.sort().join('|');
}

function assetsFromHtml(html: string): string {
  const found: string[] = [];
  for (const match of html.matchAll(ASSET_PATTERN)) found.push(match[1]);
  return found.sort().join('|');
}

function isTypingNow(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function startAutoRefresh(): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const loadedAssets = currentAssets();
  if (!loadedAssets) return;

  let updateAvailable = false;
  let lastActivity = Date.now();

  const markActivity = () => {
    lastActivity = Date.now();
  };
  ['pointerdown', 'keydown', 'input', 'scroll', 'touchstart'].forEach(name =>
    window.addEventListener(name, markActivity, { passive: true, capture: true })
  );

  const checkForNewVersion = async () => {
    if (updateAvailable || document.hidden) return;
    try {
      const response = await fetch(`/?atlax_version_check=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const html = await response.text();
      const latestAssets = assetsFromHtml(html);
      if (latestAssets && latestAssets !== loadedAssets) {
        updateAvailable = true;
      }
    } catch {
      // Offline atau gagal dimuat: coba lagi pada pengecekan berikutnya.
    }
  };

  const reloadIfSafe = () => {
    if (!updateAvailable) return;
    const idle = Date.now() - lastActivity > IDLE_BEFORE_RELOAD_MS;
    if (document.hidden || (idle && !isTypingNow())) {
      window.location.reload();
    }
  };

  window.setTimeout(() => {
    void checkForNewVersion();
    window.setInterval(() => void checkForNewVersion(), CHECK_INTERVAL_MS);
  }, FIRST_CHECK_DELAY_MS);

  window.setInterval(reloadIfSafe, RELOAD_POLL_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      reloadIfSafe();
    } else {
      void checkForNewVersion();
    }
  });
}
