import {
  CalendarDays,
  Home,
  Music2,
  Settings,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; mobile?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home, mobile: true },
  { href: "/eventos", label: "Eventos", icon: Ticket, mobile: true },
  { href: "/canciones", label: "Canciones", icon: Music2, mobile: true },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/equipo", label: "Equipo", icon: Users, mobile: true },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

/** Ítems extra que en móvil van dentro de "Más". */
export const MORE_ITEMS: NavItem[] = [
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
