"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  House,
  Users,
  Wallet,
  HandCoins,
  CalendarBlank,
  Files,
  ChartLine,
  EnvelopeSimple,
  GearSix,
  MagnifyingGlass,
  Plus,
  Bell,
  Sun,
  Moon,
  Planet,
  SidebarSimple,
  ArrowUpRight,
  CaretDown,
  CheckCircle,
} from "@phosphor-icons/react";
import { useDemo } from "@/providers/demo";
import { can } from "@/domain/commands";
import type { Role } from "@/domain/types";
import { Screens } from "./screens";
import { PanelHost } from "./panels";
import { Avatar, IconButton } from "./ui";
const navigation = [
  { id: "inicio", label: "Inicio", icon: House },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "prestamos", label: "Préstamos", icon: Wallet },
  { id: "cobranzas", label: "Cobranzas", icon: HandCoins },
  { id: "calendario", label: "Calendario", icon: CalendarBlank },
  { id: "documentos", label: "Documentos", icon: Files },
  { id: "reportes", label: "Reportes", icon: ChartLine },
  { id: "recordatorios", label: "Recordatorios", icon: EnvelopeSimple },
  { id: "configuracion", label: "Configuración", icon: GearSix },
];
export function Application({ view }: { view: keyof typeof Screens }) {
  const { state, role, theme, setRole, setTheme, ready, open, toast } =
    useDemo();
  const [collapsed, setCollapsed] = useState(false);
  const [newMenu, setNewMenu] = useState(false);
  const Screen = Screens[view];
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open({ type: "search" });
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open]);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const clientId = q.get("cliente");
    const loanId = q.get("prestamo");
    if (ready && clientId) open({ type: "client", id: clientId });
    else if (ready && loanId) open({ type: "loan", id: loanId });
  }, [ready]);
  const display =
    role === "Cobrador"
      ? "Mateo Ruiz"
      : role === "Dueño"
        ? "Lucía Herrera"
        : role === "Jefe"
          ? "Sofía López"
          : "Perfil de consulta";
  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-symbol">m</span>
          <span className="brand-text">
            mavric<span>.</span>
            <small>COBRANZAS</small>
          </span>
          <IconButton
            label="Contraer o expandir menú"
            onClick={() => setCollapsed(!collapsed)}
          >
            <SidebarSimple size={20} />
          </IconButton>
        </div>
        <div className="workspace-label">
          <span className="workspace-dot" />
          <span>Mi espacio de trabajo</span>
        </div>
        <nav aria-label="Navegación principal">
          {navigation.map((item, index) => (
            <Link
              key={item.id}
              href={item.id === "inicio" ? "/" : `/${item.id}/`}
              className={`nav-item ${view === item.id ? "active" : ""} ${index === 6 ? "nav-separator" : ""}`}
              aria-current={view === item.id ? "page" : undefined}
              title={item.label}
            >
              <item.icon
                size={21}
                weight={view === item.id ? "duotone" : "regular"}
              />
              <span>{item.label}</span>
              {item.id === "cobranzas" && (
                <small className="nav-count">
                  {state.loans.filter((l) => l.status === "activo").length}
                </small>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-indicator">
            <span />
            Modo presentación
          </div>
          <div className="user-box">
            <Avatar name={display} />
            <div>
              <strong>{display}</strong>
              <select
                aria-label="Perfil de presentación"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {(["Dueño", "Jefe", "Cobrador", "Consulta"] as const).map(
                  (r) => (
                    <option key={r}>{r}</option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Mostrar menú"
              onClick={() => setCollapsed(!collapsed)}
            >
              <SidebarSimple size={21} />
            </button>
            <span>Mi espacio</span>
            <span>/</span>
            <strong>{navigation.find((n) => n.id === view)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="global-search"
              onClick={() => open({ type: "search" })}
            >
              <MagnifyingGlass size={17} />
              <span>Buscar en tu cartera...</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className="theme-switcher" aria-label="Tema de apariencia">
              <IconButton label="Tema blanco" onClick={() => setTheme("light")}>
                <Sun
                  size={17}
                  weight={theme === "light" ? "fill" : "regular"}
                />
              </IconButton>
              <IconButton label="Tema negro" onClick={() => setTheme("dark")}>
                <Moon
                  size={17}
                  weight={theme === "dark" ? "fill" : "regular"}
                />
              </IconButton>
              <IconButton label="Tema navi" onClick={() => setTheme("navy")}>
                <Planet
                  size={17}
                  weight={theme === "navy" ? "fill" : "regular"}
                />
              </IconButton>
            </div>
            <IconButton
              label="Notificaciones"
              onClick={() => open({ type: "notifications" })}
            >
              <Bell size={19} />
            </IconButton>
            {can(role, "write") && (
              <div className="new-menu">
                <button
                  className="button small"
                  aria-expanded={newMenu}
                  onClick={() => setNewMenu(!newMenu)}
                >
                  <Plus size={16} />
                  Nuevo
                  <CaretDown size={12} />
                </button>
                {newMenu && (
                  <>
                    <button
                      className="menu-dismiss"
                      aria-label="Cerrar menú nuevo"
                      onClick={() => setNewMenu(false)}
                    />
                    <div className="popover-menu">
                      {[
                        { label: "Cliente", type: "client-new", icon: Users },
                        { label: "Préstamo", type: "loan-new", icon: Wallet },
                        { label: "Pago", type: "payment", icon: HandCoins },
                        {
                          label: "Actividad",
                          type: "activity-new",
                          icon: CalendarBlank,
                        },
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => {
                            setNewMenu(false);
                            open({ type: item.type });
                          }}
                        >
                          <item.icon size={18} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="main-content">
          {ready ? (
            <Screen />
          ) : (
            <div className="loading-state">
              <span className="brand-symbol">m</span>
              <p>Preparando tu espacio...</p>
              <div className="skeleton" />
            </div>
          )}
          <footer className="app-footer">
            <span>Mavric · Tu cartera, en orden.</span>
            <span>Presentación · datos ficticios</span>
          </footer>
        </main>
      </div>
      <PanelHost />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
