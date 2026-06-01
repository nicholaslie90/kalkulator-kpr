export const formatRupiah = (value: number): string => {
  if (isNaN(value)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const parseRupiah = (value: string): number => {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export const formatPercent = (value: number): string => {
  if (isNaN(value)) return '0%';
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const getMonthNameIndonesian = (monthIndex: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex] || '';
};

export const formatMonthYear = (dateStr: string, monthsToAdd: number = 0): string => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-').map(Number);
  
  // Date constructor takes 0-indexed month (0 = Jan, 1 = Feb, etc.)
  const date = new Date(year, month - 1 + monthsToAdd, 1);
  
  const m = getMonthNameIndonesian(date.getMonth());
  const y = date.getFullYear();
  
  return `${m} ${y}`;
};
