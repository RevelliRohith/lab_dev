/**
 * CSV Export utility with RFC 4180 compliance and CSV Formula Injection Protection.
 * Any field starting with =, +, -, @, \t, or \r is prefixed with a single quote (')
 * to prevent spreadsheet software from interpreting user input as executable formulas.
 */

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Check if string starts with formula triggers
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // Escape inner double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function generateCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}
