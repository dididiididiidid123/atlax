// Mencetak bagian yang ditandai class "print-area" lewat jendela tersembunyi (iframe) berisi salinannya.
// Setiap cetakan punya kop (nama aplikasi, judul, dan tanggal cetak) serta catatan kaki,
// dengan ukuran A4, margin seragam, dan kartu yang tidak terpotong antarhalaman.
// Jika tidak ada bagian yang ditandai, cetak halaman biasa.

const PRINT_THEME = `
  @page { size: A4; margin: 16mm 14mm 18mm 14mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  html { font-size: 12.5px !important; }
  html, body { background: #ffffff !important; color: #0f172a; margin: 0; padding: 0; font-family: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.5; }
  #root, #root * { filter: none !important; animation: none !important; transition: none !important; transform: none !important; }

  /* Kop dokumen */
  .pdf-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; border-bottom: 2px solid #3558e0; padding-bottom: 8px; margin-bottom: 14px; }
  .pdf-brand { font-family: Outfit, system-ui, sans-serif; font-weight: 800; font-size: 1.35rem; color: #0f172a; letter-spacing: -0.01em; }
  .pdf-title { font-size: 0.8rem; color: #334155; font-weight: 600; margin-top: 2px; }
  .pdf-meta { font-size: 0.7rem; color: #475569; text-align: right; }

  /* Kaki dokumen */
  .pdf-foot { margin-top: 16px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 0.68rem; color: #475569; display: flex; justify-content: space-between; gap: 12px; }

  /* Area cetak */
  .print-area { position: static !important; width: 100% !important; overflow: visible !important; }
  .print-area .print\\:hidden, .print-area button, .print-area summary, .print-area details > summary { display: none !important; }
  .print-area details { display: block !important; }
  .print-area details > *:not(summary) { display: block !important; }
  .print-area .card, .print-area .rounded-2xl, .print-area .rounded-3xl, .print-area .rounded-xl {
    border: 1px solid #cbd5e1 !important; box-shadow: none !important; background: #ffffff !important;
    border-radius: 8px !important; break-inside: avoid; page-break-inside: avoid; margin-bottom: 10px;
  }
  .print-area h1, .print-area h2, .print-area h3, .print-area h4 { break-after: avoid; page-break-after: avoid; color: #0f172a; font-family: Outfit, system-ui, sans-serif; }
  .print-area table { width: 100%; border-collapse: collapse; }
  .print-area thead { display: table-header-group; }
  .print-area tr, .print-area li { break-inside: avoid; page-break-inside: avoid; }
  .print-area th { background: #eef2ff !important; color: #1e293b; text-align: left; font-weight: 700; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.03em; }
  .print-area th, .print-area td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: top; }
  .print-area tbody tr:nth-child(even) td { background: #f8fafc; }
  .print-area .t-result { font-size: 1.6rem; line-height: 1.2; font-family: Outfit, system-ui, sans-serif; font-weight: 800; }
  .print-area .t-section { font-size: 1.05rem; font-family: Outfit, system-ui, sans-serif; font-weight: 700; }
  .print-area .t-card { font-size: 0.92rem; font-weight: 700; }
  .print-area .t-body, .print-area .t-label { font-size: 0.82rem; }
  .print-area .t-note, .print-area .t-kicker { font-size: 0.72rem; color: #475569; }
  .print-area .chip, .print-area .chip-ok, .print-area .chip-warn, .print-area .chip-bad, .print-area .chip-info, .print-area .chip-neutral {
    border: 1px solid #94a3b8 !important; padding: 1px 8px; font-size: 0.7rem;
  }
  .print-area img { max-height: 36px; }
`;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] ?? ch));

export function printArea(title = 'ATLAX'): void {
  const areas = Array.from(document.querySelectorAll<HTMLElement>('.print-area'));
  if (areas.length === 0) {
    window.print();
    return;
  }

  const content = areas
    .map((area) => {
      const clone = area.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.print\\:hidden').forEach((node) => node.remove());
      return clone.outerHTML;
    })
    .join('');

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('');

  const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  const head = `
    <header class="pdf-head">
      <div>
        <div class="pdf-brand">ATLAX</div>
        <div class="pdf-title">${escapeHtml(title)}</div>
      </div>
      <div class="pdf-meta">Dicetak: ${escapeHtml(printedAt)}</div>
    </header>`;
  const foot = `
    <footer class="pdf-foot">
      <span>Dokumen bantu dari ATLAX. Bukan dokumen resmi DJP. Cek lagi ke DJP Online atau Coretax sebelum lapor.</span>
      <span>ATLAX</span>
    </footer>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${styles}
<style>${PRINT_THEME}</style></head><body><main>${head}${content}${foot}</main></body></html>`);
  doc.close();

  // Beri waktu agar stylesheet dan font selesai dimuat sebelum dialog cetak dibuka.
  window.setTimeout(() => {
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    window.setTimeout(() => iframe.remove(), 1500);
  }, 500);
}
