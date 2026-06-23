// Ekspor data tabel ke CSV, Excel (.xls), atau PDF (via print) — tanpa dependensi eksternal.

type Cell = string | number;

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const sanitizeFilename = (name: string) =>
  name.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'export';

const escapeHtml = (v: Cell) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** CSV — angka mentah agar bisa dihitung ulang di spreadsheet. BOM agar Excel membaca UTF-8. */
export const downloadCsv = (filename: string, headers: string[], rows: Cell[][], meta: string[] = []) => {
  const esc = (v: Cell) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    ...meta.map(m => esc(m)),
    headers.map(esc).join(','),
    ...rows.map(r => r.map(esc).join(',')),
  ];
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
};

/** Excel — tabel HTML dengan ekstensi .xls (dibuka langsung oleh Excel). */
export const downloadExcel = (
  filename: string,
  title: string,
  meta: string[],
  headers: string[],
  rows: Cell[][],
) => {
  const metaHtml = meta.map(m => `<tr><td colspan="${headers.length}">${escapeHtml(m)}</td></tr>`).join('');
  const headHtml = `<tr>${headers.map(h => `<th style="background:#eef;border:1px solid #999;">${escapeHtml(h)}</th>`).join('')}</tr>`;
  const bodyHtml = rows
    .map(r => `<tr>${r.map(c => `<td style="border:1px solid #ccc;">${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('');
  const html =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">` +
    `<head><meta charset="utf-8"></head><body>` +
    `<table border="1"><tr><th colspan="${headers.length}" style="font-size:14px;text-align:left;">${escapeHtml(title)}</th></tr>` +
    `${metaHtml}${headHtml}${bodyHtml}</table></body></html>`;
  const blob = new Blob(['﻿' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, `${filename}.xls`);
};

/** PDF — buka jendela cetak terformat; pengguna memilih "Save as PDF". */
export const exportPdf = (title: string, meta: string[], headers: string[], rows: Cell[][]) => {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Mohon izinkan pop-up untuk mengekspor PDF.');
    return;
  }
  const metaHtml = meta.map(m => `<div class="meta">${escapeHtml(m)}</div>`).join('');
  const headHtml = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  const bodyHtml = rows
    .map(r => `<tr>${r.map((c, i) => `<td class="${i === 0 || i === 1 ? 'left' : 'right'}">${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Arial, sans-serif; color: #1e293b; padding: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { font-size: 11px; color: #475569; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 10px; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 6px; }
  th { background: #eef2ff; text-align: left; }
  td.right { text-align: right; white-space: nowrap; }
  td.left { text-align: left; white-space: nowrap; }
  tr:nth-child(even) td { background: #f8fafc; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>${escapeHtml(title)}</h1>
  ${metaHtml}
  <table><thead>${headHtml}</thead><tbody>${bodyHtml}</tbody></table>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
};
