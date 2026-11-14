import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

export function PublicLayout() {
  const { pathname, hash } = useLocation()

  const esHome = pathname === '/'

  useEffect(() => {
    if (hash) {
      const nodo = document.getElementById(hash.slice(1))
      if (nodo) {
        nodo.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className={esHome ? 'flex-1' : 'flex-1 pt-[80px]'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
