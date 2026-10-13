"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ArrowUpRight,
  CalendarBlank,
  CheckCircle,
  Clock,
  DownloadSimple,
  DotsThree,
  FileText,
  Image as ImageIcon,
  MapPin,
  Plus,
  SlidersHorizontal,
  Wallet,
  Users,
  TrendUp,
  WarningCircle,
  EnvelopeSimple,
  ArrowClockwise,
  Sun,
  Moon,
  Planet,
  ShieldCheck,
  Buildings,
} from "@phosphor-icons/react";
import type { ColDef } from "ag-grid-community";
import type { Client, Loan, Panel } from "@/domain/types";
import { useDemo, useVisible } from "@/providers/demo";
import { can } from "@/domain/commands";
import {
  money,
  moneyValue,
  metrics,
  remaining,
  principalLeft,
  loanLeft,
  overdue,
  condition,
  dateLabel,
  currentInstallments,
  addDays,
  promiseStatus,
} from "@/domain/finance";
import { reportData, type ReportKind } from "@/lib/reports";
import { downloadCsv, downloadPdf } from "@/lib/export";
import { DataGrid } from "./grid";
import {
  AddButton,
  ActionLink,
  Avatar,
  Badge,
  Button,
  Empty,
  IconButton,
  PageHeader,
  Person,
  SearchInput,
  SectionTitle,
  Tabs,
  Field,
} from "./ui";
const CashChart = dynamic(() => import("./charts").then((m) => m.CashChart), {
  ssr: false,
  loading: () => <div className="chart skeleton" />,
});
const CollectionCalendar = dynamic(
  () => import("./calendar").then((m) => m.CollectionCalendar),
  { ssr: false, loading: () => <div className="calendar-loading skeleton" /> },
);
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
type Filters = { status: string; owner: string; district: string };
const initialFilters: Filters = {
  status: "Todos",
  owner: "Todos",
  district: "Todos",
};
function TableToolbar({
  query,
  setQuery,
  onFilter,
  onExport,
  count,
  placeholder = "Buscar por nombre, DNI o teléfono...",
}: {
  query: string;
  setQuery: (s: string) => void;
  onFilter: () => void;
  onExport: () => void;
  count: number;
  placeholder?: string;
}) {
  return (
    <div className="table-toolbar">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={placeholder}
      />
      <div className="button-row">
        <span className="result-count">{count} resultados</span>
        <Button onClick={onFilter}>
          <SlidersHorizontal size={16} />
          Filtros
        </Button>
        <IconButton label="Exportar CSV" onClick={onExport}>
          <DownloadSimple size={18} />
        </IconButton>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  caption,
  icon,
  action,
}: {
  label: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
  action?: () => void;
}) {
  return (
    <button className="metric" onClick={action} disabled={!action}>
      <span className="metric-label">
        {label}
        <span className="metric-icon">{icon}</span>
      </span>
      <strong>{value}</strong>
      <span className="metric-caption">
        {caption}
        {action && <ArrowUpRight size={14} />}
      </span>
    </button>
  );
}
export function Dashboard() {
  const { state, open, role } = useDemo();
  const { loans, clients, activities } = useVisible();
  const totals = metrics(state, loans);
  const today = state.business.today;
  const rows = loans
    .filter((l) => l.status === "activo")
    .flatMap((l) =>
      currentInstallments(l)
        .filter((i) => remaining(i) > 0 && i.due <= addDays(today, 7))
        .map((i) => ({
          loan: l,
          inst: i,
          client: clients.find((c) => c.id === l.clientId)!,
        })),
    )
    .sort((a, b) => a.inst.due.localeCompare(b.inst.due))
    .slice(0, 5);
  const agenda = activities.filter(
    (a) => a.start.startsWith(today) && a.status === "pendiente",
  );
  return (
    <>
      <PageHeader
        eyebrow={dateLabel(today)}
        title="Tu cartera, en orden."
        description="Todo lo que necesitas para acompañar tus cobranzas de hoy."
        action={
          can(role, "write") ? (
            <AddButton onClick={() => open({ type: "payment" })}>
              Registrar pago
            </AddButton>
          ) : undefined
        }
      />
      <div className="metrics">
        <Metric
          label="Capital pendiente"
          value={money(totals.capital)}
          caption={`${totals.active} préstamos activos`}
          icon={<Wallet size={18} />}
          action={() =>
            open({ type: "report", data: { kind: "Cartera activa" } })
          }
        />
        <Metric
          label="Cobrado este mes"
          value={money(totals.net)}
          caption="Recaudación neta de octubre"
          icon={<TrendUp size={18} />}
          action={() => open({ type: "report", data: { kind: "Recaudación" } })}
        />
        <Metric
          label="Importe vencido"
          value={money(totals.overdue)}
          caption="Cuotas con saldo en atraso"
          icon={<Clock size={18} />}
          action={() => open({ type: "report", data: { kind: "Mora" } })}
        />
        <Metric
          label="Próximos 7 días"
          value={money(totals.upcoming)}
          caption={`${money(totals.due)} vence hoy`}
          icon={<CalendarBlank size={18} />}
          action={() =>
            open({
              type: "report",
              data: {
                kind: "Vencimientos",
                from: today,
                to: addDays(today, 7),
              },
            })
          }
        />
      </div>
      <div className="dashboard-grid">
        <section className="surface chart-card">
          <SectionTitle
            title="Así van tus cobranzas"
            sub="Recaudación neta diaria · octubre 2026"
            action={<Badge tone="neutral">Este mes</Badge>}
          />
          <CashChart />
          <div className="chart-bottom">
            <span>
              <span className="legend-dot" />
              Cobros netos
            </span>
            <ActionLink
              onClick={() =>
                open({ type: "report", data: { kind: "Recaudación" } })
              }
            >
              Ver reporte
            </ActionLink>
          </div>
        </section>
        <section className="surface agenda-card">
          <SectionTitle
            title="Tu agenda de hoy"
            sub={`${agenda.length} actividades pendientes`}
            action={
              <Link
                className="icon-button"
                href="/calendario/"
                aria-label="Abrir calendario"
              >
                <ArrowUpRight size={18} />
              </Link>
            }
          />
          {agenda.length ? (
            agenda.map((a) => (
              <button
                className="agenda-item"
                key={a.id}
                onClick={() => open({ type: "activity-detail", id: a.id })}
              >
                <span className="agenda-time">{a.start.slice(11, 16)}</span>
                <span className="agenda-marker" />
                <span>
                  <strong>{a.title}</strong>
                  <small>
                    {clients.find((c) => c.id === a.clientId)?.name}
                  </small>
                  <span className="agenda-owner">{a.owner}</span>
                </span>
                <ArrowRight size={16} />
              </button>
            ))
          ) : (
            <Empty
              title="El día está despejado"
              description="Agenda una visita o tarea para continuar."
            />
          )}
          <Button
            className="full-width"
            onClick={() => open({ type: "activity-new" })}
          >
            <Plus size={16} />
            Agendar actividad
          </Button>
        </section>
      </div>
      <section className="surface">
        <SectionTitle
          title="Cobranzas que necesitan atención"
          sub="Vencidas, de hoy y de los próximos días"
          action={
            <Link className="action-link" href="/cobranzas/">
              Ver todas
              <ArrowUpRight size={15} />
            </Link>
          }
        />
        <div className="simple-table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Préstamo</th>
                <th>Vencimiento</th>
                <th>Pendiente</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ loan, inst, client }) => (
                <tr key={inst.id}>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => open({ type: "client", id: client.id })}
                    >
                      <Person name={client.name} sub={client.district} />
                    </button>
                  </td>
                  <td>
                    <span className="mono">{loan.id}</span>
                    <small className="block">Cuota {inst.number}</small>
                  </td>
                  <td>{dateLabel(inst.due, true)}</td>
                  <td className="amount">{money(remaining(inst))}</td>
                  <td>
                    <Badge>
                      {inst.due < today
                        ? "Vencida"
                        : inst.due === today
                          ? "Vence hoy"
                          : "Próxima"}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="small"
                      onClick={() =>
                        open({
                          type: can(role, "write") ? "payment" : "installment",
                          loanId: loan.id,
                          installmentId: inst.id,
                        })
                      }
                    >
                      {can(role, "write") ? "Registrar pago" : "Ver detalle"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
      </section>
      <div className="quiet-note">
        <ShieldCheck size={16} />
        Información ficticia para explorar los flujos de cobranza.
      </div>
    </>
  );
}
export function ClientsScreen() {
  const { state, open, role } = useDemo();
  const { clients, loans } = useVisible();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [tab, setTab] = useState("Activos");
  const rows = clients
    .filter(
      (c) =>
        c.archived === (tab === "Archivados") &&
        norm(c.name + c.dni + c.phone + c.email).includes(norm(query)) &&
        (filters.owner === "Todos" || c.owner === filters.owner) &&
        (filters.district === "Todos" || c.district === filters.district),
    )
    .map((c) => {
      const active = loans.filter(
        (l) => l.clientId === c.id && l.status === "activo",
      );
      return {
        ...c,
        active: active.length,
        capital: moneyValue(active.reduce((s, l) => s + principalLeft(l), 0)),
        condition: active.some((l) => overdue(l, state.business.today) > 0)
          ? "En mora"
          : active.length
            ? "Al día"
            : "Sin deuda",
      };
    })
    .filter(
      (c) => filters.status === "Todos" || c.condition === filters.status,
    );
  const columns: ColDef<(typeof rows)[number]>[] = [
    {
      headerName: "Cliente",
      field: "name",
      minWidth: 230,
      flex: 2,
      cellRenderer: (p: { data: (typeof rows)[number] }) => (
        <Person name={p.data.name} sub={"DNI " + p.data.dni} />
      ),
    },
    { headerName: "Contacto", field: "phone", minWidth: 130 },
    { headerName: "Distrito", field: "district", minWidth: 120 },
    {
      headerName: "Capital pendiente",
      field: "capital",
      minWidth: 155,
      valueFormatter: (p) => money(p.value),
      cellClass: "amount",
    },
    {
      headerName: "Estado",
      field: "condition",
      minWidth: 120,
      cellRenderer: (p: { value: string }) => <Badge>{p.value}</Badge>,
    },
    { headerName: "Responsable", field: "owner", minWidth: 130 },
  ];
  return (
    <>
      <PageHeader
        title="Cada cliente, a un clic."
        description="Encuentra su información, préstamos e historial en un solo lugar."
        action={
          can(role, "write") ? (
            <AddButton onClick={() => open({ type: "client-new" })}>
              Nuevo cliente
            </AddButton>
          ) : undefined
        }
      />
      <div className="summary-strip">
        <span>
          <Users size={18} />
          <strong>{clients.filter((c) => !c.archived).length}</strong> clientes
          activos
        </span>
        <span>
          <WarningCircle size={18} />
          <strong>
            {rows.filter((c) => c.condition === "En mora").length}
          </strong>{" "}
          requieren seguimiento
        </span>
      </div>
      <section className="surface">
        <div className="section-padding">
          <Tabs
            values={["Activos", "Archivados"]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <TableToolbar
          query={query}
          setQuery={setQuery}
          count={rows.length}
          onFilter={() =>
            open({
              type: "filters",
              data: { mode: "clients", values: filters, apply: setFilters },
            })
          }
          onExport={() =>
            downloadCsv(
              "Clientes",
              [
                "Nombre",
                "DNI",
                "Teléfono",
                "Distrito",
                "Capital",
                "Responsable",
              ],
              rows.map((c) => [
                c.name,
                c.dni,
                c.phone,
                c.district,
                c.capital,
                c.owner,
              ]),
            )
          }
        />
        <DataGrid
          rows={rows}
          columns={columns}
          onRow={(c) => open({ type: "client", id: c.id })}
          emptyAction={
            can(role, "write") ? (
              <Button onClick={() => open({ type: "client-new" })}>
                Crear cliente
              </Button>
            ) : undefined
          }
        />
      </section>
    </>
  );
}
export function LoansScreen() {
  const { state, open, role } = useDemo();
  const { loans, clients } = useVisible();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const rows = loans
    .map((l) => ({
      ...l,
      name: clients.find((c) => c.id === l.clientId)?.name ?? "",
      capital: principalLeft(l),
      condition: condition(l, state.business.today),
      owner: clients.find((c) => c.id === l.clientId)?.owner ?? "",
    }))
    .filter(
      (l) =>
        norm(l.name + l.id).includes(norm(query)) &&
        (filters.status === "Todos" || l.condition === filters.status) &&
        (filters.owner === "Todos" || l.owner === filters.owner),
    );
  const columns: ColDef<(typeof rows)[number]>[] = [
    {
      headerName: "Préstamo",
      field: "id",
      minWidth: 145,
      cellRenderer: (p: { data: (typeof rows)[number] }) => (
        <span>
          <strong className="mono">{p.data.id}</strong>
          <small className="block">{p.data.count} cuotas mensuales</small>
        </span>
      ),
    },
    {
      headerName: "Cliente",
      field: "name",
      minWidth: 205,
      flex: 2,
      cellRenderer: (p: { value: string }) => <Person name={p.value} />,
    },
    {
      headerName: "Capital original",
      field: "principal",
      minWidth: 145,
      valueFormatter: (p) => money(p.value),
    },
    {
      headerName: "Pendiente",
      field: "capital",
      valueFormatter: (p) => money(p.value),
      cellClass: "amount",
    },
    {
      headerName: "Tasa",
      field: "tea",
      minWidth: 95,
      valueFormatter: (p) =>
        p.value + "% " + (p.data?.method === "simple" ? "simple" : "TEA"),
    },
    {
      headerName: "Estado",
      field: "condition",
      cellRenderer: (p: { value: string }) => <Badge>{p.value}</Badge>,
    },
  ];
  return (
    <>
      <PageHeader
        title="Préstamos con claridad."
        description="Condiciones, cronogramas y saldos que puedes seguir paso a paso."
        action={
          can(role, "write") ? (
            <AddButton onClick={() => open({ type: "loan-new" })}>
              Nuevo préstamo
            </AddButton>
          ) : undefined
        }
      />
      <div className="summary-strip">
        <span>
          <Wallet size={18} />
          <strong>
            {loans.filter((l) => l.status === "activo").length}
          </strong>{" "}
          activos
        </span>
        <span>
          <FileText size={18} />
          <strong>
            {loans.filter((l) => l.status === "borrador").length}
          </strong>{" "}
          borradores
        </span>
        <span>
          <CheckCircle size={18} />
          <strong>
            {loans.filter((l) => l.status === "aprobado").length}
          </strong>{" "}
          por desembolsar
        </span>
      </div>
      <section className="surface">
        <TableToolbar
          query={query}
          setQuery={setQuery}
          placeholder="Buscar cliente o código de préstamo..."
          count={rows.length}
          onFilter={() =>
            open({
              type: "filters",
              data: { mode: "loans", values: filters, apply: setFilters },
            })
          }
          onExport={() =>
            downloadCsv(
              "Préstamos",
              ["Código", "Cliente", "Capital", "Pendiente", "Tasa", "Estado"],
              rows.map((l) => [
                l.id,
                l.name,
                l.principal,
                l.capital,
                l.tea,
                l.condition,
              ]),
            )
          }
        />
        <DataGrid
          rows={rows}
          columns={columns}
          onRow={(l) => open({ type: "loan", id: l.id })}
        />
      </section>
    </>
  );
}
export function CollectionsScreen() {
  const { state, open, role } = useDemo();
  const { loans, clients, payments } = useVisible();
  const [tab, setTab] = useState("Vencidas");
  const [query, setQuery] = useState("");
  const today = state.business.today;
  const [owner, setOwner] = useState("Todos");
  const rows = loans
    .filter(
      (l) =>
        l.status === "activo" &&
        (owner === "Todos" ||
          clients.find((c) => c.id === l.clientId)?.owner === owner),
    )
    .flatMap((l) =>
      currentInstallments(l)
        .filter(
          (i) =>
            remaining(i) > 0 &&
            (tab === "Hoy"
              ? i.due === today
              : tab === "Próximas"
                ? i.due > today && i.due <= addDays(today, 30)
                : i.due < today),
        )
        .map((i) => ({
          id: i.id,
          loanId: l.id,
          clientId: l.clientId,
          name: clients.find((c) => c.id === l.clientId)?.name ?? "",
          due: i.due,
          number: i.number,
          amount: remaining(i),
          condition:
            i.due < today
              ? "Vencida"
              : i.due === today
                ? "Vence hoy"
                : "Próxima",
        })),
    )
    .filter((r) => norm(r.name + r.loanId).includes(norm(query)));
  const columns: ColDef<(typeof rows)[number]>[] = [
    {
      headerName: "Cliente",
      field: "name",
      minWidth: 220,
      flex: 2,
      cellRenderer: (p: { value: string }) => <Person name={p.value} />,
    },
    { headerName: "Préstamo", field: "loanId", minWidth: 140 },
    { headerName: "Cuota", field: "number", minWidth: 85 },
    {
      headerName: "Vencimiento",
      field: "due",
      minWidth: 145,
      valueFormatter: (p) => dateLabel(p.value, true),
    },
    {
      headerName: "Pendiente",
      field: "amount",
      valueFormatter: (p) => money(p.value),
      cellClass: "amount",
    },
    {
      headerName: "Estado",
      field: "condition",
      cellRenderer: (p: { value: string }) => <Badge>{p.value}</Badge>,
    },
    {
      headerName: "",
      minWidth: 130,
      sortable: false,
      cellRenderer: (p: { data: (typeof rows)[number] }) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Button
            variant="small"
            onClick={() =>
              open({
                type: can(role, "write") ? "payment" : "installment",
                loanId: p.data.loanId,
                installmentId: p.data.id,
              })
            }
          >
            {can(role, "write") ? "Registrar pago" : "Detalle"}
          </Button>
        </span>
      ),
    },
  ];
  const payRows = payments.filter(
    (p) =>
      (owner === "Todos" ||
        clients.find(
          (c) => c.id === loans.find((l) => l.id === p.loanId)?.clientId,
        )?.owner === owner) &&
      norm(
        p.id +
          (clients.find(
            (c) => c.id === loans.find((l) => l.id === p.loanId)?.clientId,
          )?.name ?? ""),
      ).includes(norm(query)),
  );
  const payColumns: ColDef<(typeof payRows)[number]>[] = [
    { headerName: "Comprobante", field: "id", minWidth: 170 },
    { headerName: "Préstamo", field: "loanId" },
    {
      headerName: "Fecha",
      field: "date",
      valueFormatter: (p) => dateLabel(p.value, true),
    },
    {
      headerName: "Importe",
      field: "amount",
      valueFormatter: (p) => money(p.value),
      cellClass: "amount",
    },
    { headerName: "Método", field: "method" },
    {
      headerName: "Estado",
      field: "reversed",
      cellRenderer: (p: { value: boolean }) => (
        <Badge tone={p.value ? "neutral" : "success"}>
          {p.value ? "Reversado" : "Registrado"}
        </Badge>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Un paso más cerca de cobrar."
        description="Prioriza vencimientos, registra abonos y acompaña cada compromiso."
        action={
          can(role, "write") ? (
            <AddButton onClick={() => open({ type: "payment" })}>
              Registrar pago
            </AddButton>
          ) : undefined
        }
      />
      <section className="surface">
        <div className="section-padding">
          <Tabs
            values={["Hoy", "Próximas", "Vencidas", "Pagos registrados"]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="table-toolbar">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar cliente, préstamo o comprobante..."
          />
          <div className="button-row">
            <select
              aria-label="Filtrar por responsable"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              <option>Todos</option>
              {state.users
                .filter((u) => u.active)
                .map((u) => (
                  <option key={u.id}>{u.name}</option>
                ))}
            </select>
            <IconButton
              label="Exportar cobranzas"
              onClick={() =>
                downloadCsv(
                  "Cobranzas",
                  tab === "Pagos registrados"
                    ? ["Pago", "Préstamo", "Fecha", "Importe", "Estado"]
                    : [
                        "Cliente",
                        "Préstamo",
                        "Cuota",
                        "Vencimiento",
                        "Pendiente",
                      ],
                  tab === "Pagos registrados"
                    ? payRows.map((p) => [
                        p.id,
                        p.loanId,
                        p.date,
                        p.amount,
                        p.reversed ? "Reversado" : "Registrado",
                      ])
                    : rows.map((r) => [
                        r.name,
                        r.loanId,
                        r.number,
                        r.due,
                        r.amount,
                      ]),
                )
              }
            >
              <DownloadSimple size={18} />
            </IconButton>
          </div>
        </div>
        {tab === "Pagos registrados" ? (
          <DataGrid
            rows={payRows}
            columns={payColumns}
            onRow={(p) => open({ type: "receipt", id: p.id })}
          />
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            onRow={(r) =>
              open({
                type: "installment",
                loanId: r.loanId,
                installmentId: r.id,
              })
            }
          />
        )}
      </section>
    </>
  );
}
export function CalendarScreen() {
  const { open, state, role } = useDemo();
  const { clients } = useVisible();
  const [filter, setFilter] = useState("Todos");
  const [owner, setOwner] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [clientId, setClientId] = useState("");
  return (
    <>
      <PageHeader
        title="Cada fecha tiene su lugar."
        description="Cuotas, visitas y compromisos conectados con tu cartera."
        action={
          can(role, "write") ? (
            <AddButton onClick={() => open({ type: "activity-new" })}>
              Nueva actividad
            </AddButton>
          ) : undefined
        }
      />
      <div className="calendar-filters">
        <div className="button-row">
          <select
            aria-label="Tipo de evento"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["Todos", "Cuotas", "Visitas", "Promesas", "Tareas"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            aria-label="Responsable del calendario"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option>Todos</option>
            {state.users
              .filter((u) => u.active)
              .map((u) => (
                <option key={u.id}>{u.name}</option>
              ))}
          </select>
          <select
            aria-label="Estado del calendario"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Todos</option>
            <option>Pendientes</option>
            <option>Completados</option>
          </select>
          <select
            aria-label="Cliente del calendario"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Toda la cartera</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="calendar-legend">
          <span>
            <i className="legend-dot" />
            Cuota
          </span>
          <span>
            <i className="legend-dot danger" />
            Vencida
          </span>
          <span>
            <i className="legend-dot blue" />
            Visita
          </span>
          <span>
            <i className="legend-dot gold" />
            Promesa
          </span>
        </div>
      </div>
      <CollectionCalendar
        filter={filter}
        owner={owner}
        status={status}
        clientId={clientId}
      />
    </>
  );
}
export function DocumentsScreen() {
  const { open, role } = useDemo();
  const { documents, clients } = useVisible();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [view, setView] = useState("Galería");
  const rows = documents.filter(
    (d) =>
      norm(
        d.name + (clients.find((c) => c.id === d.clientId)?.name ?? ""),
      ).includes(norm(query)) &&
      (category === "Todos" || d.category === category),
  );
  return (
    <>
      <PageHeader
        title="Todo su expediente, a mano."
        description="Fotos, contratos y comprobantes organizados por cliente."
        action={
          can(role, "write") ? (
            <AddButton onClick={() => open({ type: "document-new" })}>
              Cargar documento
            </AddButton>
          ) : undefined
        }
      />
      <div className="document-toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar archivo o cliente..."
        />
        <div className="button-row">
          <select
            value={category}
            aria-label="Categoría de documento"
            onChange={(e) => setCategory(e.target.value)}
          >
            {[
              "Todos",
              "Foto de casa",
              "Contrato",
              "DNI",
              "Comprobante",
              "Otro",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <Tabs values={["Galería", "Lista"]} value={view} onChange={setView} />
        </div>
      </div>
      {!rows.length ? (
        <Empty
          action={
            can(role, "write") ? (
              <Button onClick={() => open({ type: "document-new" })}>
                Cargar documento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={view === "Galería" ? "document-grid" : "document-list"}>
          {rows.map((d) => (
            <button
              key={d.id}
              className="document-card"
              onClick={() => open({ type: "document", id: d.id })}
            >
              <div className="document-thumb">
                {d.asset ? (
                  <img src={d.asset} alt={d.name} />
                ) : d.mime.startsWith("image") ? (
                  <ImageIcon size={40} />
                ) : (
                  <FileText size={40} />
                )}
                <span className="document-kind">{d.category}</span>
              </div>
              <div className="document-caption">
                <strong>{d.name}</strong>
                <small>{clients.find((c) => c.id === d.clientId)?.name}</small>
                <span>
                  {dateLabel(d.created, true)}
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="quiet-note">
        <ShieldCheck size={16} />
        Los archivos cargados se guardan en este navegador, dentro de la
        presentación.
      </div>
    </>
  );
}
export function ReportsScreen() {
  const { state, open, role, notice } = useDemo();
  const { loans, clients } = useVisible();
  const [kind, setKind] = useState<ReportKind>("Cartera activa");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState(state.business.today);
  const [clientId, setClientId] = useState("");
  const data = reportData(state, loans, kind, from, to, clientId);
  const totals = metrics(
    state,
    loans.filter((l) => !clientId || l.clientId === clientId),
  );
  const valid = from <= to;
  const download = async (format: string) => {
    if (!valid) {
      notice("La fecha inicial debe ser anterior a la fecha final.");
      return;
    }
    try {
      if (format === "csv") downloadCsv(kind, data.headers, data.rows);
      else
        await downloadPdf(
          kind,
          data.headers,
          data.rows,
          `Saldos al ${state.business.today} · Período ${from} a ${to}`,
        );
    } catch {
      notice("No se pudo generar el archivo. Puedes volver a intentarlo.");
    }
  };
  return (
    <>
      <PageHeader
        title="Una vista más completa."
        description="Entiende tu cartera y prepara el reporte que necesita tu equipo."
        action={
          <Button
            onClick={() =>
              open({ type: "report", data: { kind, from, to, clientId } })
            }
          >
            <FileText size={17} />
            Vista previa
          </Button>
        }
      />
      <div className="reports-tabs">
        <Tabs
          values={[
            "Cartera activa",
            "Mora",
            "Vencimientos",
            "Recaudación",
            "Estado de cuenta",
          ]}
          value={kind}
          onChange={(s) => setKind(s as ReportKind)}
        />
      </div>
      <div className="report-filters">
        <Field label="Desde">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label="Hasta">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
        <Field label="Cliente">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Toda la cartera</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="button-row">
          <Button onClick={() => download("csv")} disabled={!valid}>
            <DownloadSimple size={16} />
            CSV
          </Button>
          <Button onClick={() => download("pdf")} disabled={!valid}>
            <DownloadSimple size={16} />
            PDF
          </Button>
        </div>
      </div>
      <div className="summary-strip">
        <span>
          Capital pendiente <strong>{money(totals.capital)}</strong>
        </span>
        <span>
          Vencido <strong>{money(totals.overdue)}</strong>
        </span>
        <span>
          Cobrado en octubre <strong>{money(totals.net)}</strong>
        </span>
      </div>
      <section className="surface">
        {kind === "Mora" && (
          <>
            <SectionTitle
              title="Antigüedad de la deuda"
              sub="Saldo vencido al corte de la presentación"
            />
            <CashChart mode="mora" />
          </>
        )}
        <SectionTitle
          title={kind}
          sub={`Saldos al ${dateLabel(state.business.today, true)} · ${data.rows.length} registros`}
          action={
            can(role, "manage") ? (
              <ActionLink
                onClick={() =>
                  open({
                    type: "mail-preview",
                    data: { rows: data.rows, headers: data.headers, kind },
                  })
                }
              >
                Preparar correo
              </ActionLink>
            ) : undefined
          }
        />
        {valid ? (
          <div className="simple-table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  {data.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.rows.length && <Empty />}
          </div>
        ) : (
          <Empty
            title="Revisa el período"
            description="La fecha de inicio debe ser anterior a la fecha final."
          />
        )}
      </section>
    </>
  );
}
export function RemindersScreen() {
  const { state, open, run, notice, role } = useDemo();
  const [tab, setTab] = useState("Reglas");
  const manage = can(role, "manage");
  return (
    <>
      <PageHeader
        title="Que ninguna fecha se pase."
        description="Organiza los avisos y el resumen de cobranza para el dueño."
        action={
          manage ? (
            <AddButton onClick={() => open({ type: "reminder-new" })}>
              Nueva regla
            </AddButton>
          ) : undefined
        }
      />
      <div className="soft-banner">
        <span className="soft-banner-icon">
          <EnvelopeSimple size={24} />
        </span>
        <div>
          <strong>Tu resumen, cuando lo necesitas</strong>
          <p>Vencimientos próximos, cuotas de hoy y cartera en mora.</p>
        </div>
        <Badge tone="neutral">Envíos simulados</Badge>
      </div>
      <Tabs values={["Reglas", "Historial"]} value={tab} onChange={setTab} />
      {tab === "Reglas" ? (
        <div className="reminder-list">
          {state.reminders.map((r) => (
            <section className="surface reminder-card" key={r.id}>
              <span className="reminder-icon">
                <Clock size={24} />
              </span>
              <div className="reminder-info">
                <h3>{r.name}</h3>
                <p>
                  {r.days === -1
                    ? "Cuotas en mora"
                    : r.days === 0
                      ? "Cuotas que vencen hoy"
                      : `${r.days} días antes del vencimiento`}{" "}
                  · {r.hour} · Lima
                </p>
                <small>{r.recipient}</small>
              </div>
              <Badge>{r.active ? "Activa" : "Pausada"}</Badge>
              <div className="button-row">
                <Button
                  onClick={() => open({ type: "mail-preview", id: r.id })}
                >
                  Vista previa
                </Button>
                {manage && (
                  <>
                    <IconButton
                      label={"Editar " + r.name}
                      onClick={() => open({ type: "reminder-edit", id: r.id })}
                    >
                      <SlidersHorizontal size={18} />
                    </IconButton>
                    <button
                      className={"switch " + (r.active ? "on" : "")}
                      aria-label={(r.active ? "Pausar " : "Activar ") + r.name}
                      aria-pressed={r.active}
                      onClick={() => {
                        try {
                          run({
                            type: "reminder.save",
                            reminder: { ...r, active: !r.active },
                          });
                          notice(r.active ? "Regla pausada." : "Regla activa.");
                        } catch (e) {
                          notice((e as Error).message);
                        }
                      }}
                    >
                      <span />
                    </button>
                  </>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="surface">
          <SectionTitle
            title="Historial de reportes"
            sub="El estado corresponde a la simulación del proveedor."
          />
          <div className="simple-table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Reporte</th>
                  <th>Destinatario</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Intentos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.mails.map((m) => (
                  <tr key={m.id}>
                    <td>{m.subject}</td>
                    <td>{m.recipient}</td>
                    <td>{dateLabel(m.date, true)}</td>
                    <td>
                      <Badge>
                        {m.status === "Aceptado"
                          ? "Aceptado por proveedor"
                          : m.status}
                      </Badge>
                    </td>
                    <td>{m.attempts}</td>
                    <td>
                      <Button
                        variant="small"
                        onClick={() => open({ type: "mail-detail", id: m.id })}
                      >
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!state.mails.length && <Empty />}
          </div>
        </section>
      )}
      <div className="quiet-note">
        <EnvelopeSimple size={16} />
        Esta presentación no envía correos reales.
      </div>
    </>
  );
}
export function SettingsScreen() {
  const { state, role, theme, setTheme, open } = useDemo();
  const [tab, setTab] = useState("Negocio");
  const manage = can(role, "manage");
  return (
    <>
      <PageHeader
        title="A tu manera."
        description="Configura tu equipo, las condiciones y tu espacio de trabajo."
      />
      <Tabs
        values={["Negocio", "Tasas", "Equipo", "Apariencia", "Presentación"]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Negocio" && (
        <section className="surface settings-card">
          <SectionTitle
            title="Datos del negocio"
            sub="Configuración de la presentación"
            action={
              role === "Dueño" ? (
                <Button onClick={() => open({ type: "business" })}>
                  Editar datos
                </Button>
              ) : undefined
            }
          />
          <div className="settings-info">
            <span>
              <small>Nombre</small>
              <strong>{state.business.name}</strong>
            </span>
            <span>
              <small>Correo del dueño</small>
              <strong>{state.business.email}</strong>
            </span>
            <span>
              <small>Moneda</small>
              <strong>Sol peruano · PEN</strong>
            </span>
            <span>
              <small>Zona horaria</small>
              <strong>America/Lima</strong>
            </span>
          </div>
          <div className="callout">
            <strong>Condiciones transparentes</strong>
            <p>
              Cuotas mensuales convencionales, tasas ficticias y mora monetaria
              desactivada. El atraso se muestra para organizar el seguimiento.
            </p>
          </div>
        </section>
      )}
      {tab === "Tasas" && (
        <section className="surface">
          <SectionTitle
            title="Reglas por monto"
            sub="Cambiar una tasa no modifica préstamos aprobados o activos."
            action={
              role === "Dueño" ? (
                <AddButton onClick={() => open({ type: "rate-new" })}>
                  Nueva regla
                </AddButton>
              ) : undefined
            }
          />
          <div className="simple-table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Regla</th>
                  <th>Capital desde</th>
                  <th>Hasta</th>
                  <th>TEA ficticia</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.rates.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{money(r.min)}</td>
                    <td>{money(r.max)}</td>
                    <td>{r.tea}%</td>
                    <td>
                      <Badge>{r.active ? "Activa" : "Pausada"}</Badge>
                    </td>
                    <td>
                      {role === "Dueño" && (
                        <Button
                          variant="small"
                          onClick={() => open({ type: "rate-edit", id: r.id })}
                        >
                          Editar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "Equipo" && (
        <section className="surface">
          <SectionTitle
            title="Tu equipo"
            sub="Usuarios y carteras de demostración"
            action={
              manage ? (
                <AddButton onClick={() => open({ type: "user-new" })}>
                  Nuevo usuario
                </AddButton>
              ) : undefined
            }
          />
          {state.users.map((u) => (
            <div className="team-row" key={u.id}>
              <Person name={u.name} sub={u.role} />
              <Badge>{u.active ? "Activo" : "Inactivo"}</Badge>
              <span>
                {state.clients.filter((c) => c.owner === u.name).length}{" "}
                clientes
              </span>
              {manage && (
                <Button
                  variant="small"
                  onClick={() => open({ type: "user-edit", id: u.id })}
                >
                  Editar
                </Button>
              )}
            </div>
          ))}
          {manage && (
            <div className="section-padding">
              <Button onClick={() => open({ type: "assign" })}>
                Asignar cartera
              </Button>
            </div>
          )}
        </section>
      )}
      {tab === "Apariencia" && (
        <section className="surface settings-card">
          <SectionTitle
            title="Tu espacio, tu tema"
            sub="Una misma experiencia en tres tonos."
          />
          <div className="theme-options">
            {(
              [
                { value: "light", name: "Blanco", icon: <Sun size={22} /> },
                { value: "dark", name: "Negro", icon: <Moon size={22} /> },
                { value: "navy", name: "Navi", icon: <Planet size={22} /> },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                className={`theme-card theme-preview-${t.value} ${theme === t.value ? "selected" : ""}`}
                onClick={() => setTheme(t.value)}
                aria-pressed={theme === t.value}
              >
                <span className="theme-mini">
                  <i />
                  <span>
                    <b />
                    <b />
                    <b />
                  </span>
                </span>
                <span>
                  {t.icon}
                  {t.name}
                  {theme === t.value && <CheckCircle size={18} />}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      {tab === "Presentación" && (
        <section className="surface settings-card">
          <SectionTitle
            title="Explora los ciclos completos"
            sub="Puedes restaurar los ejemplos cuando quieras."
          />
          <div className="settings-info">
            <span>
              <small>Fecha de negocio</small>
              <strong>{dateLabel(state.business.today)}</strong>
            </span>
            <span>
              <small>Escenario</small>
              <strong>{state.scenario}</strong>
            </span>
          </div>
          <div className="button-row">
            <Button onClick={() => open({ type: "reset" })}>
              <ArrowClockwise size={18} />
              Restaurar presentación
            </Button>
            <Button onClick={() => open({ type: "scenario" })}>
              Cambiar escenario
            </Button>
          </div>
          <div className="callout">
            <strong>Caso de control</strong>
            <p>
              Cliente Demo Uno tiene un préstamo de S/ 1,000.00 a tasa cero.
              Registra abonos de S/ 200, S/ 300 y S/ 500 para recorrer el pago
              parcial, cierre y reverso.
            </p>
            <Button onClick={() => open({ type: "client", id: "CLI-001" })}>
              Abrir caso de control
              <ArrowRight size={15} />
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
export const Screens = {
  inicio: Dashboard,
  clientes: ClientsScreen,
  prestamos: LoansScreen,
  cobranzas: CollectionsScreen,
  calendario: CalendarScreen,
  documentos: DocumentsScreen,
  reportes: ReportsScreen,
  recordatorios: RemindersScreen,
  configuracion: SettingsScreen,
};
