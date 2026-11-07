// Ekspor ke Excel tanpa dependensi tambahan: SpreadsheetML 2003 (.xls) yang dibuka Excel dengan benar.

export interface ExcelSheet {
  name: string;
  rows: (string | number)[][];
}

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cell = (value: string | number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `<Cell><Data ss:Type="Number">${value}</Data></Cell>`
    : `<Cell><Data ss:Type="String">${escapeXml(String(value ?? ''))}</Data></Cell>`;

export const buildExcelXml = (sheets: ExcelSheet[]) => {
  const body = sheets
    .map((sheet) => {
      const name = escapeXml(sheet.name.slice(0, 31) || 'Sheet');
      const rows = sheet.rows.map((row) => `<Row>${row.map(cell).join('')}</Row>`).join('');
      return `<Worksheet ss:Name="${name}"><Table>${rows}</Table></Worksheet>`;
    })
    .join('');
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${body}</Workbook>`;
};

export const downloadExcel = (fileName: string, sheets: ExcelSheet[]) => {
  const blob = new Blob([buildExcelXml(sheets)], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.xls') ? fileName : `${fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
