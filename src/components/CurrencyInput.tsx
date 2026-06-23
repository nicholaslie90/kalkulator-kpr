import React, { useLayoutEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

/**
 * Input nominal Rupiah ber-format ribuan (id-ID) yang MEMPERTAHANKAN posisi
 * kursor saat diedit di tengah-tengah angka. Tanpa ini, reformat pada setiap
 * ketikan akan melempar kursor ke paling belakang.
 *
 * Menampilkan string kosong saat nilai 0 agar placeholder tetap terlihat.
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onValueChange,
  className,
  style,
  placeholder,
  id,
  required,
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  // Pulihkan posisi kursor setelah React me-render ulang nilai yang sudah diformat.
  useLayoutEffect(() => {
    if (caretRef.current !== null && ref.current) {
      ref.current.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const selectionStart = e.target.selectionStart ?? raw.length;

    // Berapa banyak digit sebelum kursor (abaikan titik pemisah ribuan).
    const digitsBeforeCaret = raw.slice(0, selectionStart).replace(/\D/g, '').length;

    const numeric = Number(raw.replace(/\D/g, '')) || 0;

    // Hitung posisi kursor pada string hasil format, setelah jumlah digit yang sama.
    const formatted = numeric === 0 ? '' : numeric.toLocaleString('id-ID');
    let pos = 0;
    if (digitsBeforeCaret > 0) {
      let seen = 0;
      pos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) seen++;
        if (seen === digitsBeforeCaret) {
          pos = i + 1;
          break;
        }
      }
    }
    caretRef.current = pos;

    onValueChange(numeric);
  };

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="numeric"
      className={className}
      style={style}
      placeholder={placeholder}
      required={required}
      value={value === 0 ? '' : value.toLocaleString('id-ID')}
      onChange={handleChange}
    />
  );
};
