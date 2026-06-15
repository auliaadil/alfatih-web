export function formatDate(dateStr: string, locale: string = 'id-ID'): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split(/[-T]/);
  if (!y || !m || !d) return dateStr;
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatMonthYear(dateStr: string, locale: string = 'id-ID'): string {
  if (!dateStr) return '';
  const [y, m] = dateStr.split(/[-T]/);
  if (!y || !m) return dateStr;
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
