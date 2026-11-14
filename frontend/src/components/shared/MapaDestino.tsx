import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { IconoMapa } from '@/components/ui/Iconos'
import { coordenadas } from '@/lib/editorial'

interface MapaDestinoProps {
  latitud: string | number | null | undefined
  longitud: string | number | null | undefined
  nombre?: string | null
  className?: string
}

function numero(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

export function MapaDestino({
  latitud,
  longitud,
  nombre,
  className = '',
}: MapaDestinoProps) {
  const lat = numero(latitud)
  const lon = numero(longitud)
  const valido =
    lat !== null &&
    lon !== null &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180

  if (!valido) {
    return (
      <div
        className={`flex min-h-56 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-outline-variant/60 bg-surface p-6 text-center ${className}`}
      >
        <IconoMapa className="h-7 w-7 text-terracotta" />
        <p className="font-sans text-sm text-on-surface-variant">
          Registre una latitud y longitud válidas para previsualizar el mapa.
        </p>
        <p className="coord">OpenStreetMap · sin coordenadas</p>
      </div>
    )
  }

  const centro: [number, number] = [lat, lon]
  const etiqueta = coordenadas(String(lat), String(lon)) ?? `${lat}, ${lon}`

  return (
    <div
      className={`relative isolate z-0 overflow-hidden rounded-md border border-outline-variant/60 bg-surface ${className}`}
      aria-label={`Mapa de ${nombre || 'destino'}`}
    >
      <MapContainer
        key={`${lat},${lon}`}
        center={centro}
        zoom={6}
        scrollWheelZoom={false}
        className="h-64 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={centro}
          radius={9}
          pathOptions={{
            color: '#792609',
            weight: 2,
            fillColor: '#b85434',
            fillOpacity: 0.88,
          }}
        >
          <Popup>
            <strong>{nombre || 'Destino'}</strong>
            <br />
            {etiqueta}
          </Popup>
        </CircleMarker>
      </MapContainer>
      <div className="border-t border-outline-variant/50 bg-surface-container-lowest px-3 py-2">
        <span className="coord">{etiqueta}</span>
      </div>
    </div>
  )
}
