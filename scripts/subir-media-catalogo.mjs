// =====================================================================
// Illimani Global Travel S.R.L. — utilidad de desarrollo (Fase 3b)
//
// Sube al almacén externo (Cloudinary) las láminas locales que usa el seed
// y escribe `backend/apps/catalogo/media_catalogo.json` con los enlaces.
//
// A partir de ahí el seed guarda URLs del almacén en `imagen_principal`, de
// modo que cualquiera que clone el repositorio ve las imágenes sin
// configurar credenciales (las URLs son públicas).
//
// Uso:  node scripts/subir-media-catalogo.mjs
// Requiere las credenciales CLOUDINARY_* del archivo `.env` de la raíz.
// =====================================================================
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SEED = join(RAIZ, 'backend', 'apps', 'usuarios', 'management', 'commands', 'seed_data.py')
const SALIDA = join(RAIZ, 'backend', 'apps', 'catalogo', 'media_catalogo.json')
const ORIGEN = join(RAIZ, 'frontend', 'public')

/** Carpeta por defecto dentro del almacén (debe coincidir con apps/almacen/constants.py). */
const CARPETA = 'illimani/destinos'

/**
 * Carpetas por familia de archivo: la Media Library queda ordenada por dominio
 * (una lámina de proveedor no debe caer en la carpeta de destinos).
 */
const CARPETAS_POR_PREFIJO = [
  { prefijo: 'proveedor-', carpeta: 'illimani/proveedores' },
  { prefijo: 'destino-', carpeta: 'illimani/destinos' },
]

function carpetaDe(archivo) {
  const nombre = archivo.split('/').pop() ?? ''
  const encontrada = CARPETAS_POR_PREFIJO.find((c) => nombre.startsWith(c.prefijo))
  return encontrada ? encontrada.carpeta : CARPETA
}

const TIPOS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

// ---------------------------------------------------------------------
// Entorno
// ---------------------------------------------------------------------
function leerEnv() {
  const ruta = join(RAIZ, '.env')
  if (!existsSync(ruta)) {
    throw new Error('No se encontró el archivo .env en la raíz del proyecto.')
  }
  const valores = {}
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const limpia = linea.trim()
    if (!limpia || limpia.startsWith('#')) continue
    const corte = limpia.indexOf('=')
    if (corte === -1) continue
    valores[limpia.slice(0, corte).trim()] = limpia.slice(corte + 1).trim()
  }
  return valores
}

function firmaCloudinary(params, apiSecret) {
  const cadena = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return createHash('sha1').update(cadena + apiSecret).digest('hex')
}

// ---------------------------------------------------------------------
// Qué subir: las láminas referenciadas por el seed
// ---------------------------------------------------------------------
function laminasDelSeed() {
  const fuente = readFileSync(SEED, 'utf8')
  const encontradas = new Set()
  for (const m of fuente.matchAll(/["'](\/assets\/[A-Za-z0-9._-]+)["']/g)) {
    encontradas.add(m[1])
  }
  return [...encontradas].sort()
}

async function subirUna({ archivo, cloudName, apiKey, apiSecret }) {
  const ruta = join(ORIGEN, archivo.replace(/^\//, ''))
  if (!existsSync(ruta)) {
    return { archivo, error: 'no existe en frontend/public' }
  }
  const extension = archivo.slice(archivo.lastIndexOf('.')).toLowerCase()
  const tipo = TIPOS[extension]
  if (!tipo) {
    return { archivo, error: `formato no soportado (${extension})` }
  }

  const bytes = readFileSync(ruta)
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = carpetaDe(archivo)
  const params = { folder, timestamp }
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: tipo }), archivo.split('/').pop())
  form.append('api_key', apiKey)
  form.append('folder', params.folder)
  form.append('timestamp', String(timestamp))
  form.append('signature', firmaCloudinary(params, apiSecret))

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: form },
  )
  const cuerpo = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    return { archivo, error: cuerpo?.error?.message || `HTTP ${respuesta.status}` }
  }
  return {
    archivo,
    url: cuerpo.secure_url,
    public_id: cuerpo.public_id,
    bytes: cuerpo.bytes,
    ancho: cuerpo.width,
    alto: cuerpo.height,
  }
}

// ---------------------------------------------------------------------
const env = leerEnv()
const cloudName = env.CLOUDINARY_CLOUD_NAME
const apiKey = env.CLOUDINARY_API_KEY
const apiSecret = env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    'Faltan credenciales. Complete CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y\n' +
      'CLOUDINARY_API_SECRET en el archivo .env de la raíz.',
  )
  process.exit(1)
}

const laminas = laminasDelSeed()
console.log(`Almacén: ${cloudName} · carpeta por defecto ${CARPETA}`)
console.log(`Láminas detectadas en el seed: ${laminas.length}\n`)

const catalogo = {}
let subidas = 0
for (const archivo of laminas) {
  const resultado = await subirUna({ archivo, cloudName, apiKey, apiSecret })
  if (resultado.error) {
    console.warn(`  ✗ ${archivo} — ${resultado.error}`)
    continue
  }
  catalogo[resultado.archivo] = {
    url: resultado.url,
    public_id: resultado.public_id,
    bytes: resultado.bytes,
    ancho: resultado.ancho,
    alto: resultado.alto,
  }
  subidas += 1
  console.log(`  ✓ ${archivo} → ${resultado.url}`)
}

if (subidas === 0) {
  console.error('\nNo se subió ninguna lámina. No se escribió el catálogo.')
  process.exit(1)
}

const previo = existsSync(SALIDA) ? JSON.parse(readFileSync(SALIDA, 'utf8')) : {}
const fusionado = { ...previo, ...catalogo }
writeFileSync(SALIDA, JSON.stringify(fusionado, null, 2) + '\n', 'utf8')

console.log(`\n${subidas} de ${laminas.length} láminas subidas.`)
console.log(`Catálogo escrito en ${SALIDA}`)
console.log('Ejecute `python manage.py seed_data` para refrescar los enlaces en la base.')
console.log('Nota: revise el diff antes de confirmar; los enlaces apuntan a SU cuenta.')
