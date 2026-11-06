/**
 * Utilidades editoriales compartidas por las pantallas públicas (CU3).
 *
 * Mantienen un mismo lenguaje de catálogo: precios en la moneda del destino,
 * coordenadas en grados y minutos, y las anotaciones manuscritas que acompañan
 * a cada lámina del atlas.
 */

/** Precio «desde» en la moneda del destino, con formato boliviano. */
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

/** Un eje geográfico en grados y minutos: `13°09′ S`. */
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

/** Coordenadas completas, como la leyenda de una carta náutica. */
export function coordenadas(lat: string | null, lon: string | null): string | null {
  if (!lat || !lon) return null
  return `${eje(Number(lat), 'N', 'S')} · ${eje(Number(lon), 'E', 'W')}`
}

/** Latitud compacta para sellos postales: `13°09′S`. */
export function latitudCorta(lat: string | null): string | null {
  if (!lat) return null
  return eje(Number(lat), 'N', 'S', false)
}

/** Longitud compacta para pies de lámina: `72°32′W`. */
export function longitudCorta(lon: string | null): string | null {
  if (!lon) return null
  return eje(Number(lon), 'E', 'W', false)
}

/**
 * Anotación manuscrita de cada lámina — copy editorial, no dato de negocio.
 * Se indexa por `slug` para sobrevivir a cambios de nombre.
 */
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

/** Etiqueta editorial de cada continente en las barras de filtro. */
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

/**
 * Nombre localizado del país a partir de su código ISO.
 *
 * La base guarda el nombre sin tildes («Peru», «Japon») porque es el valor de
 * negocio; la capa editorial lo presenta con su grafía correcta en español.
 */
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