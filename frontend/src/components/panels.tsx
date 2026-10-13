"use client";
import { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  DownloadSimple,
  EnvelopeSimple,
  FileText,
  MapPin,
  Paperclip,
  Plus,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import type {
  Client,
  Loan,
  Activity,
  Panel,
  Role,
  State,
  Doc,
} from "@/domain/types";
import { can, newId, type Command } from "@/domain/commands";
import {
  money,
  moneyValue,
  remaining,
  principalLeft,
  loanLeft,
  condition,
  overdue,
  dateLabel,
  currentInstallments,
  schedule,
  planPayment,
  addDays,
  addMonths,
  promiseStatus,
  cents,
} from "@/domain/finance";
import { useDemo, useVisible } from "@/providers/demo";
import { reportData, type ReportKind } from "@/lib/reports";
import {
  downloadCsv,
  downloadPdf,
  getFile,
  putFile,
  saveBlob,
} from "@/lib/export";
import {
  EditForm,
  type FormField,
  type Values,
  positive,
  requiredText,
} from "./forms";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Empty,
  Field,
  FormError,
  PanelFooter,
  Person,
  SectionTitle,
  Tabs,
} from "./ui";
const options = (items: string[]) => items.map((s) => ({ value: s, label: s }));
const descriptions: Record<string, [string, string]> = {
  "client-new": [
    "Nuevo cliente",
    "Un expediente para acompañar cada cobranza.",
  ],
  "client-edit": ["Editar cliente", "Actualiza sus datos de contacto."],
  client: ["Expediente del cliente", "Toda su información en un solo lugar."],
  "loan-new": ["Nuevo préstamo", "Cliente, condiciones y cronograma."],
  "loan-edit": ["Editar borrador", "Revisa las condiciones antes de aprobar."],
  loan: ["Detalle del préstamo", "Condiciones y saldo de la cartera."],
  "schedule-version": [
    "Cronograma anterior",
    "Versión conservada para consultar el historial.",
  ],
  payment: ["Registrar pago", "Revisa a qué cuotas se aplicará el abono."],
  receipt: [
    "Comprobante de pago",
    "Registro de presentación con datos ficticios.",
  ],
  installment: ["Detalle de cuota", "Vencimiento, saldo y próxima acción."],
  reschedule: [
    "Proponer reprogramación",
    "Conserva el historial y revisa antes y después.",
  ],
  prepay: [
    "Abonar a capital",
    "Simulación de cuotas mensuales convencionales.",
  ],
  liquidate: [
    "Liquidación anticipada",
    "Capital y conceptos exigibles al corte de la demo.",
  ],
  reverse: ["Reversar pago", "El pago original se conserva en el historial."],
  "activity-new": [
    "Nueva actividad",
    "Organiza la próxima acción de tu cartera.",
  ],
  "activity-edit": [
    "Editar actividad",
    "Revisa el horario antes de confirmar.",
  ],
  "activity-detail": [
    "Actividad de cobranza",
    "Visita, contacto o compromiso.",
  ],
  promise: ["Promesa de pago", "Un compromiso no cambia la fecha contractual."],
  contact: ["Registrar contacto", "Anota el resultado y el próximo paso."],
  "document-new": [
    "Cargar documento",
    "Los archivos se guardan en este navegador.",
  ],
  document: ["Documento del expediente", "Consulta el archivo y sus datos."],
  location: [
    "Ubicación del cliente",
    "Foto de referencia y punto confirmado manualmente.",
  ],
  report: [
    "Vista previa del reporte",
    "Mismos datos, filtros y fecha de corte.",
  ],
  "mail-preview": [
    "Reporte para el dueño",
    "Vista previa; no se enviará ningún correo real.",
  ],
  "mail-detail": ["Detalle del envío", "Resultado del proveedor simulado."],
  "reminder-new": ["Nueva regla", "Define cuándo preparar el reporte."],
  "reminder-edit": ["Editar regla", "Los cambios aplican a próximos reportes."],
  "rate-new": [
    "Nueva regla de tasa",
    "Condiciones ficticias para nuevas simulaciones.",
  ],
  "rate-edit": [
    "Editar regla de tasa",
    "Los contratos existentes conservan su tasa.",
  ],
  "user-new": ["Nuevo usuario", "Perfil de demostración."],
  "user-edit": ["Editar usuario", "Rol y disponibilidad del equipo."],
  assign: ["Asignar cartera", "Revisa responsables y actividades futuras."],
  business: ["Datos del negocio", "Configuración local de la presentación."],
  filters: ["Filtrar resultados", "Aplica criterios a la vista actual."],
  search: ["Buscar en tu cartera", "Cliente, DNI, teléfono o préstamo."],
  notifications: [
    "Tu atención, aquí",
    "Vencimientos y actividades que necesitan seguimiento.",
  ],
  confirm: ["Revisar operación", "Confirma el efecto antes de continuar."],
  reset: [
    "Restaurar presentación",
    "Los cambios ficticios se reemplazarán por el escenario inicial.",
  ],
  scenario: ["Cambiar escenario", "Explora resultados y estados de error."],
  credit: [
    "Saldo a favor",
    "Aplicar crédito o registrar una devolución realizada.",
  ],
};
export function PanelHost() {
  const { panel } = useDemo();
  if (!panel) return null;
  const desc = descriptions[panel.type] ?? ["Detalle", ""];
  const wide = [
    "client",
    "loan",
    "report",
    "reschedule",
    "mail-preview",
    "loan-new",
  ].includes(panel.type);
  return (
    <Drawer
      key={panel.type + "-" + (panel.id ?? panel.loanId ?? "new")}
      title={desc[0]}
      subtitle={desc[1]}
      wide={wide}
    >
      <PanelContent panel={panel} />
    </Drawer>
  );
}
function PanelContent({ panel: p }: { panel: Panel }) {
  switch (p.type) {
    case "client-new":
    case "client-edit":
      return <ClientForm panel={p} />;
    case "client":
      return <ClientDetail id={p.id!} />;
    case "loan-new":
    case "loan-edit":
      return <LoanForm panel={p} />;
    case "loan":
      return <LoanDetail id={p.id!} />;
    case "schedule-version":
      return <HistoricalSchedule panel={p} />;
    case "payment":
      return <PaymentForm panel={p} />;
    case "receipt":
      return <Receipt id={p.id!} />;
    case "installment":
      return <InstallmentDetail panel={p} />;
    case "activity-new":
    case "activity-edit":
    case "promise":
    case "contact":
      return <ActivityForm panel={p} />;
    case "activity-detail":
      return <ActivityDetail id={p.id!} />;
    case "reverse":
      return <ReverseForm id={p.id!} />;
    case "reschedule":
      return <AdjustmentForm id={p.loanId ?? p.id!} />;
    case "prepay":
    case "liquidate":
      return <FinancialAdjustment panel={p} />;
    case "document-new":
      return <DocumentForm panel={p} />;
    case "document":
      return <DocumentDetail id={p.id!} />;
    case "location":
      return <LocationForm id={p.clientId ?? p.id!} />;
    case "report":
      return <ReportPanel panel={p} />;
    case "mail-preview":
      return <MailPreview panel={p} />;
    case "mail-detail":
      return <MailDetail id={p.id!} />;
    case "credit":
      return <CreditForm panel={p} />;
    case "search":
      return <GlobalSearch />;
    case "notifications":
      return <Notifications />;
    case "filters":
      return <FilterForm panel={p} />;
    case "confirm":
      return <ConfirmPanel panel={p} />;
    case "reset":
    case "scenario":
      return <ResetPanel panel={p} />;
    default:
      return <ConfigurationForm panel={p} />;
  }
}
function ClientForm({ panel }: { panel: Panel }) {
  const { state, run, open, role } = useDemo();
  const existing = state.clients.find((c) => c.id === panel.id);
  const defaults = {
    name: existing?.name ?? "",
    dni: existing?.dni ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    address: existing?.address ?? "",
    district: existing?.district ?? "Miraflores",
    owner:
      existing?.owner ?? (role === "Cobrador" ? "Mateo Ruiz" : "Lucía Herrera"),
    reference: existing?.reference ?? "",
    tags: existing?.tags.join(", ") ?? "",
    notes: existing?.notes ?? "",
  };
  const fields: FormField[] = [
    { name: "name", label: "Nombres y apellidos", required: true, wide: true },
    {
      name: "dni",
      label: "DNI",
      required: true,
      hint: "8 dígitos · validación de formato",
    },
    { name: "phone", label: "Teléfono", type: "tel" },
    { name: "email", label: "Correo electrónico", type: "email", wide: true },
    { name: "address", label: "Dirección", wide: true },
    {
      name: "district",
      label: "Distrito",
      type: "select",
      options: options([
        "Miraflores",
        "San Isidro",
        "Surco",
        "San Borja",
        "La Molina",
        "Barranco",
        "Otro",
      ]),
    },
    {
      name: "owner",
      label: "Responsable",
      type: "select",
      options: options(
        role === "Cobrador"
          ? ["Mateo Ruiz"]
          : state.users.filter((u) => u.active).map((u) => u.name),
      ),
    },
    { name: "reference", label: "Referencia de la vivienda", wide: true },
    {
      name: "tags",
      label: "Etiquetas",
      hint: "Separadas por comas",
      wide: true,
    },
    { name: "notes", label: "Notas", type: "textarea", wide: true },
  ];
  const schema = yup.object({
    name: requiredText("nombre").min(3, "Escribe el nombre completo."),
    dni: yup
      .string()
      .matches(/^\d{8}$/, "El DNI debe tener 8 dígitos.")
      .required(),
    email: yup.string().email("Escribe un correo válido."),
    phone: yup
      .string()
      .test("contact", "Ingresa un teléfono o un correo.", function (value) {
        return Boolean(value || this.parent.email);
      }),
  });
  return (
    <EditForm
      defaults={defaults}
      fields={fields}
      schema={schema}
      label={existing ? "Guardar cambios" : "Guardar cliente"}
      extra={(v) => {
        const duplicate = state.clients.find(
          (c) => c.dni === v.dni && c.id !== existing?.id,
        );
        return duplicate ? (
          <div className="callout">
            <p>Ya existe un cliente con este DNI.</p>
            <Button onClick={() => open({ type: "client", id: duplicate.id })}>
              Ver cliente existente
            </Button>
          </div>
        ) : null;
      }}
      onSave={(v) => {
        const c: Client = {
          ...existing,
          id: existing?.id ?? newId("CLI"),
          name: v.name.trim(),
          dni: v.dni,
          phone: v.phone,
          email: v.email,
          address: v.address,
          district: v.district,
          owner: v.owner,
          reference: v.reference,
          tags: v.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          notes: v.notes,
          archived: existing?.archived ?? false,
          credit: existing?.credit ?? 0,
        };
        run({ type: "client.save", client: c });
        open({ type: "client", id: c.id });
      }}
    />
  );
}
function ClientDetail({ id }: { id: string }) {
  const { state, open, run, notice, role } = useDemo();
  const { clients, loans, payments, activities, documents } = useVisible();
  const c = clients.find((c) => c.id === id);
  const [tab, setTab] = useState("Resumen");
  if (!c)
    return (
      <Empty
        title="Cliente no disponible"
        description="No está en tu cartera o el escenario cambió."
      />
    );
  const owned = loans.filter((l) => l.clientId === id);
  const ids = new Set(owned.map((l) => l.id));
  const pay = payments.filter((p) => ids.has(p.loanId));
  const cap = owned
    .filter((l) => l.status === "activo")
    .reduce((s, l) => s + principalLeft(l), 0);
  const due = owned
    .filter((l) => l.status === "activo")
    .reduce((s, l) => s + overdue(l, state.business.today), 0);
  return (
    <>
      <div className="drawer-content">
        <div className="profile-heading">
          <Avatar name={c.name} size="large" />
          <div>
            <h2>{c.name}</h2>
            <p>
              DNI {c.dni} · {c.id}
            </p>
          </div>
          <Badge>
            {c.archived ? "Archivado" : due > 0 ? "En mora" : "Activo"}
          </Badge>
        </div>
        <div className="panel-metrics">
          <span>
            <small>Capital pendiente</small>
            <strong>{money(cap)}</strong>
          </span>
          <span>
            <small>Importe vencido</small>
            <strong>{money(due)}</strong>
          </span>
          <span>
            <small>Saldo a favor</small>
            <strong>{money(c.credit)}</strong>
          </span>
        </div>
        <Tabs
          values={[
            "Resumen",
            "Préstamos",
            "Pagos",
            "Documentos",
            "Ubicación",
            "Gestiones",
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "Resumen" && (
          <>
            <div className="detail-grid">
              <span>
                <small>Teléfono</small>
                <a href={"tel:" + c.phone}>{c.phone || "Sin teléfono"}</a>
              </span>
              <span>
                <small>Correo</small>
                <span>{c.email || "Pendiente"}</span>
              </span>
              <span className="span-two">
                <small>Dirección</small>
                <span>
                  {c.address || "Pendiente"} · {c.district}
                </span>
              </span>
              <span>
                <small>Responsable</small>
                <span>{c.owner}</span>
              </span>
              <span>
                <small>Etiquetas</small>
                <span>{c.tags.join(", ") || "Sin etiquetas"}</span>
              </span>
            </div>
            <p className="muted">{c.notes}</p>
            <div className="button-row">
              {can(role, "write") && (
                <Button onClick={() => open({ type: "client-edit", id })}>
                  Editar cliente
                </Button>
              )}
              {can(role, "manage") && (
                <>
                  <Button
                    onClick={() => open({ type: "assign", clientId: id })}
                  >
                    Asignar responsable
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      open({
                        type: "confirm",
                        data: {
                          title: c.archived
                            ? "Reactivar cliente"
                            : "Archivar cliente",
                          text: c.archived
                            ? "El expediente vuelve a estar disponible para nuevos préstamos."
                            : "Se conserva el historial. No se puede archivar con deuda o crédito pendiente.",
                          command: {
                            type: "client.archive",
                            id,
                            archived: !c.archived,
                          },
                        },
                      })
                    }
                  >
                    {c.archived ? "Reactivar" : "Archivar"}
                  </Button>
                </>
              )}
              {c.credit > 0 && can(role, "write") && (
                <Button onClick={() => open({ type: "credit", clientId: id })}>
                  Gestionar saldo a favor
                </Button>
              )}
            </div>
          </>
        )}
        {tab === "Préstamos" && (
          <>
            <div className="panel-section">
              <SectionTitle
                title={`${owned.length} préstamos`}
                action={
                  can(role, "write") && !c.archived ? (
                    <Button
                      variant="small"
                      onClick={() => open({ type: "loan-new", clientId: id })}
                    >
                      <Plus size={15} />
                      Nuevo
                    </Button>
                  ) : undefined
                }
              />
              {owned.map((l) => (
                <button
                  key={l.id}
                  className="detail-row"
                  onClick={() => open({ type: "loan", id: l.id })}
                >
                  <span>
                    <strong>{l.id}</strong>
                    <small>
                      {l.count} cuotas · {l.tea}%{" "}
                      {l.method === "simple" ? "simple" : "TEA"}
                    </small>
                  </span>
                  <span>
                    <strong>{money(principalLeft(l))}</strong>
                    <Badge>{condition(l, state.business.today)}</Badge>
                  </span>
                  <ArrowRight size={17} />
                </button>
              ))}
              {!owned.length && <Empty title="Sin préstamos todavía" />}
            </div>
          </>
        )}
        {tab === "Pagos" && (
          <>
            {pay.map((p) => (
              <button
                className="detail-row"
                key={p.id}
                onClick={() => open({ type: "receipt", id: p.id })}
              >
                <span>
                  <strong>{p.id}</strong>
                  <small>
                    {dateLabel(p.date, true)} · {p.method}
                  </small>
                </span>
                <strong>{money(p.amount)}</strong>
                <Badge tone={p.reversed ? "neutral" : "success"}>
                  {p.reversed ? "Reversado" : "Registrado"}
                </Badge>
              </button>
            ))}
            {!pay.length && <Empty title="Sin pagos registrados" />}
          </>
        )}
        {tab === "Documentos" && (
          <>
            <div className="button-row">
              {can(role, "write") && (
                <Button
                  onClick={() => open({ type: "document-new", clientId: id })}
                >
                  <Paperclip size={16} />
                  Añadir documento
                </Button>
              )}
            </div>
            {documents
              .filter((d) => d.clientId === id)
              .map((d) => (
                <button
                  className="detail-row"
                  key={d.id}
                  onClick={() => open({ type: "document", id: d.id })}
                >
                  <FileText size={22} />
                  <span>
                    <strong>{d.name}</strong>
                    <small>{d.category}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
          </>
        )}
        {tab === "Ubicación" && (
          <>
            <div className="location-preview">
              <img
                src="/fachada-ejemplo.svg"
                alt="Referencia ilustrada de una fachada ficticia"
              />
              <Badge tone="neutral">Referencia ilustrada</Badge>
            </div>
            <div className="detail-grid">
              <span>
                <small>Ubicación</small>
                <Badge>
                  {c.location?.confirmed
                    ? "Confirmada manualmente"
                    : "Pendiente"}
                </Badge>
              </span>
              <span>
                <small>Referencia</small>
                <span>{c.reference || "Pendiente"}</span>
              </span>
            </div>
            <Button onClick={() => open({ type: "location", clientId: id })}>
              {can(role, "write") ? "Completar ubicación" : "Ver ubicación"}
              <MapPin size={17} />
            </Button>
          </>
        )}
        {tab === "Gestiones" && (
          <>
            <div className="button-row">
              {can(role, "write") && (
                <>
                  <Button
                    onClick={() => open({ type: "contact", clientId: id })}
                  >
                    Registrar contacto
                  </Button>
                  <Button
                    onClick={() => open({ type: "promise", clientId: id })}
                  >
                    Nueva promesa
                  </Button>
                </>
              )}
            </div>
            {activities
              .filter((a) => a.clientId === id)
              .map((a) => (
                <button
                  className="detail-row"
                  key={a.id}
                  onClick={() => open({ type: "activity-detail", id: a.id })}
                >
                  <span>
                    <strong>{a.title}</strong>
                    <small>
                      {dateLabel(a.start, true)} · {a.owner}
                    </small>
                  </span>
                  <Badge>
                    {a.type === "promesa"
                      ? promiseStatus(a, state.payments, state.business.today)
                      : a.status === "completada"
                        ? "Completada"
                        : a.status === "cancelada"
                          ? "Cancelada"
                          : "Pendiente"}
                  </Badge>
                </button>
              ))}
          </>
        )}
      </div>
      <PanelFooter>
        <Button
          onClick={() => open({ type: "activity-new", clientId: id })}
          disabled={!can(role, "write")}
        >
          Agendar visita
        </Button>
        {can(role, "write") && !c.archived && (
          <Button
            variant="primary"
            onClick={() =>
              open({
                type: owned.some((l) => l.status === "activo")
                  ? "payment"
                  : "loan-new",
                clientId: id,
              })
            }
          >
            {owned.some((l) => l.status === "activo")
              ? "Registrar pago"
              : "Nuevo préstamo"}
          </Button>
        )}
      </PanelFooter>
    </>
  );
}
function ScheduleTable({ loan, pay = true }: { loan: Loan; pay?: boolean }) {
  const { state, open, role } = useDemo();
  return (
    <div className="simple-table-wrap">
      <table className="simple-table schedule-table">
        <thead>
          <tr>
            <th>Cuota</th>
            <th>Vence</th>
            <th>Capital</th>
            <th>Interés</th>
            <th>Pendiente</th>
            {pay && <th />}
          </tr>
        </thead>
        <tbody>
          {currentInstallments(loan).map((i) => (
            <tr key={i.id}>
              <td>{i.number}</td>
              <td>{dateLabel(i.due, true)}</td>
              <td>{money(i.principal)}</td>
              <td>{money(i.interest)}</td>
              <td>
                <strong>{money(remaining(i))}</strong>
                <small className="block">
                  {remaining(i) === 0
                    ? "Pagada"
                    : i.paidPrincipal + i.paidInterest > 0
                      ? "Parcial"
                      : i.due < state.business.today
                        ? "Vencida"
                        : "Pendiente"}
                </small>
              </td>
              {pay && (
                <td>
                  {loan.status === "activo" &&
                    remaining(i) > 0 &&
                    can(role, "write") && (
                      <button
                        className="icon-button"
                        aria-label={"Pagar cuota " + i.number}
                        onClick={() =>
                          open({
                            type: "payment",
                            loanId: loan.id,
                            installmentId: i.id,
                          })
                        }
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function LoanForm({ panel }: { panel: Panel }) {
  const { state, run, open, role } = useDemo();
  const { clients } = useVisible();
  const old = state.loans.find((l) => l.id === panel.id);
  const [draft, setDraft] = useState<Loan | null>(null);
  const [error, setError] = useState("");
  const id = useRef(old?.id ?? newId("PRE"));
  const [values, setValues] = useState<Values>({
    clientId: old?.clientId ?? panel.clientId ?? "",
    principal: String(old?.principal ?? ""),
    tea: String(old?.tea ?? 18),
    method: old?.method ?? "frances",
    count: String(old?.count ?? 6),
    disbursed: old?.disbursed ?? state.business.today,
    firstDue: old?.firstDue ?? addMonths(state.business.today, 1),
    notes: old?.notes ?? "",
  });
  if (!draft)
    return (
      <EditForm
        defaults={values}
        fields={[
          {
            name: "clientId",
            label: "Cliente",
            type: "select",
            required: true,
            wide: true,
            options: [
              { value: "", label: "Seleccionar cliente" },
              ...clients
                .filter((c) => !c.archived)
                .map((c) => ({ value: c.id, label: c.name + " · " + c.dni })),
            ],
          },
          {
            name: "principal",
            label: "Capital a prestar (S/)",
            type: "number",
            required: true,
            min: 0,
            step: "0.01",
          },
          {
            name: "count",
            label: "Número de cuotas",
            type: "number",
            required: true,
            min: 1,
            max: 120,
            step: "1",
          },
          {
            name: "method",
            label: "Método",
            type: "select",
            options: [
              { value: "frances", label: "Cuota fija · francés" },
              { value: "simple", label: "Interés simple anual" },
            ],
          },
          {
            name: "tea",
            label: "Tasa anual ficticia (%)",
            type: "number",
            required: true,
            min: 0,
            hint: "TEA para francés; tasa simple para el método simple.",
          },
          {
            name: "disbursed",
            label: "Desembolso previsto",
            type: "date",
            required: true,
          },
          {
            name: "firstDue",
            label: "Primer vencimiento",
            type: "date",
            required: true,
          },
          {
            name: "notes",
            label: "Motivo de tasa individual / notas",
            type: "textarea",
            wide: true,
          },
        ]}
        schema={yup.object({
          clientId: requiredText("cliente"),
          principal: positive("Capital"),
          count: positive("Cuotas").integer().max(120),
          tea: yup
            .number()
            .typeError("Escribe una tasa válida.")
            .min(0)
            .required(),
          firstDue: requiredText("primer vencimiento"),
        })}
        label="Simular préstamo"
        extra={(v, change) => (
          <div className="callout">
            <p>
              Cuotas mensuales convencionales. La regla por monto aplica una TEA
              ficticia; una tasa individual necesita motivo.
            </p>
            <Button
              variant="small"
              onClick={() => {
                const rule = state.rates.find(
                  (r) =>
                    r.active &&
                    Number(v.principal) >= r.min &&
                    Number(v.principal) <= r.max,
                );
                if (rule) {
                  change({ ...v, tea: String(rule.tea) });
                  setError("");
                } else
                  setError(
                    "Ingresa un capital dentro de un rango de tasa configurado.",
                  );
              }}
            >
              Aplicar regla de tasa
            </Button>
            <FormError message={error} />
          </div>
        )}
        onSave={(v) => {
          if (v.firstDue <= v.disbursed)
            throw new Error(
              "El primer vencimiento debe ser posterior al desembolso.",
            );
          const rule = state.rates.find(
            (r) =>
              r.active &&
              Number(v.principal) >= r.min &&
              Number(v.principal) <= r.max,
          );
          if (rule && Number(v.tea) !== rule.tea && role !== "Dueño")
            throw new Error(
              "La tasa individual requiere permiso del dueño. Tasa de regla: " +
                rule.tea +
                "%.",
            );
          if (rule && Number(v.tea) !== rule.tea && !v.notes.trim())
            throw new Error(
              "Indica el motivo de la tasa individual en las notas.",
            );
          const method = v.method as Loan["method"];
          setValues(v);
          setDraft({
            id: id.current,
            clientId: v.clientId,
            principal: Number(v.principal),
            count: Number(v.count),
            tea: Number(v.tea),
            method,
            disbursed: v.disbursed,
            firstDue: v.firstDue,
            notes: v.notes,
            status: "borrador",
            version: old?.version ?? 1,
            history: [],
            installments: schedule(
              Number(v.principal),
              Number(v.tea),
              Number(v.count),
              v.firstDue,
              method,
              id.current,
            ),
          });
        }}
      />
    );
  const total = draft.installments.reduce(
    (s, i) => s + i.principal + i.interest,
    0,
  );
  return (
    <>
      <div className="drawer-content">
        <div className="success-heading">
          <CheckCircle size={26} />
          <div>
            <h3>Tu cronograma está listo</h3>
            <p>{clients.find((c) => c.id === draft.clientId)?.name}</p>
          </div>
        </div>
        <div className="panel-metrics">
          <span>
            <small>Primera cuota</small>
            <strong>
              {money(
                draft.installments[0].principal +
                  draft.installments[0].interest,
              )}
            </strong>
          </span>
          <span>
            <small>Intereses previstos</small>
            <strong>{money(total - draft.principal)}</strong>
          </span>
          <span>
            <small>Total previsto</small>
            <strong>{money(total)}</strong>
          </span>
        </div>
        <ScheduleTable loan={draft} pay={false} />
        <div className="callout">
          <p>
            Guardar el borrador no activa cobros. Después podrás aprobar las
            condiciones y registrar el desembolso.
          </p>
        </div>
        <FormError message={error} />
        <Button
          onClick={() =>
            downloadPdf(
              "Cronograma de ejemplo",
              ["Cuota", "Vencimiento", "Capital", "Interés"],
              draft.installments.map((i) => [
                i.number,
                i.due,
                money(i.principal),
                money(i.interest),
              ]),
              "Simulación mensual · " + draft.id,
            )
          }
        >
          <DownloadSimple size={16} />
          Descargar cronograma
        </Button>
      </div>
      <PanelFooter>
        <Button onClick={() => setDraft(null)}>Editar condiciones</Button>
        <Button
          variant="primary"
          onClick={() => {
            try {
              run({ type: "loan.save", loan: draft });
              open({ type: "loan", id: draft.id });
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Guardar borrador
        </Button>
      </PanelFooter>
    </>
  );
}
function LoanDetail({ id }: { id: string }) {
  const { state, open, role } = useDemo();
  const { loans } = useVisible();
  const l = loans.find((x) => x.id === id);
  const [tab, setTab] = useState("Cronograma");
  if (!l) return <Empty title="Préstamo no disponible" />;
  const c = state.clients.find((c) => c.id === l.clientId)!;
  return (
    <>
      <div className="drawer-content">
        <div className="profile-heading">
          <Avatar name={c.name} />
          <div>
            <h2>{l.id}</h2>
            <button
              className="text-button muted"
              onClick={() => open({ type: "client", id: c.id })}
            >
              {c.name}
              <ArrowUpRight size={14} />
            </button>
          </div>
          <Badge>{condition(l, state.business.today)}</Badge>
        </div>
        <div className="panel-metrics">
          <span>
            <small>Capital original</small>
            <strong>{money(l.principal)}</strong>
          </span>
          <span>
            <small>Capital pendiente</small>
            <strong>{money(principalLeft(l))}</strong>
          </span>
          <span>
            <small>Tasa anual</small>
            <strong>{l.tea}%</strong>
          </span>
        </div>
        <div className="detail-grid">
          <span>
            <small>Método</small>
            <span>
              {l.method === "frances"
                ? "Cuota fija · francés"
                : "Interés simple"}
            </span>
          </span>
          <span>
            <small>
              Desembolso{" "}
              {l.status === "borrador" || l.status === "aprobado"
                ? "previsto"
                : ""}
            </small>
            <span>{dateLabel(l.disbursed, true)}</span>
          </span>
        </div>
        <Tabs
          values={["Cronograma", "Historial"]}
          value={tab}
          onChange={setTab}
        />
        {tab === "Cronograma" ? (
          <>
            <ScheduleTable loan={l} />
            <div className="button-row">
              <Button
                onClick={() =>
                  downloadPdf(
                    "Cronograma",
                    ["Cuota", "Vencimiento", "Capital", "Interés", "Pendiente"],
                    l.installments.map((i) => [
                      i.number,
                      i.due,
                      money(i.principal),
                      money(i.interest),
                      money(remaining(i)),
                    ]),
                    `${l.id} · versión ${l.version}`,
                  )
                }
              >
                <DownloadSimple size={15} />
                PDF
              </Button>
              {l.status === "borrador" && can(role, "write") && (
                <Button onClick={() => open({ type: "loan-edit", id: l.id })}>
                  Editar borrador
                </Button>
              )}
              {can(role, "finance") &&
                ["borrador", "aprobado"].includes(l.status) && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      open({
                        type: "confirm",
                        data: {
                          title: "Cancelar préstamo sin desembolso",
                          text: "Conserva el borrador y su historial; no se registra entrega de dinero.",
                          command: { type: "loan.cancel", id: l.id },
                        },
                      })
                    }
                  >
                    Cancelar préstamo
                  </Button>
                )}
            </div>
            {can(role, "finance") && l.status === "activo" && (
              <div className="action-grid">
                <Button
                  onClick={() => open({ type: "reschedule", loanId: l.id })}
                >
                  Reprogramar
                </Button>
                <Button onClick={() => open({ type: "prepay", loanId: l.id })}>
                  Abonar a capital
                </Button>
                <Button
                  onClick={() => open({ type: "liquidate", loanId: l.id })}
                >
                  Liquidar préstamo
                </Button>
              </div>
            )}
            {l.adjustment && (
              <div className="callout">
                <strong>Hay una propuesta guardada</strong>
                <p>{l.adjustment.reason}</p>
                <Button
                  onClick={() => open({ type: "reschedule", loanId: l.id })}
                >
                  Revisar propuesta
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="timeline">
              <div>
                <strong>Préstamo registrado</strong>
                <small>
                  {dateLabel(l.disbursed)} · Versión vigente {l.version}
                </small>
              </div>
              {l.history.map((h) => (
                <div key={h.version}>
                  <strong>{h.reason}</strong>
                  <small>
                    {dateLabel(h.date)} · Versión {h.version}
                  </small>
                  <p>
                    {h.installments.length} cuotas conservadas en el historial.
                  </p>
                  <Button
                    variant="small"
                    onClick={() =>
                      open({
                        type: "schedule-version",
                        id: l.id,
                        data: { version: h.version },
                      })
                    }
                  >
                    Ver cronograma anterior
                  </Button>
                </div>
              ))}
              {state.payments
                .filter((p) => p.loanId === id)
                .map((p) => (
                  <button
                    className="detail-row"
                    key={p.id}
                    onClick={() => open({ type: "receipt", id: p.id })}
                  >
                    <span>
                      <strong>
                        {p.reversed ? "Pago y reverso" : "Pago registrado"}
                      </strong>
                      <small>
                        {p.id} · {p.date}
                      </small>
                    </span>
                    <strong>{money(p.amount)}</strong>
                  </button>
                ))}
            </div>
          </>
        )}
      </div>
      <PanelFooter>
        <Button onClick={() => open({ type: "client", id: c.id })}>
          Ver cliente
        </Button>
        {l.status === "borrador" && can(role, "finance") && (
          <Button
            variant="primary"
            onClick={() =>
              open({
                type: "confirm",
                data: {
                  title: "Aprobar condiciones",
                  text: `Se fijan ${l.count} cuotas y una tasa ${l.tea}%. Todavía no se registra entrega de dinero.`,
                  command: { type: "loan.approve", id: l.id },
                  next: { type: "loan", id: l.id },
                },
              })
            }
          >
            Aprobar condiciones
          </Button>
        )}
        {l.status === "aprobado" && can(role, "finance") && (
          <Button
            variant="primary"
            onClick={() =>
              open({
                type: "confirm",
                data: {
                  title: "Registrar desembolso realizado",
                  text: `Confirma que se entregaron ${money(l.principal)}. No se ejecutará ninguna transferencia.`,
                  command: {
                    type: "loan.disburse",
                    id: l.id,
                    date: state.business.today,
                  },
                  date: true,
                  next: { type: "loan", id: l.id },
                },
              })
            }
          >
            Registrar desembolso
          </Button>
        )}
        {l.status === "activo" && can(role, "write") && (
          <Button
            variant="primary"
            onClick={() => open({ type: "payment", loanId: l.id })}
          >
            Registrar pago
          </Button>
        )}
      </PanelFooter>
    </>
  );
}
function PaymentForm({ panel }: { panel: Panel }) {
  const { state, role, run, open, notice } = useDemo();
  const { loans, clients } = useVisible();
  const available = loans.filter(
    (l) =>
      l.status === "activo" &&
      (!panel.clientId || l.clientId === panel.clientId),
  );
  const initial = available.find((l) => l.id === panel.loanId);
  const selected = initial?.installments.find(
    (i) => i.id === panel.installmentId,
  );
  const [values, setValues] = useState<Values>({
    loanId: initial?.id ?? "",
    amount: initial
      ? String(
          selected
            ? remaining(selected)
            : Math.min(
                loanLeft(initial),
                remaining(
                  currentInstallments(initial).find((i) => remaining(i) > 0)!,
                ),
              ),
        )
      : "",
    date: state.business.today,
    method: "Efectivo",
    reference: "",
    notes: "",
    destination: panel.installmentId ?? "all",
    allowCredit: "false",
  });
  const [review, setReview] = useState<{
    loan: Loan;
    plan: ReturnType<typeof planPayment>;
  } | null>(null);
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [busy, setBusy] = useState(false);
  const key = useRef(newId("OP"));
  const lock = useRef(false);
  if (!review)
    return (
      <EditForm
        defaults={values}
        fields={[
          {
            name: "loanId",
            label: "Préstamo",
            type: "select",
            required: true,
            wide: true,
            options: [
              { value: "", label: "Seleccionar préstamo" },
              ...available.map((l) => ({
                value: l.id,
                label:
                  l.id + " · " + clients.find((c) => c.id === l.clientId)?.name,
              })),
            ],
          },
          {
            name: "amount",
            label: "Importe recibido (S/)",
            type: "number",
            min: 0,
            step: "0.01",
            required: true,
          },
          {
            name: "date",
            label: "Fecha efectiva",
            type: "date",
            required: true,
          },
          {
            name: "method",
            label: "Método de registro",
            type: "select",
            options: options(["Efectivo", "Transferencia", "Yape / Plin"]),
          },
          { name: "reference", label: "Número de operación" },
          {
            name: "destination",
            label: "Aplicación",
            type: "select",
            wide: true,
            options: [
              {
                value: "all",
                label: "Cuotas pendientes, de la más antigua en adelante",
              },
              ...(initial && selected
                ? [
                    {
                      value: selected.id,
                      label: "Solo cuota " + selected.number,
                    },
                  ]
                : []),
            ],
          },
          {
            name: "allowCredit",
            label: "Guardar excedente como saldo a favor",
            type: "checkbox",
            hint: "El excedente se conserva separado del capital.",
            wide: true,
          },
          {
            name: "notes",
            label: "Nota del pago",
            type: "textarea",
            wide: true,
          },
        ]}
        schema={yup.object({
          loanId: requiredText("préstamo"),
          amount: positive("Importe"),
          date: requiredText("fecha"),
        })}
        label="Revisar distribución"
        extra={
          <div className="callout">
            <p>
              Registrar Yape/Plin guarda la referencia del pago; no conecta una
              pasarela. Puedes adjuntar el comprobante después de confirmar.
            </p>
          </div>
        }
        onSave={(v) => {
          const l = available.find((x) => x.id === v.loanId);
          if (!l) throw new Error("Selecciona un préstamo activo.");
          if (v.date > state.business.today)
            throw new Error(
              "No se registra un cobro con fecha futura. Usa una promesa de pago.",
            );
          const plan = planPayment(
            l,
            Number(v.amount),
            v.destination === "all" ? undefined : v.destination,
          );
          if (plan.excess > 0 && v.allowCredit !== "true")
            throw new Error(
              "El importe tiene un excedente. Amplía la aplicación a cuotas o elige saldo a favor.",
            );
          setValues(v);
          setReview({ loan: structuredClone(l), plan });
        }}
      />
    );
  const commit = () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const next = run({
        type: "payment",
        key: key.current,
        loanId: values.loanId,
        amount: Number(values.amount),
        date: values.date,
        method: values.method,
        reference: values.reference,
        notes: values.notes,
        selected: values.destination === "all" ? undefined : values.destination,
        allowCredit: values.allowCredit === "true",
        version: review.loan.version,
      });
      const p = next.payments.find((x) => x.key === key.current)!;
      if (state.scenario === "incierto" && !uncertain) {
        setUncertain(true);
        notice(
          "Simulación: respuesta perdida. Comprueba el resultado usando la misma operación.",
        );
      } else {
        open({ type: "receipt", id: p.id });
        notice("Pago registrado. Las vistas de tu cartera están actualizadas.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <div className="drawer-content">
        <div className="payment-summary">
          <small>Importe recibido</small>
          <strong>{money(Number(values.amount))}</strong>
          <span>
            {clients.find((c) => c.id === review.loan.clientId)?.name} ·{" "}
            {review.loan.id}
          </span>
        </div>
        <SectionTitle title="Así se aplica el abono" />
        <table className="simple-table">
          <thead>
            <tr>
              <th>Cuota</th>
              <th>Interés</th>
              <th>Capital</th>
            </tr>
          </thead>
          <tbody>
            {review.plan.allocations.map((a) => (
              <tr key={a.installmentId}>
                <td>
                  {
                    review.loan.installments.find(
                      (i) => i.id === a.installmentId,
                    )?.number
                  }
                </td>
                <td>{money(a.interest)}</td>
                <td>{money(a.principal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {review.plan.excess > 0 && (
          <div className="callout">
            <strong>Saldo a favor: {money(review.plan.excess)}</strong>
            <p>Este crédito quedará disponible en el expediente del cliente.</p>
          </div>
        )}
        <div className="detail-grid">
          <span>
            <small>Fecha</small>
            <span>{dateLabel(values.date, true)}</span>
          </span>
          <span>
            <small>Método</small>
            <span>{values.method}</span>
          </span>
          <span>
            <small>Deuda programada restante</small>
            <strong>
              {money(
                Math.max(
                  0,
                  loanLeft(review.loan) -
                    Number(values.amount) +
                    review.plan.excess,
                ),
              )}
            </strong>
          </span>
        </div>
        {uncertain && (
          <div className="callout">
            <strong>Estamos comprobando el resultado</strong>
            <p>
              La operación puede haberse registrado. Comprueba su estado antes
              de iniciar otro pago.
            </p>
          </div>
        )}
        <FormError message={error} />
      </div>
      <PanelFooter>
        <Button
          onClick={() => {
            setReview(null);
            setError("");
          }}
          disabled={uncertain}
        >
          Editar pago
        </Button>
        <Button
          variant="primary"
          disabled={busy || !can(role, "write")}
          onClick={commit}
        >
          {busy
            ? "Confirmando..."
            : uncertain
              ? "Comprobar resultado"
              : "Confirmar pago"}
        </Button>
      </PanelFooter>
    </>
  );
}
function Receipt({ id }: { id: string }) {
  const { state, open, role } = useDemo();
  const { payments } = useVisible();
  const p = payments.find((x) => x.id === id);
  if (!p) return <Empty title="Pago no disponible" />;
  const l = state.loans.find((x) => x.id === p.loanId)!;
  const c = state.clients.find((x) => x.id === l.clientId)!;
  return (
    <>
      <div className="drawer-content">
        <div className="receipt">
          <div className="receipt-mark">
            <CheckCircle size={34} />
          </div>
          <Badge tone={p.reversed ? "neutral" : "success"}>
            {p.reversed ? "Pago reversado" : "Pago confirmado"}
          </Badge>
          <h2>{money(p.amount)}</h2>
          <p>{c.name}</p>
          <span className="mono">{p.id}</span>
          <div className="detail-grid">
            <span>
              <small>Préstamo</small>
              <span>{p.loanId}</span>
            </span>
            <span>
              <small>Fecha efectiva</small>
              <span>{dateLabel(p.date, true)}</span>
            </span>
            <span>
              <small>Método</small>
              <span>{p.method}</span>
            </span>
            <span>
              <small>Referencia</small>
              <span>{p.reference || "Sin referencia"}</span>
            </span>
          </div>
          <p className="muted">
            {p.notes || "Comprobante de presentación. Datos ficticios."}
          </p>
          {p.credit > 0 && <p>Crédito generado: {money(p.credit)}</p>}
          {p.reversed && (
            <div className="callout">
              <strong>Reversado el {p.reversedOn}</strong>
              <p>{p.reverseReason}</p>
            </div>
          )}
        </div>
        <div className="button-row">
          <Button
            onClick={() =>
              downloadPdf(
                "Comprobante de pago",
                ["Concepto", "Detalle"],
                [
                  ["Código", p.id],
                  ["Cliente", c.name],
                  ["Préstamo", p.loanId],
                  ["Importe", money(p.amount)],
                  ["Estado", p.reversed ? "Reversado" : "Registrado"],
                  ["Método", p.method],
                ],
                "Pago de demostración · " + p.date,
              )
            }
          >
            <DownloadSimple size={16} />
            Descargar PDF
          </Button>
          {can(role, "write") && (
            <Button
              onClick={() =>
                open({ type: "document-new", clientId: c.id, loanId: l.id })
              }
            >
              <Paperclip size={16} />
              Adjuntar comprobante
            </Button>
          )}
          {can(role, "finance") && !p.reversed && (
            <Button
              variant="ghost"
              onClick={() => open({ type: "reverse", id })}
            >
              Reversar pago
            </Button>
          )}
        </div>
      </div>
      <PanelFooter>
        <Button onClick={() => open({ type: "loan", id: l.id })}>
          Ver préstamo
        </Button>
        {l.status === "activo" && can(role, "write") && (
          <Button
            variant="primary"
            onClick={() => open({ type: "payment", loanId: l.id })}
          >
            Registrar otro pago
          </Button>
        )}
      </PanelFooter>
    </>
  );
}
function InstallmentDetail({ panel }: { panel: Panel }) {
  const { state, open, role } = useDemo();
  const { loans } = useVisible();
  const l = loans.find((x) => x.id === panel.loanId);
  const i = l?.installments.find((x) => x.id === panel.installmentId);
  if (!l || !i)
    return (
      <Empty
        title="Cuota no disponible"
        description="Puede pertenecer a una versión sustituida."
      />
    );
  return (
    <>
      <div className="drawer-content">
        <Badge>
          {remaining(i) === 0
            ? "Pagada"
            : i.due < state.business.today
              ? "Vencida"
              : i.due === state.business.today
                ? "Vence hoy"
                : "Próxima"}
        </Badge>
        <h2>
          Cuota {i.number} · {l.id}
        </h2>
        <p>{state.clients.find((c) => c.id === l.clientId)?.name}</p>
        <div className="payment-summary">
          <small>Pendiente de esta cuota</small>
          <strong>{money(remaining(i))}</strong>
          <span>Vence el {dateLabel(i.due)}</span>
        </div>
        <div className="detail-grid">
          <span>
            <small>Capital previsto</small>
            <strong>{money(i.principal)}</strong>
          </span>
          <span>
            <small>Interés previsto</small>
            <strong>{money(i.interest)}</strong>
          </span>
          <span>
            <small>Pagado</small>
            <strong>{money(i.paidPrincipal + i.paidInterest)}</strong>
          </span>
          <span>
            <small>Responsable</small>
            <span>{state.clients.find((c) => c.id === l.clientId)?.owner}</span>
          </span>
        </div>
        <div className="button-row">
          <Button onClick={() => open({ type: "loan", id: l.id })}>
            Ver préstamo
          </Button>
          <Button onClick={() => open({ type: "client", id: l.clientId })}>
            Ver cliente
          </Button>
          {can(role, "finance") && remaining(i) > 0 && (
            <Button onClick={() => open({ type: "reschedule", loanId: l.id })}>
              Proponer reprogramación
            </Button>
          )}
        </div>
      </div>
      <PanelFooter>
        {can(role, "write") && remaining(i) > 0 && (
          <Button
            variant="primary"
            onClick={() =>
              open({ type: "payment", loanId: l.id, installmentId: i.id })
            }
          >
            Registrar pago
          </Button>
        )}
      </PanelFooter>
    </>
  );
}
function ReverseForm({ id }: { id: string }) {
  const { state, run, open } = useDemo();
  const p = state.payments.find((x) => x.id === id)!;
  return (
    <EditForm
      defaults={{ reason: "" }}
      fields={[
        {
          name: "reason",
          label: "Motivo del reverso",
          type: "textarea",
          required: true,
          wide: true,
        },
      ]}
      schema={yup.object({ reason: requiredText("motivo") })}
      label="Confirmar reverso"
      extra={
        <div className="callout">
          <strong>
            {money(p.amount)} · {p.id}
          </strong>
          <p>
            El original se conserva. Se restaurará la deuda aplicable y, si
            corresponde, se reabrirá el préstamo. Los ajustes dependientes
            requieren revisión antes de reversar.
          </p>
        </div>
      }
      onSave={(v) => {
        run({ type: "reverse", id, reason: v.reason });
        open({ type: "receipt", id });
      }}
    />
  );
}
function AdjustmentForm({ id }: { id: string }) {
  const { state, run, open } = useDemo();
  const l = state.loans.find((x) => x.id === id)!;
  const [values, setValues] = useState<Values>({
    count: String(l.adjustment?.count ?? l.count),
    firstDue: l.adjustment?.firstDue ?? addMonths(state.business.today, 1),
    tea: String(l.adjustment?.tea ?? l.tea),
    reason: l.adjustment?.reason ?? "",
  });
  const [preview, setPreview] = useState<Loan | null>(null);
  const [error, setError] = useState("");
  const version = useRef(l.adjustment?.basedOn ?? l.version);
  if (!preview)
    return (
      <EditForm
        defaults={values}
        fields={[
          {
            name: "count",
            label: "Nuevas cuotas mensuales",
            type: "number",
            min: 1,
            max: 120,
            required: true,
          },
          {
            name: "tea",
            label: "Tasa anual ficticia (%)",
            type: "number",
            min: 0,
            required: true,
          },
          {
            name: "firstDue",
            label: "Nuevo primer vencimiento",
            type: "date",
            required: true,
            wide: true,
          },
          {
            name: "reason",
            label: "Motivo de la reprogramación",
            type: "textarea",
            required: true,
            wide: true,
          },
        ]}
        schema={yup.object({
          count: positive("Cuotas").integer().max(120),
          tea: yup.number().min(0).required(),
          reason: requiredText("motivo"),
        })}
        label="Calcular propuesta"
        onSave={(v) => {
          if (v.firstDue <= state.business.today)
            throw new Error("Elige una fecha posterior a hoy.");
          const installments = schedule(
            principalLeft(l),
            Number(v.tea),
            Number(v.count),
            v.firstDue,
            l.method,
            "propuesta",
          );
          const interest = currentInstallments(l)
            .filter((i) => i.due <= state.business.today)
            .reduce((s, i) => s + i.interest - i.paidInterest, 0);
          installments[0].interest = moneyValue(
            installments[0].interest + interest,
          );
          setValues(v);
          setPreview({
            ...l,
            installments,
            count: Number(v.count),
            tea: Number(v.tea),
            firstDue: v.firstDue,
          });
        }}
      />
    );
  const confirm = (apply: boolean) => {
    try {
      run({
        type: "reschedule",
        id,
        count: Number(values.count),
        firstDue: values.firstDue,
        tea: Number(values.tea),
        reason: values.reason,
        version: version.current,
        apply,
      });
      open({ type: "loan", id });
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <div className="drawer-content">
        <div className="compare-grid">
          <div>
            <small>Antes</small>
            <strong>
              {currentInstallments(l).filter((i) => remaining(i) > 0).length}{" "}
              cuotas pendientes
            </strong>
            <span>{money(loanLeft(l))} programados</span>
          </div>
          <div>
            <small>Propuesta</small>
            <strong>{preview.count} cuotas</strong>
            <span>{money(loanLeft(preview))} programados</span>
          </div>
        </div>
        <p>
          Capital remanente: <strong>{money(principalLeft(l))}</strong>. Los
          intereses exigibles al corte se conservan en la primera nueva cuota.
        </p>
        <ScheduleTable loan={preview} pay={false} />
        <p className="muted">
          Guardar conserva la propuesta aparte. Aprobar crea una versión nueva
          sin borrar pagos anteriores.
        </p>
        <FormError message={error} />
      </div>
      <PanelFooter>
        <Button onClick={() => confirm(false)}>Guardar propuesta</Button>
        <Button variant="primary" onClick={() => confirm(true)}>
          Aprobar y aplicar
        </Button>
      </PanelFooter>
    </>
  );
}
function FinancialAdjustment({ panel }: { panel: Panel }) {
  const { state, run, open } = useDemo();
  const l = state.loans.find((x) => x.id === (panel.loanId ?? panel.id))!;
  const [error, setError] = useState("");
  const key = useRef(newId("AJU"));
  const version = useRef(l.version);
  const total = moneyValue(
    principalLeft(l) +
      currentInstallments(l)
        .filter((i) => i.due <= state.business.today)
        .reduce((s, i) => s + i.interest - i.paidInterest, 0),
  );
  if (panel.type === "prepay")
    return (
      <EditForm
        defaults={{ amount: "", reduce: "cuota" }}
        fields={[
          {
            name: "amount",
            label: "Abono a capital (S/)",
            type: "number",
            required: true,
            min: 0,
          },
          {
            name: "reduce",
            label: "Qué reducir",
            type: "select",
            options: [
              { value: "cuota", label: "Importe de cuota" },
              { value: "plazo", label: "Número de cuotas" },
            ],
          },
        ]}
        schema={yup.object({ amount: positive("Abono") })}
        label="Confirmar prepago de ejemplo"
        extra={
          <div className="callout">
            <strong>Capital pendiente {money(principalLeft(l))}</strong>
            <p>
              Primero regulariza las cuotas exigibles. Esta simulación mensual
              reduce capital y recalcula cuotas; reducir plazo es una
              aproximación proporcional de presentación.
            </p>
          </div>
        }
        onSave={(v) => {
          const next = run({
            type: "prepay",
            id: l.id,
            amount: Number(v.amount),
            reduce: v.reduce as "cuota" | "plazo",
            key: key.current,
            version: version.current,
          });
          open({
            type: "receipt",
            id: next.payments.find((p) => p.key === key.current)!.id,
          });
        }}
      />
    );
  return (
    <>
      <div className="drawer-content">
        <div className="payment-summary">
          <small>Liquidación al {dateLabel(state.business.today, true)}</small>
          <strong>{money(total)}</strong>
          <span>{l.id}</span>
        </div>
        <div className="detail-grid">
          <span>
            <small>Capital pendiente</small>
            <strong>{money(principalLeft(l))}</strong>
          </span>
          <span>
            <small>Interés exigible</small>
            <strong>{money(total - principalLeft(l))}</strong>
          </span>
        </div>
        <div className="callout">
          <p>
            La presentación usa interés exigible de cuotas al corte. No realiza
            devengo diario ni cobro real. Los intereses de cuotas futuras se
            excluyen de esta cotización convencional.
          </p>
        </div>
        <FormError message={error} />
      </div>
      <PanelFooter>
        <Button onClick={() => open({ type: "loan", id: l.id })}>
          Volver al préstamo
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            try {
              const next = run({
                type: "liquidate",
                id: l.id,
                amount: total,
                key: key.current,
                version: version.current,
              });
              open({
                type: "receipt",
                id: next.payments.find((p) => p.key === key.current)!.id,
              });
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Confirmar liquidación
        </Button>
      </PanelFooter>
    </>
  );
}

function HistoricalSchedule({ panel }: { panel: Panel }) {
  const { state } = useDemo();
  const { loans } = useVisible();
  const loan = loans.find((l) => l.id === panel.id);
  const version = loan?.history.find(
    (h) => h.version === Number(panel.data?.version),
  );
  if (!loan || !version) return <Empty title="Versión no disponible" />;
  return (
    <div className="drawer-content">
      <Badge tone="neutral">Versión {version.version}</Badge>
      <h2>{loan.id}</h2>
      <p>
        {version.reason} · {dateLabel(version.date)}
      </p>
      {version.terms && (
        <div className="detail-grid">
          <span>
            <small>Tasa conservada</small>
            <strong>{version.terms.tea}%</strong>
          </span>
          <span>
            <small>Cuotas pactadas</small>
            <strong>{version.terms.count}</strong>
          </span>
        </div>
      )}
      <ScheduleTable
        loan={{ ...loan, ...version.terms, installments: version.installments }}
        pay={false}
      />
    </div>
  );
}
function ActivityForm({ panel }: { panel: Panel }) {
  const { state, run, open } = useDemo();
  const { clients, loans } = useVisible();
  const old = state.activities.find((a) => a.id === panel.id);
  const type =
    panel.type === "promise"
      ? "promesa"
      : panel.type === "contact"
        ? "llamada"
        : (old?.type ?? "visita");
  const start = String(
    panel.data?.start ?? old?.start ?? state.business.today + "T10:00",
  ).slice(0, 16);
  const end = String(
    panel.data?.end ?? old?.end ?? start.slice(0, 10) + "T10:30",
  ).slice(0, 16);
  const defaults = {
    clientId: old?.clientId ?? panel.clientId ?? "",
    loanId: old?.loanId ?? panel.loanId ?? "",
    title:
      old?.title ??
      (type === "promesa"
        ? "Promesa de pago"
        : type === "llamada"
          ? "Contacto de seguimiento"
          : "Visita de seguimiento"),
    type,
    start: type === "promesa" ? start.slice(0, 10) : start,
    end,
    owner: old?.owner ?? "Mateo Ruiz",
    notes: old?.notes ?? "",
    allowOverlap: "false",
    amount: String(old?.amount ?? ""),
  };
  return (
    <EditForm
      defaults={defaults}
      fields={[
        {
          name: "clientId",
          label: "Cliente",
          type: "select",
          required: true,
          wide: true,
          options: [
            { value: "", label: "Seleccionar cliente" },
            ...clients.map((c) => ({ value: c.id, label: c.name })),
          ],
        },
        {
          name: "loanId",
          label: "Préstamo relacionado",
          type: "select",
          required: type === "promesa",
          wide: true,
          options: [
            { value: "", label: "Sin préstamo relacionado" },
            ...loans
              .filter((l) => l.status === "activo")
              .map((l) => ({
                value: l.id,
                label:
                  l.id + " · " + clients.find((c) => c.id === l.clientId)?.name,
              })),
          ],
        },
        {
          name: "type",
          label: "Tipo de actividad",
          type: "select",
          options: options(
            type === "promesa" ? ["promesa"] : ["visita", "llamada", "tarea"],
          ),
        },
        {
          name: "owner",
          label: "Responsable",
          type: "select",
          options: options(
            state.users.filter((u) => u.active).map((u) => u.name),
          ),
        },
        { name: "title", label: "Título", required: true, wide: true },
        {
          name: "start",
          label: type === "promesa" ? "Fecha del compromiso" : "Inicio",
          type: type === "promesa" ? "date" : "datetime-local",
          required: true,
        },
        ...(type === "promesa"
          ? []
          : [
              {
                name: "end",
                label: "Finaliza",
                type: "datetime-local",
                required: true,
              },
            ]),
        ...(type === "promesa"
          ? [
              {
                name: "amount",
                label: "Importe prometido (S/)",
                type: "number",
                min: 0,
                required: true,
              },
            ]
          : []),
        {
          name: "allowOverlap",
          label: "Permitir un solapamiento de horario revisado",
          type: "checkbox",
          wide: true,
        },
        {
          name: "notes",
          label: "Resultado / notas",
          type: "textarea",
          wide: true,
        },
      ]}
      schema={yup.object({
        clientId: requiredText("cliente"),
        title: requiredText("título"),
        start: requiredText("inicio"),
        end: yup.string(),
      })}
      label={
        old
          ? "Guardar actividad"
          : type === "promesa"
            ? "Guardar compromiso"
            : "Guardar actividad"
      }
      extra={
        panel.data?.moved ? (
          <div className="callout">
            <p>
              Se mostrará el nuevo horario solo después de confirmar. Si
              cancelas, se conserva el anterior.
            </p>
          </div>
        ) : undefined
      }
      onSave={(v) => {
        if (
          v.loanId &&
          loans.find((l) => l.id === v.loanId)?.clientId !== v.clientId
        )
          throw new Error(
            "El préstamo debe pertenecer al cliente seleccionado.",
          );
        const overlap = state.activities.some(
          (a) =>
            a.id !== old?.id &&
            a.owner === v.owner &&
            a.status === "pendiente" &&
            a.start.slice(0, 16) < v.end &&
            a.end.slice(0, 16) > v.start,
        );
        if (overlap && v.allowOverlap !== "true")
          throw new Error(
            "Hay otra actividad en ese horario. Ajusta la hora o confirma que revisaste el solapamiento.",
          );
        const activityStart = type === "promesa" ? v.start + "T12:00" : v.start;
        const activityEnd = type === "promesa" ? v.start + "T12:30" : v.end;
        const a: Activity = {
          id: old?.id ?? newId("ACT"),
          clientId: v.clientId,
          loanId: v.loanId || undefined,
          title: v.title,
          type: v.type as Activity["type"],
          start: activityStart + ":00-05:00",
          end: activityEnd + ":00-05:00",
          owner: v.owner,
          notes: v.notes,
          status:
            old?.status ??
            (panel.type === "contact" ? "completada" : "pendiente"),
          amount: type === "promesa" ? Number(v.amount) : undefined,
          linkedPayments: old?.linkedPayments ?? [],
        };
        run({ type: "activity.save", activity: a });
        open({ type: "activity-detail", id: a.id });
      }}
    />
  );
}
function ActivityDetail({ id }: { id: string }) {
  const { state, open, run, notice, role } = useDemo();
  const { activities, clients, payments } = useVisible();
  const a = activities.find((x) => x.id === id);
  if (!a) return <Empty title="Actividad no disponible" />;
  const c = clients.find((x) => x.id === a.clientId)!;
  const status =
    a.type === "promesa"
      ? promiseStatus(a, payments, state.business.today)
      : a.status === "completada"
        ? "Completada"
        : a.status === "cancelada"
          ? "Cancelada"
          : "Pendiente";
  return (
    <>
      <div className="drawer-content">
        <Badge>{status}</Badge>
        <h2>{a.title}</h2>
        <Person name={c.name} sub={c.district} />
        <div className="detail-grid">
          <span>
            <small>Fecha</small>
            <span>{dateLabel(a.start)}</span>
          </span>
          <span>
            <small>Horario</small>
            <span>
              {a.start.slice(11, 16)} – {a.end.slice(11, 16)}
            </span>
          </span>
          <span>
            <small>Responsable</small>
            <span>{a.owner}</span>
          </span>
          <span>
            <small>Préstamo</small>
            <span>{a.loanId || "Sin relación financiera"}</span>
          </span>
          <span className="span-two">
            <small>Dirección</small>
            <span>
              {c.address} · {c.district}
            </span>
          </span>
        </div>
        <p className="muted">{a.notes || "Sin notas todavía."}</p>
        {a.amount && (
          <div className="payment-summary">
            <small>Importe prometido</small>
            <strong>{money(a.amount)}</strong>
          </div>
        )}
        <div className="button-row">
          <Button onClick={() => open({ type: "client", id: c.id })}>
            Ver cliente
          </Button>
          <Button
            onClick={() =>
              window.open(mapsUrl(c), "_blank", "noopener,noreferrer")
            }
          >
            <MapPin size={16} />
            Abrir Google Maps
          </Button>
          {a.loanId && can(role, "write") && (
            <Button onClick={() => open({ type: "payment", loanId: a.loanId })}>
              Registrar pago
            </Button>
          )}
        </div>
        {a.type === "promesa" && can(role, "write") && (
          <section className="panel-section">
            <SectionTitle
              title="Pagos vinculados"
              sub="Un pago no se aplica a dos compromisos distintos."
            />
            {payments
              .filter((p) => p.loanId === a.loanId && !p.reversed)
              .map((p) => (
                <div className="detail-row" key={p.id}>
                  <span>
                    <strong>{money(p.amount)}</strong>
                    <small>{p.id}</small>
                  </span>
                  <Button
                    variant="small"
                    disabled={a.linkedPayments?.includes(p.id)}
                    onClick={() => {
                      try {
                        run({
                          type: "promise.link",
                          id,
                          payments: [...(a.linkedPayments ?? []), p.id],
                        });
                        notice(
                          "Pago vinculado; el cumplimiento está actualizado.",
                        );
                      } catch (e) {
                        notice((e as Error).message);
                      }
                    }}
                  >
                    {a.linkedPayments?.includes(p.id)
                      ? "Vinculado"
                      : "Vincular pago"}
                  </Button>
                </div>
              ))}
            {!payments.some((p) => p.loanId === a.loanId && !p.reversed) && (
              <p className="muted">
                Todavía no hay pagos disponibles para vincular.
              </p>
            )}
          </section>
        )}
      </div>
      <PanelFooter>
        {a.status === "pendiente" && can(role, "write") && (
          <>
            <Button
              onClick={() =>
                open({
                  type: "confirm",
                  data: {
                    title: "Cancelar actividad",
                    text: "La actividad se conserva en el historial.",
                    reason: true,
                    command: {
                      type: "activity.status",
                      id,
                      status: "cancelada",
                      notes: "",
                    },
                  },
                })
              }
            >
              Cancelar actividad
            </Button>
            <Button onClick={() => open({ type: "activity-edit", id })}>
              Editar
            </Button>
            {a.type !== "promesa" && (
              <Button
                variant="primary"
                onClick={() =>
                  open({
                    type: "confirm",
                    data: {
                      title: "Completar actividad",
                      text: "Anota el resultado. Completar una visita no registra un pago.",
                      reason: true,
                      command: {
                        type: "activity.status",
                        id,
                        status: "completada",
                        notes: "",
                      },
                    },
                  })
                }
              >
                Completar
              </Button>
            )}
          </>
        )}
      </PanelFooter>
    </>
  );
}
function mapsUrl(c: Client) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      c.location?.confirmed
        ? `${c.location.lat},${c.location.lng}`
        : `${c.address}, ${c.district}, Lima, Perú`,
    )
  );
}
function LocationForm({ id }: { id: string }) {
  const { state, run, open, role, notice } = useDemo();
  const c = state.clients.find((x) => x.id === id)!;
  const [address, setAddress] = useState(c.address);
  const [lat, setLat] = useState(String(c.location?.lat ?? ""));
  const [lng, setLng] = useState(String(c.location?.lng ?? ""));
  const [confirmed, setConfirmed] = useState(c.location?.confirmed ?? false);
  const [error, setError] = useState("");
  const save = (confirm: boolean) => {
    try {
      if (
        confirm &&
        (!Number.isFinite(Number(lat)) ||
          !Number.isFinite(Number(lng)) ||
          !lat ||
          !lng ||
          Number(lat) < -90 ||
          Number(lat) > 90 ||
          Number(lng) < -180 ||
          Number(lng) > 180 ||
          !confirmed)
      )
        throw new Error(
          "Revisa las coordenadas y marca la confirmación manual del punto.",
        );
      run({
        type: "client.save",
        client: {
          ...c,
          address,
          location:
            lat && lng
              ? { lat: Number(lat), lng: Number(lng), confirmed: confirm }
              : undefined,
        },
      });
      notice(
        confirm
          ? "Ubicación confirmada manualmente."
          : "Ubicación guardada como pendiente.",
      );
      open({ type: "client", id });
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      <form
        className="panel-form"
        onSubmit={(e) => {
          e.preventDefault();
          save(true);
        }}
      >
        <div className="drawer-content">
          <div className="location-preview">
            <img
              src="/fachada-ejemplo.svg"
              alt="Referencia ilustrada ficticia"
            />
            <Badge tone="neutral">Imagen ilustrativa</Badge>
          </div>
          <Button
            onClick={() => open({ type: "document-new", clientId: id })}
            disabled={!can(role, "write")}
          >
            <UploadSimple size={16} />
            Añadir foto de casa
          </Button>
          <Field label="Dirección">
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setConfirmed(false);
              }}
              disabled={!can(role, "write")}
            />
          </Field>
          <div
            className="schematic-map"
            aria-label="Plano ilustrativo, sin geocodificación real"
          >
            <div className="map-road r1" />
            <div className="map-road r2" />
            <div className="map-road r3" />
            <span className="map-pin">
              <MapPin size={30} weight="fill" />
            </span>
            <span className="map-caption">
              Punto de ejemplo · plano ilustrativo
            </span>
          </div>
          <div className="form-grid">
            <Field label="Latitud">
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => {
                  setLat(e.target.value);
                  setConfirmed(false);
                }}
                disabled={!can(role, "write")}
              />
            </Field>
            <Field label="Longitud">
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => {
                  setLng(e.target.value);
                  setConfirmed(false);
                }}
                disabled={!can(role, "write")}
              />
            </Field>
          </div>
          <div className="button-row">
            <Button
              disabled={!address || !can(role, "write")}
              onClick={() => {
                setLat("-12.1200");
                setLng("-77.0300");
                setConfirmed(false);
                notice(
                  "Propuesta simulada. Ajusta las coordenadas y confirma el punto manualmente.",
                );
              }}
            >
              Proponer punto de ejemplo
            </Button>
            <Button
              onClick={() =>
                window.open(
                  mapsUrl({
                    ...c,
                    address,
                    location:
                      lat && lng
                        ? { lat: Number(lat), lng: Number(lng), confirmed }
                        : undefined,
                  }),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Abrir Google Maps
              <ArrowUpRight size={15} />
            </Button>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={!can(role, "write")}
            />
            Confirmo manualmente estas coordenadas
          </label>
          <div className="callout">
            <p>
              Una foto no ubica automáticamente la vivienda. Aquí se conserva la
              referencia y se confirma un punto. La propuesta de dirección está
              simulada.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(mapsUrl({ ...c, address }));
                notice("Enlace copiado.");
              } catch {
                notice(
                  "El navegador no permitió copiar. Puedes abrir el enlace en Maps.",
                );
              }
            }}
          >
            Copiar enlace
          </Button>
          <FormError message={error} />
        </div>
        <PanelFooter>
          <Button onClick={() => save(false)} disabled={!can(role, "write")}>
            Guardar pendiente
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!can(role, "write")}
          >
            Confirmar punto
          </Button>
        </PanelFooter>
      </form>
    </>
  );
}
function DocumentForm({ panel }: { panel: Panel }) {
  const { state, run, open } = useDemo();
  const { clients } = useVisible();
  const [clientId, setClientId] = useState(panel.clientId ?? "");
  const [category, setCategory] = useState(
    panel.loanId ? "Comprobante" : "Foto de casa",
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setError("");
        setBusy(true);
        try {
          if (!file || !clientId)
            throw new Error("Elige un archivo y su cliente.");
          if (file.size > 10 * 1024 * 1024)
            throw new Error(
              "El archivo supera los 10 MB. Elige uno más pequeño.",
            );
          if (
            ![
              "image/jpeg",
              "image/png",
              "image/webp",
              "application/pdf",
            ].includes(file.type)
          )
            throw new Error("Se admiten JPG, PNG, WebP y PDF.");
          const id = newId("DOC");
          await putFile(id, file);
          run({
            type: "doc.save",
            doc: {
              id,
              clientId,
              loanId: panel.loanId,
              name: file.name,
              category,
              size: file.size,
              mime: file.type,
              created: state.business.today,
            },
          });
          open({ type: "document", id });
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="drawer-content">
        <Field label="Cliente" required>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Seleccionar cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["Foto de casa", "Contrato", "DNI", "Comprobante", "Otro"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </Field>
        <label className="upload-zone">
          <UploadSimple size={34} />
          <strong>{file ? file.name : "Selecciona tu archivo"}</strong>
          <span>JPG, PNG, WebP o PDF · hasta 10 MB</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <FormError message={error} />
      </div>
      <PanelFooter>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Guardando archivo..." : "Vincular documento"}
        </Button>
      </PanelFooter>
    </form>
  );
}
function DocumentDetail({ id }: { id: string }) {
  const { state, open, role, run, notice } = useDemo();
  const { documents } = useVisible();
  const d = documents.find((x) => x.id === id);
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!d) return;
    let url = "";
    let stopped = false;
    if (d.asset) setSrc(d.asset);
    else
      getFile(id)
        .then((file) => {
          if (stopped) return;
          if (file) {
            url = URL.createObjectURL(file);
            setSrc(url);
          } else
            setError(
              "El archivo no está disponible en este navegador. Puedes volver a cargarlo.",
            );
        })
        .catch(() => setError("No se pudo abrir el almacenamiento local."));
    return () => {
      stopped = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, d?.asset]);
  if (!d) return <Empty title="Documento no disponible" />;
  return (
    <>
      <div className="drawer-content">
        <Badge tone="neutral">{d.category}</Badge>
        <h3>{d.name}</h3>
        <p className="muted">
          {state.clients.find((c) => c.id === d.clientId)?.name} ·{" "}
          {dateLabel(d.created, true)}
        </p>
        {src ? (
          d.mime.startsWith("image") ? (
            <img className="file-preview" src={src} alt={d.name} />
          ) : (
            <iframe className="pdf-preview" title={d.name} src={src} />
          )
        ) : (
          <Empty title={error || "Cargando archivo..."} />
        )}
        <Field label="Categoría">
          <select
            value={d.category}
            disabled={!can(role, "write")}
            onChange={(e) => {
              try {
                run({
                  type: "doc.save",
                  doc: { ...d, category: e.target.value },
                });
                notice("Categoría actualizada.");
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            {["Foto de casa", "Contrato", "DNI", "Comprobante", "Otro"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </Field>
        <span className="muted">
          {(d.size / 1024).toFixed(1)} KB · Archivo local de presentación
        </span>
      </div>
      <PanelFooter>
        {can(role, "write") && (
          <Button
            onClick={() =>
              open({
                type: "confirm",
                data: {
                  title: "Retirar documento de la demo",
                  text: "Se quitará su referencia del expediente ficticio.",
                  command: { type: "doc.remove", id },
                },
              })
            }
          >
            Retirar
          </Button>
        )}
        <Button
          variant="primary"
          disabled={!src}
          onClick={async () => {
            try {
              if (d.asset) {
                const link = document.createElement("a");
                link.href = d.asset;
                link.download = d.name + ".svg";
                link.click();
              } else {
                const file = await getFile(id);
                if (!file) throw new Error("Archivo no disponible.");
                saveBlob(file, d.name);
              }
            } catch (e) {
              notice((e as Error).message);
            }
          }}
        >
          <DownloadSimple size={16} />
          Descargar
        </Button>
      </PanelFooter>
    </>
  );
}
function ReportPanel({ panel }: { panel: Panel }) {
  const { state, notice } = useDemo();
  const { loans } = useVisible();
  const kind = (panel.data?.kind ?? "Cartera activa") as ReportKind;
  const from = String(panel.data?.from ?? "2026-10-01");
  const to = String(panel.data?.to ?? state.business.today);
  const clientId = String(panel.data?.clientId ?? "");
  const data = reportData(state, loans, kind, from, to, clientId);
  return (
    <>
      <div className="drawer-content">
        <SectionTitle
          title={kind}
          sub={`Corte: ${dateLabel(state.business.today)} · ${data.rows.length} registros`}
        />
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
              {data.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!data.rows.length && <Empty />}
        </div>
      </div>
      <PanelFooter>
        <Button onClick={() => downloadCsv(kind, data.headers, data.rows)}>
          Descargar CSV
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            downloadPdf(
              kind,
              data.headers,
              data.rows,
              `Corte ${state.business.today} · período ${from} a ${to}`,
            ).catch(() =>
              notice("No se pudo generar el PDF. Puedes reintentar."),
            )
          }
        >
          Descargar PDF
        </Button>
      </PanelFooter>
    </>
  );
}
function reminderRows(state: State, loans: Loan[], id?: string) {
  const rule = state.reminders.find((r) => r.id === id);
  const today = state.business.today;
  return loans
    .filter((l) => l.status === "activo")
    .flatMap((l) =>
      currentInstallments(l)
        .filter(
          (i) =>
            remaining(i) > 0 &&
            (!rule || rule.days === -1
              ? i.due < today
              : i.due === addDays(today, rule.days)),
        )
        .map((i) => [
          state.clients.find((c) => c.id === l.clientId)?.name ?? "",
          l.id,
          String(i.number),
          i.due,
          money(remaining(i)),
        ]),
    );
}
function MailPreview({ panel }: { panel: Panel }) {
  const { state, run, open, role } = useDemo();
  const { loans } = useVisible();
  const [ruleId, setRuleId] = useState(
    panel.id ?? state.reminders.find((r) => r.active)?.id ?? "",
  );
  const [result, setResult] = useState<"Aceptado" | "Fallido" | "Desconocido">(
    state.scenario === "envio" ? "Fallido" : "Aceptado",
  );
  const [error, setError] = useState("");
  const rule = state.reminders.find((r) => r.id === ruleId);
  const rows =
    (panel.data?.rows as string[][]) ?? reminderRows(state, loans, ruleId);
  return (
    <>
      <div className="drawer-content">
        <Field label="Regla y destinatario">
          <select value={ruleId} onChange={(e) => setRuleId(e.target.value)}>
            {state.reminders.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.recipient}
              </option>
            ))}
          </select>
        </Field>
        <div className="mail-paper">
          <div className="mail-meta">
            <span>Para</span>
            <strong>{rule?.recipient}</strong>
            <span>Asunto</span>
            <strong>
              {rule?.name} · {state.business.today}
            </strong>
          </div>
          <hr />
          <h2>Tu cartera, al día.</h2>
          <p>
            Este es el resumen de cobranza al {dateLabel(state.business.today)}.{" "}
            {rows.length} registros requieren revisión.
          </p>
          <div className="simple-table-wrap">
            <table className="simple-table">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((v, j) => (
                      <td key={j}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p>
                Sin cuotas relevantes.{" "}
                {rule?.skipEmpty
                  ? "La regla omitirá este reporte."
                  : "Se preparará un reporte vacío."}
              </p>
            )}
          </div>
          <p className="mail-signature">
            Mavric · Presentación con datos ficticios
          </p>
        </div>
        {can(role, "manage") && (
          <Field label="Resultado del proveedor de ejemplo">
            <select
              value={result}
              onChange={(e) => setResult(e.target.value as typeof result)}
            >
              <option>Aceptado</option>
              <option>Fallido</option>
              <option>Desconocido</option>
            </select>
          </Field>
        )}
        <FormError message={error} />
      </div>
      <PanelFooter>
        <Badge tone="neutral">Envío simulado</Badge>
        <Button
          variant="primary"
          disabled={!can(role, "manage") || !rule?.active}
          onClick={() => {
            try {
              const next = run({ type: "mail", ruleId, result, rows });
              open({ type: "mail-detail", id: next.mails[0].id });
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Simular envío
        </Button>
      </PanelFooter>
    </>
  );
}
function MailDetail({ id }: { id: string }) {
  const { state, run, open, role } = useDemo();
  const m = state.mails.find((x) => x.id === id)!;
  const [error, setError] = useState("");
  return (
    <>
      <div className="drawer-content">
        <Badge>
          {m.status === "Aceptado" ? "Aceptado por proveedor" : m.status}
        </Badge>
        <h3>{m.subject}</h3>
        <div className="detail-grid">
          <span>
            <small>Destinatario</small>
            <span>{m.recipient}</span>
          </span>
          <span>
            <small>Intentos</small>
            <span>{m.attempts}</span>
          </span>
          <span>
            <small>Fecha</small>
            <span>{dateLabel(m.date, true)}</span>
          </span>
        </div>
        {m.error && (
          <div className="callout">
            <p>{m.error}</p>
          </div>
        )}
        <p className="muted">
          Un resultado aceptado no significa entregado ni leído. No se enviaron
          correos reales.
        </p>
        <FormError message={error} />
      </div>
      <PanelFooter>
        {can(role, "manage") && m.status === "Desconocido" && (
          <Button
            variant="primary"
            onClick={() => {
              try {
                run({ type: "mail.resolve", id, accepted: true });
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Consultar resultado simulado
          </Button>
        )}
        {can(role, "manage") && m.status === "Fallido" && (
          <Button
            variant="primary"
            onClick={() => {
              try {
                const rule = state.reminders.find((r) => r.id === m.ruleId)!;
                const next = run({
                  type: "mail",
                  ruleId: rule.id,
                  result: "Aceptado",
                  rows: reminderRows(state, state.loans, rule.id),
                  retry: id,
                });
                open({ type: "mail-detail", id: next.mails[0].id });
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Simular reintento
          </Button>
        )}
      </PanelFooter>
    </>
  );
}
function CreditForm({ panel }: { panel: Panel }) {
  const { state, run, open } = useDemo();
  const c = state.clients.find((x) => x.id === panel.clientId)!;
  const key = useRef(newId("CRE"));
  return (
    <EditForm
      defaults={{
        loanId: "",
        amount: String(c.credit),
        operation: "apply",
        reason: "",
      }}
      fields={[
        {
          name: "operation",
          label: "Operación",
          type: "select",
          options: [
            { value: "apply", label: "Aplicar a un préstamo" },
            { value: "refund", label: "Registrar devolución realizada" },
          ],
        },
        {
          name: "amount",
          label: "Importe (S/)",
          type: "number",
          required: true,
          min: 0,
        },
        {
          name: "loanId",
          label: "Préstamo para aplicación",
          type: "select",
          wide: true,
          options: [
            { value: "", label: "Seleccionar, si se aplica a deuda" },
            ...state.loans
              .filter((l) => l.clientId === c.id && l.status === "activo")
              .map((l) => ({ value: l.id, label: l.id })),
          ],
        },
        {
          name: "reason",
          label: "Motivo / referencia",
          type: "textarea",
          required: true,
          wide: true,
        },
      ]}
      schema={yup.object({
        amount: positive("Importe"),
        reason: requiredText("motivo"),
      })}
      label="Confirmar operación"
      extra={
        <div className="callout">
          <strong>Saldo a favor disponible: {money(c.credit)}</strong>
          <p>
            Aplicarlo no registra otro ingreso. La devolución requiere que el
            dueño confirme una entrega ya realizada.
          </p>
        </div>
      }
      onSave={(v) => {
        run({
          type: "credit",
          clientId: c.id,
          loanId: v.loanId,
          amount: Number(v.amount),
          key: key.current,
          reason: v.reason,
          refund: v.operation === "refund",
        });
        open({ type: "client", id: c.id });
      }}
    />
  );
}
function ConfigurationForm({ panel }: { panel: Panel }) {
  const { state, run, close, notice } = useDemo();
  const fields: FormField[] = [];
  let defaults: Values = {};
  let schema: yup.AnyObjectSchema | undefined;
  let handler: (v: Values) => void = () => {};
  if (panel.type.startsWith("rate-")) {
    const r = state.rates.find((r) => r.id === panel.id);
    defaults = {
      name: r?.name ?? "",
      min: String(r?.min ?? ""),
      max: String(r?.max ?? ""),
      tea: String(r?.tea ?? 18),
      active: String(r?.active ?? true),
    };
    fields.push(
      { name: "name", label: "Nombre de la regla", required: true, wide: true },
      {
        name: "min",
        label: "Capital mínimo (S/)",
        type: "number",
        required: true,
      },
      {
        name: "max",
        label: "Capital máximo (S/)",
        type: "number",
        required: true,
      },
      {
        name: "tea",
        label: "TEA ficticia (%)",
        type: "number",
        required: true,
      },
      { name: "active", label: "Regla activa", type: "checkbox" },
    );
    schema = yup.object({
      name: requiredText("nombre"),
      min: yup.number().min(0).required(),
      max: positive("Máximo"),
      tea: yup.number().min(0).required(),
    });
    handler = (v) =>
      run({
        type: "rate.save",
        rate: {
          id: r?.id ?? newId("TAS"),
          name: v.name,
          min: Number(v.min),
          max: Number(v.max),
          tea: Number(v.tea),
          active: v.active === "true",
        },
      });
  } else if (panel.type.startsWith("reminder-")) {
    const r = state.reminders.find((r) => r.id === panel.id);
    defaults = {
      name: r?.name ?? "",
      days: String(r?.days ?? 7),
      hour: r?.hour ?? "08:00",
      recipient: r?.recipient ?? state.business.email,
      active: String(r?.active ?? true),
      skipEmpty: String(r?.skipEmpty ?? true),
    };
    fields.push(
      { name: "name", label: "Nombre", required: true, wide: true },
      {
        name: "days",
        label: "Anticipación",
        type: "select",
        options: [
          { value: "7", label: "7 días antes" },
          { value: "3", label: "3 días antes" },
          { value: "1", label: "1 día antes" },
          { value: "0", label: "Vence hoy" },
          { value: "-1", label: "Resumen de mora" },
        ],
      },
      { name: "hour", label: "Hora de Lima", type: "time", required: true },
      {
        name: "recipient",
        label: "Correo del dueño",
        type: "email",
        required: true,
        wide: true,
      },
      { name: "active", label: "Regla activa", type: "checkbox" },
      {
        name: "skipEmpty",
        label: "Omitir si no hay registros",
        type: "checkbox",
      },
    );
    schema = yup.object({
      name: requiredText("nombre"),
      recipient: yup.string().email("Escribe un correo válido.").required(),
      hour: requiredText("hora"),
    });
    handler = (v) =>
      run({
        type: "reminder.save",
        reminder: {
          id: r?.id ?? newId("REC"),
          name: v.name,
          days: Number(v.days),
          hour: v.hour,
          recipient: v.recipient,
          active: v.active === "true",
          skipEmpty: v.skipEmpty === "true",
        },
      });
  } else if (panel.type.startsWith("user-")) {
    const u = state.users.find((u) => u.id === panel.id);
    defaults = {
      name: u?.name ?? "",
      role: u?.role ?? "Cobrador",
      active: String(u?.active ?? true),
    };
    fields.push(
      { name: "name", label: "Nombre del usuario", wide: true, required: true },
      {
        name: "role",
        label: "Rol",
        type: "select",
        options: options(["Dueño", "Jefe", "Cobrador", "Consulta"]),
      },
      { name: "active", label: "Usuario activo", type: "checkbox" },
    );
    schema = yup.object({ name: requiredText("nombre") });
    handler = (v) =>
      run({
        type: "user.save",
        user: {
          id: u?.id ?? newId("USR"),
          name: v.name,
          role: v.role as Role,
          active: v.active === "true",
        },
      });
  } else if (panel.type === "business") {
    defaults = { name: state.business.name, email: state.business.email };
    fields.push(
      { name: "name", label: "Nombre del negocio", required: true },
      {
        name: "email",
        label: "Correo del dueño",
        type: "email",
        required: true,
      },
    );
    schema = yup.object({
      name: requiredText("nombre"),
      email: yup.string().email().required(),
    });
    handler = (v) =>
      run({
        type: "business",
        business: { ...state.business, name: v.name, email: v.email },
      });
  } else if (panel.type === "assign") {
    const client = state.clients.find((c) => c.id === panel.clientId);
    defaults = {
      clientId: client?.id ?? "",
      owner: client?.owner ?? "Mateo Ruiz",
      move: "false",
    };
    fields.push(
      {
        name: "clientId",
        label: "Cliente",
        type: "select",
        required: true,
        wide: true,
        options: [
          { value: "", label: "Seleccionar cliente" },
          ...state.clients.map((c) => ({ value: c.id, label: c.name })),
        ],
      },
      {
        name: "owner",
        label: "Nuevo responsable",
        type: "select",
        required: true,
        wide: true,
        options: options(
          state.users.filter((u) => u.active).map((u) => u.name),
        ),
      },
      {
        name: "move",
        label: "Transferir también sus actividades pendientes",
        type: "checkbox",
        wide: true,
      },
    );
    schema = yup.object({ clientId: requiredText("cliente") });
    handler = (v) => {
      const c = state.clients.find((c) => c.id === v.clientId)!;
      run({ type: "client.save", client: { ...c, owner: v.owner } });
      if (v.move === "true")
        for (const a of state.activities.filter(
          (a) => a.clientId === c.id && a.status === "pendiente",
        ))
          run({ type: "activity.save", activity: { ...a, owner: v.owner } });
    };
  }
  return (
    <EditForm
      defaults={defaults}
      fields={fields}
      schema={schema}
      onSave={(v) => {
        handler(v);
        notice("Cambios guardados en la presentación.");
        close();
      }}
    />
  );
}
function ConfirmPanel({ panel }: { panel: Panel }) {
  const { state, run, close, open, notice } = useDemo();
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(state.business.today);
  const [error, setError] = useState("");
  return (
    <>
      <form
        className="panel-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const command = structuredClone(panel.data?.command) as Command;
            if (panel.data?.reason && !reason.trim())
              throw new Error("Describe el resultado o motivo.");
            if ("notes" in command && panel.data?.reason)
              command.notes = reason;
            if ("date" in command && panel.data?.date) command.date = date;
            run(command);
            notice("Operación confirmada.");
            if (panel.data?.next) open(panel.data.next as Panel);
            else close();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <div className="drawer-content">
          <h3>{String(panel.data?.title ?? "Confirmar operación")}</h3>
          <p>{String(panel.data?.text ?? "Revisa antes de continuar.")}</p>
          {Boolean(panel.data?.date) && (
            <Field label="Fecha de entrega realizada">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          )}
          {Boolean(panel.data?.reason) && (
            <Field label="Resultado / motivo" required>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          )}
          <FormError message={error} />
        </div>
        <PanelFooter>
          <Button onClick={close}>Cancelar</Button>
          <Button type="submit" variant="primary">
            Confirmar
          </Button>
        </PanelFooter>
      </form>
    </>
  );
}
function FilterForm({ panel }: { panel: Panel }) {
  const { state, close } = useDemo();
  const mode = String(panel.data?.mode);
  const initial = panel.data?.values as Values;
  const statuses =
    mode === "clients"
      ? ["Todos", "Al día", "En mora", "Sin deuda"]
      : [
          "Todos",
          "Al día",
          "En mora",
          "Vence hoy",
          "Borrador",
          "Aprobado",
          "Liquidado",
          "Cancelado",
        ];
  return (
    <EditForm
      defaults={initial}
      fields={[
        {
          name: "status",
          label: "Estado",
          type: "select",
          options: options(statuses),
        },
        {
          name: "owner",
          label: "Responsable",
          type: "select",
          options: options([
            "Todos",
            ...state.users.filter((u) => u.active).map((u) => u.name),
          ]),
        },
        ...(mode === "clients"
          ? [
              {
                name: "district",
                label: "Distrito",
                type: "select",
                options: options([
                  "Todos",
                  "Miraflores",
                  "San Isidro",
                  "Surco",
                  "San Borja",
                  "La Molina",
                  "Barranco",
                ]),
              },
            ]
          : []),
      ]}
      label="Aplicar filtros"
      onSave={(v) => {
        (panel.data?.apply as (v: Values) => void)(v);
        close();
      }}
      extra={
        <Button
          variant="ghost"
          onClick={() => {
            (panel.data?.apply as (v: Values) => void)({
              status: "Todos",
              owner: "Todos",
              district: "Todos",
            });
            close();
          }}
        >
          Limpiar filtros
        </Button>
      }
    />
  );
}
function GlobalSearch() {
  const { open } = useDemo();
  const { clients, loans } = useVisible();
  const [q, setQ] = useState("");
  const normal = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const matches = clients.filter((c) =>
    normal(c.name + c.dni + c.phone).includes(normal(q)),
  );
  const matchedLoans = loans.filter((l) =>
    l.id.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="drawer-content">
      <Field label="Buscar cliente, DNI, teléfono o préstamo">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escribe para encontrar..."
        />
      </Field>
      {matches.slice(0, 12).map((c) => (
        <button
          className="detail-row"
          key={c.id}
          onClick={() => open({ type: "client", id: c.id })}
        >
          <Person name={c.name} sub={"DNI " + c.dni} />
          <ArrowRight size={17} />
        </button>
      ))}
      {q &&
        matchedLoans.map((l) => (
          <button
            className="detail-row"
            key={l.id}
            onClick={() => open({ type: "loan", id: l.id })}
          >
            <span>
              <strong>{l.id}</strong>
              <small>{clients.find((c) => c.id === l.clientId)?.name}</small>
            </span>
            <ArrowRight size={17} />
          </button>
        ))}
      {!matches.length && !matchedLoans.length && (
        <Empty
          action={
            <Button onClick={() => open({ type: "client-new" })}>
              Crear cliente
            </Button>
          }
        />
      )}
    </div>
  );
}
function Notifications() {
  const { state, open } = useDemo();
  const { loans, activities, clients } = useVisible();
  const due = loans
    .filter((l) => l.status === "activo")
    .flatMap((l) =>
      l.installments
        .filter((i) => remaining(i) > 0 && i.due <= state.business.today)
        .map((i) => ({ l, i })),
    );
  return (
    <div className="drawer-content">
      <SectionTitle title="Vencimientos por atender" />
      {due.slice(0, 12).map(({ l, i }) => (
        <button
          key={i.id}
          className="detail-row"
          onClick={() =>
            open({ type: "installment", loanId: l.id, installmentId: i.id })
          }
        >
          <span>
            <strong>{clients.find((c) => c.id === l.clientId)?.name}</strong>
            <small>
              Cuota {i.number} · {dateLabel(i.due, true)}
            </small>
          </span>
          <strong>{money(remaining(i))}</strong>
        </button>
      ))}
      {!due.length && <Empty title="Sin vencimientos por atender" />}
      <SectionTitle title="Próximas actividades" />
      {activities
        .filter((a) => a.status === "pendiente")
        .map((a) => (
          <button
            className="detail-row"
            key={a.id}
            onClick={() => open({ type: "activity-detail", id: a.id })}
          >
            <span>
              <strong>{a.title}</strong>
              <small>{dateLabel(a.start, true)}</small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))}
    </div>
  );
}
function ResetPanel({ panel }: { panel: Panel }) {
  const { reset, close, state } = useDemo();
  const [scenario, setScenario] = useState<State["scenario"]>(
    panel.type === "reset" ? "normal" : state.scenario,
  );
  return (
    <>
      <div className="drawer-content">
        <div className="callout">
          <strong>Se reemplazarán los cambios ficticios</strong>
          <p>
            Clientes, préstamos, pagos y gestiones volverán al escenario de
            ejemplo. La apariencia elegida se conserva.
          </p>
        </div>
        {panel.type === "scenario" && (
          <Field label="Escenario">
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as State["scenario"])}
            >
              <option value="normal">Cartera de ejemplo</option>
              <option value="mora">Cartera con mora</option>
              <option value="vacio">Sin registros</option>
              <option value="envio">Envío fallido</option>
              <option value="incierto">Pago con respuesta incierta</option>
            </select>
          </Field>
        )}
      </div>
      <PanelFooter>
        <Button onClick={close}>Cancelar</Button>
        <Button variant="primary" onClick={() => reset(scenario)}>
          Restaurar escenario
        </Button>
      </PanelFooter>
    </>
  );
}
