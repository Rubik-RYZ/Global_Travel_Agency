interface RosaVientosProps {
  className?: string
  /** Color de las puntas; por defecto hereda del texto. */
  tono?: string
}

/**
 * Rosa de los vientos de ocho puntas — sello de la agencia.
 *
 * Se dibuja en SVG para poder usarla nítida en cualquier tamaño (logotipo,
 * marcas de agua, sellos postales) sin depender de imágenes externas.
 */
export function RosaVientos({ className = 'h-8 w-8', tono = 'currentColor' }: RosaVientosProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Rosa de los vientos"
      className={className}
    >
      <polygon
        fill={tono}
        points="50,3 58,38 97,50 58,62 50,97 42,62 3,50 42,38"
      />
      <polygon
        fill={tono}
        opacity="0.65"
        points="50,15 55,42 85,50 55,58 50,85 45,58 15,50 45,42"
      />
      <circle cx="50" cy="50" r="3.6" fill="#faf5eb" />
      <circle cx="50" cy="50" r="1.5" fill={tono} />
    </svg>
  )
}
