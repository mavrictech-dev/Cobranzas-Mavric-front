"use client";
import {
  useEffect,
  useRef,
  useState,
  useId,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { animate } from "animejs";
import {
  ArrowLeft,
  X,
  WarningCircle,
  Plus,
  ArrowUpRight,
  MagnifyingGlass,
  FileDashed,
} from "@phosphor-icons/react";
import { useDemo } from "@/providers/demo";
export function Button({
  children,
  onClick,
  variant = "",
  disabled = false,
  type = "button",
  className = "",
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type={type}
      className={`button ${variant} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
export function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: string;
}) {
  const inferred =
    typeof children === "string"
      ? /mora|vencid|fallid|incumpl/i.test(children)
        ? "danger"
        : /pagad|día|liquidad|complet|aceptad|cumplid|confirmad/i.test(children)
          ? "success"
          : /hoy|parcial|pendiente|desconocido|aprobado/i.test(children)
            ? "warning"
            : "neutral"
      : "neutral";
  return <span className={`badge ${tone ?? inferred}`}>{children}</span>;
}
export function Avatar({ name, size = "" }: { name: string; size?: string }) {
  return (
    <span className={`avatar ${size}`}>
      {name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Person({ name, sub }: { name: string; sub?: string }) {
  return (
    <span className="person">
      <Avatar name={name} />
      <span>
        <strong>{name}</strong>
        {sub && <small>{sub}</small>}
      </span>
    </span>
  );
}
export function Field({
  label,
  children,
  hint,
  required = false,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{ id?: string; "aria-describedby"?: string }>,
        { id, "aria-describedby": hint ? id + "-hint" : undefined },
      )
    : children;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <em> *</em>}
      </label>
      {control}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
export function FormError({ message }: { message: string }) {
  return message ? (
    <div className="form-error" role="alert">
      <WarningCircle size={18} />
      {message}
    </div>
  ) : null;
}
export function Empty({
  title = "No hay resultados",
  description = "Prueba con otros filtros o registra un nuevo elemento.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <FileDashed size={38} weight="light" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <MagnifyingGlass size={17} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button aria-label="Limpiar búsqueda" onClick={() => onChange("")}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function PageHeader({
  eyebrow = "Tu cartera, en orden.",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Tabs({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {values.map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={s === value}
          className={s === value ? "active" : ""}
          onClick={() => onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
export function PanelFooter({ children }: { children: ReactNode }) {
  return <footer className="panel-footer">{children}</footer>;
}
export function SectionTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
export function ActionLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="action-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
export function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button variant="primary" onClick={onClick}>
      <Plus size={17} />
      {children}
    </Button>
  );
}
export function Drawer({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const { close, back, dirty, setDirty, panel } = useDemo();
  const ref = useRef<HTMLDialogElement>(null);
  const [discard, setDiscard] = useState(false);
  const requestClose = () => (dirty ? setDiscard(true) : close());
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      animate(el, {
        translateX: ["40px", "0px"],
        opacity: [0, 1],
        duration: 260,
        ease: "out(3)",
      });
    return () => {
      el.close();
    };
  }, []);
  useEffect(() => {
    setDiscard(false);
  }, [panel]);
  return (
    <dialog
      ref={ref}
      className={`drawer ${wide ? "wide" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <header className="drawer-header">
        <div className="drawer-heading">
          <IconButton
            label="Volver"
            onClick={() => (dirty ? setDiscard(true) : back())}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <IconButton label="Cerrar panel" onClick={requestClose}>
          <X size={20} />
        </IconButton>
      </header>
      {discard ? (
        <div className="drawer-content">
          <div className="callout">
            <h3>Hay cambios sin guardar</h3>
            <p>
              Puedes seguir editando o descartar los cambios de este formulario.
            </p>
          </div>
          <div className="button-row">
            <Button onClick={() => setDiscard(false)}>Seguir editando</Button>
            <Button
              variant="danger"
              onClick={() => {
                setDirty(false);
                close();
              }}
            >
              Descartar cambios
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="drawer-main"
          onChangeCapture={(e) => {
            if ((e.target as HTMLElement).closest("form")) setDirty(true);
          }}
        >
          {children}
        </div>
      )}
    </dialog>
  );
}
