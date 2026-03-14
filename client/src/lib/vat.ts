export function normalizeVatRate(rate: string | null | undefined): string {
  if (!rate) return "23";
  const num = parseFloat(rate);
  if (num === 0) return "0";
  if (num === 6) return "6";
  if (num === 13) return "13";
  return "23";
}

export const VAT_RATES = [
  { value: "23", label: "23% - Taxa Normal" },
  { value: "13", label: "13% - Taxa Intermédia" },
  { value: "6", label: "6% - Taxa Reduzida" },
  { value: "0", label: "0% - Isento" },
];

export const VAT_EXEMPTION_REASONS = [
  { value: "M01", label: "M01 - Artigo 16.º, n.º 6 do CIVA" },
  { value: "M02", label: "M02 - Artigo 6.º do Decreto-Lei n.º 198/90" },
  { value: "M04", label: "M04 - Isento artigo 13.º do CIVA" },
  { value: "M05", label: "M05 - Isento artigo 14.º do CIVA" },
  { value: "M06", label: "M06 - Isento artigo 15.º do CIVA" },
  { value: "M07", label: "M07 - Isento artigo 9.º do CIVA" },
  { value: "M09", label: "M09 - IVA - não confere direito a dedução" },
  { value: "M10", label: "M10 - IVA - regime de isenção (Art. 53.º)" },
  { value: "M11", label: "M11 - Regime particular do tabaco" },
  { value: "M12", label: "M12 - Regime da margem de lucro - Agências de viagens" },
  { value: "M13", label: "M13 - Regime da margem de lucro - Bens em segunda mão" },
  { value: "M14", label: "M14 - Regime da margem de lucro - Objetos de arte" },
  { value: "M15", label: "M15 - Regime da margem de lucro - Objetos de coleção e antiguidades" },
  { value: "M16", label: "M16 - Isento artigo 14.º do RITI" },
  { value: "M19", label: "M19 - Outras isenções" },
  { value: "M20", label: "M20 - IVA - regime forfetário (Art. 59.º-D)" },
  { value: "M21", label: "M21 - IVA - não confere direito a dedução (ou similar)" },
  { value: "M25", label: "M25 - Mercadorias à consignação" },
  { value: "M30", label: "M30 - IVA - autoliquidação (Art. 2.º n.º 1 j)" },
  { value: "M31", label: "M31 - IVA - autoliquidação (Art. 2.º n.º 1 l)" },
  { value: "M32", label: "M32 - IVA - autoliquidação (Art. 2.º n.º 1 i)" },
  { value: "M33", label: "M33 - IVA - autoliquidação (Art. 2.º n.º 1 m)" },
  { value: "M40", label: "M40 - IVA - autoliquidação (Art. 6.º n.º 6 a)" },
  { value: "M41", label: "M41 - IVA - autoliquidação (Art. 8.º n.º 3)" },
  { value: "M42", label: "M42 - IVA - autoliquidação (Decreto-Lei n.º 21/2007)" },
  { value: "M43", label: "M43 - IVA - autoliquidação (Decreto-Lei n.º 362/99)" },
  { value: "M99", label: "M99 - Não sujeito; não tributado (ou similar)" },
];
