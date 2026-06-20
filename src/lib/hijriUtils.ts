const HIJRI_MONTHS_ID = [
  'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
  'Jumadil Ula', 'Jumadil Akhir', 'Rajab', "Sya'ban",
  'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah',
];

export function toHijriMonthYear(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  try {
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return '';
    const fmt = new Intl.DateTimeFormat('en', {
      calendar: 'islamic-umalqura',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = fmt.formatToParts(date);
    const hijriMonth = Number(parts.find(p => p.type === 'month')?.value);
    const hijriYear = Number(parts.find(p => p.type === 'year')?.value);
    if (!hijriMonth || !hijriYear || hijriMonth < 1 || hijriMonth > 12) return '';
    return `${HIJRI_MONTHS_ID[hijriMonth - 1]} ${hijriYear} H`;
  } catch {
    return '';
  }
}
