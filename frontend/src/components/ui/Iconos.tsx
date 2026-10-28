import {
  ArrowDownTrayIcon,
  ArrowLeftEndOnRectangleIcon,
  ArrowLeftIcon,
  ArrowRightEndOnRectangleIcon,
  ArrowRightIcon,
  BanknotesIcon,
  Bars3Icon,
  BoltIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FireIcon,
  FolderOpenIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeModernIcon,
  IdentificationIcon,
  InboxIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  PlayIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  SunIcon,
  TagIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { SVGProps } from 'react'

/**
 * Set de iconos de la casa.
 *
 * Son envoltorios finos sobre **Heroicons** (outline, 24px, trazo 1.5 —
 * exactamente el aire editorial de imprenta de `design.md`), con nombres en
 * español para el dominio. Todos aceptan `className` y traen tamaño por
 * defecto, de modo que las vistas no cambian al migrar.
 */

type Props = SVGProps<SVGSVGElement>

/* --- Acceso y seguridad --- */
export function IconoSobre({ className = 'h-4 w-4', ...props }: Props) {
  return <EnvelopeIcon className={className} {...props} />
}
export function IconoCandado({ className = 'h-4 w-4', ...props }: Props) {
  return <LockClosedIcon className={className} {...props} />
}
export function IconoEscudo({ className = 'h-4 w-4', ...props }: Props) {
  return <ShieldCheckIcon className={className} {...props} />
}
export function IconoPuerta({ className = 'h-4 w-4', ...props }: Props) {
  return <ArrowRightEndOnRectangleIcon className={className} {...props} />
}
export function IconoSalir({ className = 'h-4 w-4', ...props }: Props) {
  return <ArrowLeftEndOnRectangleIcon className={className} {...props} />
}

/* --- Identidad y documentos --- */
export function IconoPasaporte({ className = 'h-4 w-4', ...props }: Props) {
  return <IdentificationIcon className={className} {...props} />
}
export function IconoPersona({ className = 'h-4 w-4', ...props }: Props) {
  return <UserIcon className={className} {...props} />
}
export function IconoDocumento({ className = 'h-4 w-4', ...props }: Props) {
  return <DocumentTextIcon className={className} {...props} />
}
export function IconoPortapapeles({ className = 'h-4 w-4', ...props }: Props) {
  return <ClipboardDocumentListIcon className={className} {...props} />
}
export function IconoCarpeta({ className = 'h-4 w-4', ...props }: Props) {
  return <FolderOpenIcon className={className} {...props} />
}
export function IconoSello({ className = 'h-4 w-4', ...props }: Props) {
  return <CheckBadgeIcon className={className} {...props} />
}

/* --- Geografía y navegación --- */
export function IconoGlobo({ className = 'h-4 w-4', ...props }: Props) {
  return <GlobeAltIcon className={className} {...props} />
}
export function IconoUbicacion({ className = 'h-4 w-4', ...props }: Props) {
  return <MapPinIcon className={className} {...props} />
}
export function IconoDestello({ className = 'h-4 w-4', ...props }: Props) {
  return <SparklesIcon className={className} {...props} />
}
export function IconoMaletin({ className = 'h-4 w-4', ...props }: Props) {
  return <BriefcaseIcon className={className} {...props} />
}
export function IconoEdificio({ className = 'h-4 w-4', ...props }: Props) {
  return <BuildingOffice2Icon className={className} {...props} />
}
export function IconoBuzon({ className = 'h-4 w-4', ...props }: Props) {
  return <InboxIcon className={className} {...props} />
}

/* --- Acciones --- */
export function IconoLupa({ className = 'h-4 w-4', ...props }: Props) {
  return <MagnifyingGlassIcon className={className} {...props} />
}
export function IconoLapiz({ className = 'h-4 w-4', ...props }: Props) {
  return <PencilSquareIcon className={className} {...props} />
}
export function IconoBasura({ className = 'h-4 w-4', ...props }: Props) {
  return <TrashIcon className={className} {...props} />
}
export function IconoMas({ className = 'h-4 w-4', ...props }: Props) {
  return <PlusIcon className={className} {...props} />
}
export function IconoCerrar({ className = 'h-4 w-4', ...props }: Props) {
  return <XMarkIcon className={className} {...props} />
}
export function IconoDescarga({ className = 'h-4 w-4', ...props }: Props) {
  return <ArrowDownTrayIcon className={className} {...props} />
}

/* --- Flechas y chevrons --- */
export function IconoFlechaIzquierda({ className = 'h-4 w-4', ...props }: Props) {
  return <ArrowLeftIcon className={className} {...props} />
}
export function IconoFlechaDerecha({ className = 'h-4 w-4', ...props }: Props) {
  return <ArrowRightIcon className={className} {...props} />
}
export function IconoChevron({ className = 'h-3 w-3', ...props }: Props) {
  return <ChevronDownIcon className={className} {...props} />
}
export function IconoChevronArriba({ className = 'h-3 w-3', ...props }: Props) {
  return <ChevronUpIcon className={className} {...props} />
}

/* --- Varios --- */
export function IconoMoneda({ className = 'h-4 w-4', ...props }: Props) {
  return <CurrencyDollarIcon className={className} {...props} />
}
export function IconoCorazon({ className = 'h-4 w-4', ...props }: Props) {
  return <HeartIcon className={className} {...props} />
}
export function IconoEtiqueta({ className = 'h-4 w-4', ...props }: Props) {
  return <TagIcon className={className} {...props} />
}
export function IconoCalendario({ className = 'h-4 w-4', ...props }: Props) {
  return <CalendarDaysIcon className={className} {...props} />
}
export function IconoTelefono({ className = 'h-4 w-4', ...props }: Props) {
  return <PhoneIcon className={className} {...props} />
}

/* --- Panel / navegación --- */
export function IconoModulos({ className = 'h-4 w-4', ...props }: Props) {
  return <Squares2X2Icon className={className} {...props} />
}
export function IconoMenu({ className = 'h-4 w-4', ...props }: Props) {
  return <Bars3Icon className={className} {...props} />
}

/* --- Catálogo editorial: carácter de viaje, regiones y ficha --- */
export function IconoLibro({ className = 'h-4 w-4', ...props }: Props) {
  return <BookOpenIcon className={className} {...props} />
}
export function IconoMapa({ className = 'h-4 w-4', ...props }: Props) {
  return <MapIcon className={className} {...props} />
}
export function IconoSol({ className = 'h-4 w-4', ...props }: Props) {
  return <SunIcon className={className} {...props} />
}
export function IconoRayo({ className = 'h-4 w-4', ...props }: Props) {
  return <BoltIcon className={className} {...props} />
}
export function IconoFuego({ className = 'h-4 w-4', ...props }: Props) {
  return <FireIcon className={className} {...props} />
}
export function IconoCasa({ className = 'h-4 w-4', ...props }: Props) {
  return <HomeModernIcon className={className} {...props} />
}
export function IconoReloj({ className = 'h-4 w-4', ...props }: Props) {
  return <ClockIcon className={className} {...props} />
}
export function IconoBillete({ className = 'h-4 w-4', ...props }: Props) {
  return <BanknotesIcon className={className} {...props} />
}
export function IconoGrupo({ className = 'h-4 w-4', ...props }: Props) {
  return <UserGroupIcon className={className} {...props} />
}
export function IconoPlay({ className = 'h-4 w-4', ...props }: Props) {
  return <PlayIcon className={className} {...props} />
}
