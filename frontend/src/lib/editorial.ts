export function precioDesde(valor: string | null, moneda: string): string | null {
  if (valor == null) return null
  const n = Number(valor)
  if (Number.isNaN(n)) return null
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: moneda || 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function eje(valor: number, positivo: string, negativo: string, espacio = true): string {
  const abs = Math.abs(valor)
  let grados = Math.floor(abs)
  let minutos = Math.round((abs - grados) * 60)
  if (minutos === 60) {
    grados += 1
    minutos = 0
  }
  return `${grados}°${String(minutos).padStart(2, '0')}′${espacio ? ' ' : ''}${
    valor >= 0 ? positivo : negativo
  }`
}

export function coordenadas(lat: string | null, lon: string | null): string | null {
  if (!lat || !lon) return null
  return `${eje(Number(lat), 'N', 'S')} · ${eje(Number(lon), 'E', 'W')}`
}

export function latitudCorta(lat: string | null): string | null {
  if (!lat) return null
  return eje(Number(lat), 'N', 'S', false)
}

export function longitudCorta(lon: string | null): string | null {
  if (!lon) return null
  return eje(Number(lon), 'E', 'W', false)
}

export const NOTA_MANO: Record<string, string> = {
  'machu-picchu-peru': 'Cumbres & niebla sagrada',
  'costa-amalfitana-italia': 'Acantilados & limoneros',
  'kioto-y-takayama-japon': 'Musgo, bambú & Monte Fuji',
  'salar-de-uyuni-bolivia': 'Sal & espejos de cielo',
  'tiwanaku-bolivia': 'Piedra & sol ancestral',
  'atlas-y-desierto-del-sahara-marruecos': 'Dunas & oasis rojos',
  'patagonia-austral-argentina': 'Hielos & viento sur',
  'valle-sagrado-de-los-incas-peru': 'Terrazas & río sagrado',
}

export const ETIQUETA_REGION: Record<string, string> = {
  america_del_sur: 'Andes y Sudamérica',
  europa: 'Europa Mediterránea',
  asia: 'Asia Oriental',
  africa: 'África',
  america_del_norte: 'Norteamérica',
  oceania: 'Oceanía',
}

export function etiquetaRegion(clave: string, display?: string | null): string {
  return ETIQUETA_REGION[clave] ?? display ?? clave.replace(/_/g, ' ')
}

const PAIS_DISPLAY: Record<string, string> = {
  BO: 'Bolivia',
  PE: 'Perú',
  AR: 'Argentina',
  IT: 'Italia',
  JP: 'Japón',
  MA: 'Marruecos',
  CL: 'Chile',
  BR: 'Brasil',
  EC: 'Ecuador',
  CO: 'Colombia',
  MX: 'México',
  ES: 'España',
  FR: 'Francia',
  PT: 'Portugal',
  GR: 'Grecia',
  TR: 'Turquía',
  EG: 'Egipto',
  KE: 'Kenia',
  TZ: 'Tanzania',
  ZA: 'Sudáfrica',
  IN: 'India',
  NP: 'Nepal',
  CN: 'China',
  TH: 'Tailandia',
  VN: 'Vietnam',
  ID: 'Indonesia',
  AU: 'Australia',
  NZ: 'Nueva Zelanda',
  US: 'Estados Unidos',
  CA: 'Canadá',
  CR: 'Costa Rica',
  CU: 'Cuba',
  IS: 'Islandia',
  NO: 'Noruega',
  SE: 'Suecia',
  FI: 'Finlandia',
  DK: 'Dinamarca',
  DE: 'Alemania',
  AT: 'Austria',
  CH: 'Suiza',
  NL: 'Países Bajos',
  BE: 'Bélgica',
  IE: 'Irlanda',
  GB: 'Reino Unido',
  CZ: 'República Checa',
  HU: 'Hungría',
  HR: 'Croacia',
  SI: 'Eslovenia',
  RO: 'Rumanía',
  BG: 'Bulgaria',
}

export function nombrePais(pais: string, codigo?: string | null): string {
  if (codigo) {
    const localizado = PAIS_DISPLAY[codigo.toUpperCase()]
    if (localizado) return localizado
  }
  return pais
}
