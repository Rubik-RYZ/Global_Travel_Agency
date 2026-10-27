export function Footer() {
  return (
    <footer className="border-t border-parchment-border bg-secondary text-on-secondary">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg">Illimani Global Travel S.R.L.</p>
          <p className="nota-manuscrita text-gold">Viajes que cuentan historias</p>
        </div>
        <p className="font-sans text-xs uppercase tracking-wider text-on-secondary-container">
          © {new Date().getFullYear()} — UMSA Taller de Proyecto
        </p>
      </div>
    </footer>
  )
}
