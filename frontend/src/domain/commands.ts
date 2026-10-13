import type {
  State,
  Role,
  Client,
  Loan,
  Activity,
  Rate,
  Reminder,
  User,
  Doc,
  Payment,
} from "./types";
import {
  schedule,
  planPayment,
  cents,
  moneyValue,
  remaining,
  principalLeft,
  loanLeft,
  addMonths,
  currentInstallments,
} from "./finance";
export type Command =
  | { type: "client.save"; client: Client }
  | { type: "client.archive"; id: string; archived: boolean }
  | { type: "loan.save"; loan: Loan }
  | {
      type: "loan.approve" | "loan.disburse" | "loan.cancel";
      id: string;
      date?: string;
    }
  | {
      type: "payment";
      key: string;
      loanId: string;
      amount: number;
      date: string;
      method: string;
      reference: string;
      notes: string;
      selected?: string;
      allowCredit: boolean;
      version: number;
      source?: Payment["source"];
    }
  | { type: "reverse"; id: string; reason: string }
  | {
      type: "reschedule";
      id: string;
      count: number;
      firstDue: string;
      tea: number;
      reason: string;
      version: number;
      apply: boolean;
    }
  | {
      type: "prepay";
      id: string;
      amount: number;
      reduce: "cuota" | "plazo";
      key: string;
      version: number;
    }
  | {
      type: "liquidate";
      id: string;
      amount: number;
      key: string;
      version: number;
    }
  | { type: "activity.save"; activity: Activity }
  | {
      type: "activity.status";
      id: string;
      status: Activity["status"];
      notes: string;
    }
  | { type: "promise.link"; id: string; payments: string[] }
  | { type: "doc.save"; doc: Doc }
  | { type: "doc.remove"; id: string }
  | { type: "rate.save"; rate: Rate }
  | { type: "reminder.save"; reminder: Reminder }
  | { type: "user.save"; user: User }
  | {
      type: "mail";
      ruleId: string;
      result: "Aceptado" | "Fallido" | "Desconocido";
      rows: string[][];
      retry?: string;
    }
  | { type: "mail.resolve"; id: string; accepted: boolean }
  | {
      type: "credit";
      clientId: string;
      loanId?: string;
      amount: number;
      key: string;
      reason: string;
      refund: boolean;
    }
  | { type: "business"; business: State["business"] };
export const newId = (prefix: string) =>
  prefix + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
export function can(role: Role, kind: "finance" | "write" | "manage") {
  return kind === "finance"
    ? role === "Dueño"
    : kind === "manage"
      ? role === "Dueño" || role === "Jefe"
      : role !== "Consulta";
}
export function execute(input: State, cmd: Command, role: Role): State {
  const admin = [
    "loan.approve",
    "loan.disburse",
    "loan.cancel",
    "reverse",
    "reschedule",
    "prepay",
    "liquidate",
    "rate.save",
    "business",
  ];
  if (
    !can(
      role,
      admin.includes(cmd.type)
        ? "finance"
        : [
              "client.archive",
              "user.save",
              "reminder.save",
              "mail",
              "mail.resolve",
            ].includes(cmd.type)
          ? "manage"
          : "write",
    )
  )
    throw new Error("Tu perfil no tiene permiso para esta acción.");
  const state = structuredClone(input);
  const today = state.business.today;
  const client = (id: string) => {
    const c = state.clients.find((x) => x.id === id);
    if (!c) throw new Error("El cliente ya no está disponible.");
    if (role === "Cobrador" && c.owner !== "Mateo Ruiz")
      throw new Error("Este cliente no pertenece a tu cartera.");
    return c;
  };
  const loan = (id: string) => {
    const l = state.loans.find((x) => x.id === id);
    if (!l) throw new Error("El préstamo ya no está disponible.");
    client(l.clientId);
    return l;
  };
  const audit = (entity: string) =>
    state.audit.unshift({
      id: newId("AUD"),
      date: today,
      actor: role,
      action: cmd.type,
      entity,
    });
  const ensureVersion = (l: Loan, v: number) => {
    if (l.version !== v)
      throw new Error(
        "El saldo cambió. Vuelve a revisar la distribución antes de confirmar.",
      );
  };
  const applyPayment = (
    l: Loan,
    amount: number,
    date: string,
    key: string,
    source: Payment["source"],
    method: string,
    reference: string,
    notes: string,
    selected?: string,
    allowCredit = false,
  ) => {
    const existing = state.payments.find((p) => p.key === key);
    if (existing) return existing;
    if (
      l.status !== "activo" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      date > today
    )
      throw new Error("Revisa el importe, la fecha y el estado del préstamo.");
    if (state.payments.some((p) => p.loanId === l.id && p.date > date))
      throw new Error(
        "Hay operaciones posteriores a esta fecha. El registro retroactivo requiere revisión.",
      );
    const plan = planPayment(l, amount, selected);
    if (plan.excess > 0 && !allowCredit)
      throw new Error(
        "El importe excede las cuotas seleccionadas. Elige un destino para el excedente.",
      );
    plan.allocations.forEach((a) => {
      const i = l.installments.find((x) => x.id === a.installmentId)!;
      i.paidPrincipal = moneyValue(i.paidPrincipal + a.principal);
      i.paidInterest = moneyValue(i.paidInterest + a.interest);
    });
    client(l.clientId).credit = moneyValue(
      client(l.clientId).credit + plan.excess,
    );
    const p: Payment = {
      id: newId("PAG"),
      key,
      loanId: l.id,
      amount: moneyValue(amount),
      date,
      method,
      reference,
      notes,
      allocations: plan.allocations,
      credit: plan.excess,
      reversed: false,
      loanVersion: l.version,
      source,
    };
    state.payments.unshift(p);
    l.version++;
    if (loanLeft(l) <= 0) l.status = "liquidado";
    return p;
  };
  switch (cmd.type) {
    case "client.save": {
      const c = cmd.client;
      if (!c.name.trim() || !/^\d{8}$/.test(c.dni) || (!c.phone && !c.email))
        throw new Error(
          "Completa el nombre, DNI de 8 dígitos y un medio de contacto.",
        );
      if (state.clients.some((x) => x.id !== c.id && x.dni === c.dni))
        throw new Error(
          "Este DNI ya está registrado. Busca el expediente existente.",
        );
      const index = state.clients.findIndex((x) => x.id === c.id);
      if (index >= 0) {
        client(c.id);
        state.clients[index] = c;
      } else state.clients.unshift(c);
      audit(c.id);
      break;
    }
    case "client.archive": {
      const c = client(cmd.id);
      if (
        cmd.archived &&
        (state.loans.some(
          (l) => l.clientId === c.id && l.status === "activo",
        ) ||
          c.credit > 0)
      )
        throw new Error(
          "El cliente tiene deuda o saldo a favor pendiente. Resuélvelo antes de archivar.",
        );
      c.archived = cmd.archived;
      audit(c.id);
      break;
    }
    case "loan.save": {
      const c = client(cmd.loan.clientId);
      if (c.archived)
        throw new Error("Reactiva al cliente antes de crear un préstamo.");
      const existing = state.loans.find((l) => l.id === cmd.loan.id);
      if (existing && existing.status !== "borrador")
        throw new Error(
          "Las condiciones aprobadas requieren una reprogramación.",
        );
      if (cmd.loan.firstDue <= cmd.loan.disbursed)
        throw new Error(
          "El primer vencimiento debe ser posterior al desembolso.",
        );
      if (existing)
        state.loans = state.loans.map((l) =>
          l.id === existing.id ? cmd.loan : l,
        );
      else state.loans.unshift(cmd.loan);
      audit(cmd.loan.id);
      break;
    }
    case "loan.approve": {
      const l = loan(cmd.id);
      if (l.status !== "borrador")
        throw new Error("Solo se aprueban borradores.");
      l.status = "aprobado";
      l.version++;
      audit(l.id);
      break;
    }
    case "loan.disburse": {
      const l = loan(cmd.id);
      if (l.status !== "aprobado")
        throw new Error("Primero aprueba las condiciones del préstamo.");
      if (!cmd.date || cmd.date > today || cmd.date >= l.firstDue)
        throw new Error(
          "La fecha de entrega debe ser válida, no futura y anterior a la primera cuota.",
        );
      l.disbursed = cmd.date;
      l.status = "activo";
      l.version++;
      audit(l.id);
      break;
    }
    case "loan.cancel": {
      const l = loan(cmd.id);
      if (!["borrador", "aprobado"].includes(l.status))
        throw new Error(
          "Un préstamo activo conserva su historial. Utiliza liquidación o un ajuste autorizado.",
        );
      l.status = "cancelado";
      l.version++;
      audit(l.id);
      break;
    }
    case "payment": {
      const l = loan(cmd.loanId);
      if (state.payments.some((p) => p.key === cmd.key)) return input;
      ensureVersion(l, cmd.version);
      applyPayment(
        l,
        cmd.amount,
        cmd.date,
        cmd.key,
        cmd.source ?? "cash",
        cmd.method,
        cmd.reference,
        cmd.notes,
        cmd.selected,
        cmd.allowCredit,
      );
      audit(l.id);
      break;
    }
    case "reverse": {
      const p = state.payments.find((x) => x.id === cmd.id);
      if (!p) throw new Error("Pago no encontrado.");
      const l = loan(p.loanId);
      if (p.reversed) throw new Error("Este pago ya fue reversado.");
      if (!cmd.reason.trim()) throw new Error("Escribe el motivo del reverso.");
      if (
        l.history.length ||
        p.source === "prepago" ||
        p.source === "liquidacion"
      )
        throw new Error(
          "Este pago tiene un ajuste de cronograma dependiente. Requiere una revisión financiera del dueño.",
        );
      if (p.credit > client(l.clientId).credit)
        throw new Error(
          "El crédito de este pago ya fue utilizado. Requiere revisión antes de reversar.",
        );
      p.allocations.forEach((a) => {
        const i = l.installments.find((x) => x.id === a.installmentId);
        if (!i)
          throw new Error(
            "La cuota pertenece a otra versión. Revisa el ajuste relacionado.",
          );
        i.paidPrincipal = moneyValue(i.paidPrincipal - a.principal);
        i.paidInterest = moneyValue(i.paidInterest - a.interest);
      });
      client(l.clientId).credit = moneyValue(
        client(l.clientId).credit - p.credit,
      );
      if (p.source === "credit")
        client(l.clientId).credit = moneyValue(
          client(l.clientId).credit + p.amount,
        );
      p.reversed = true;
      p.reversedOn = today;
      p.reverseReason = cmd.reason;
      l.version++;
      if (loanLeft(l) > 0) l.status = "activo";
      audit(p.id);
      break;
    }
    case "reschedule": {
      const l = loan(cmd.id);
      ensureVersion(l, cmd.version);
      if (l.status !== "activo" || !cmd.reason.trim() || cmd.firstDue <= today)
        throw new Error(
          "Indica un motivo y un primer vencimiento posterior a hoy.",
        );
      const next = schedule(
        principalLeft(l),
        cmd.tea,
        cmd.count,
        cmd.firstDue,
        l.method,
        `${l.id}-v${l.version + 1}`,
      );
      const unpaidInterest = currentInstallments(l)
        .filter((i) => i.due <= today)
        .reduce((s, i) => s + i.interest - i.paidInterest, 0);
      if (unpaidInterest > 0)
        next[0].interest = moneyValue(next[0].interest + unpaidInterest);
      if (!cmd.apply) {
        l.adjustment = {
          count: cmd.count,
          firstDue: cmd.firstDue,
          tea: cmd.tea,
          reason: cmd.reason,
          basedOn: l.version,
        };
      } else {
        l.history.push({
          version: l.version,
          date: today,
          reason: cmd.reason,
          installments: structuredClone(l.installments),
          terms: {
            tea: l.tea,
            count: l.count,
            firstDue: l.firstDue,
            method: l.method,
          },
        });
        l.installments = next;
        l.count = cmd.count;
        l.tea = cmd.tea;
        l.firstDue = cmd.firstDue;
        l.version++;
        delete l.adjustment;
      }
      audit(l.id);
      break;
    }
    case "prepay": {
      const l = loan(cmd.id);
      if (state.payments.some((p) => p.key === cmd.key)) return input;
      ensureVersion(l, cmd.version);
      const capital = principalLeft(l);
      if (cmd.amount <= 0 || cmd.amount >= capital)
        throw new Error(
          "El prepago debe ser menor al capital pendiente. Para cubrirlo todo, usa Liquidar.",
        );
      if (
        currentInstallments(l).some((i) => i.due <= today && remaining(i) > 0)
      )
        throw new Error(
          "Primero regulariza las cuotas exigibles antes de abonar a capital.",
        );
      const pending = currentInstallments(l).filter((i) => remaining(i) > 0);
      l.history.push({
        version: l.version,
        date: today,
        reason: "Prepago a capital",
        installments: structuredClone(l.installments),
        terms: {
          tea: l.tea,
          count: l.count,
          firstDue: l.firstDue,
          method: l.method,
        },
      });
      const count =
        cmd.reduce === "cuota"
          ? pending.length
          : Math.max(
              1,
              Math.ceil((pending.length * (capital - cmd.amount)) / capital),
            );
      l.installments = schedule(
        moneyValue(capital - cmd.amount),
        l.tea,
        count,
        pending[0].due,
        l.method,
        `${l.id}-v${l.version + 1}`,
      );
      l.count = count;
      l.version++;
      state.payments.unshift({
        id: newId("PAG"),
        key: cmd.key,
        loanId: l.id,
        amount: cmd.amount,
        date: today,
        method: "Abono a capital",
        reference: "DEMO",
        notes: `Reducir ${cmd.reduce}`,
        allocations: [],
        credit: 0,
        reversed: false,
        loanVersion: l.version - 1,
        source: "prepago",
      });
      audit(l.id);
      break;
    }
    case "liquidate": {
      const l = loan(cmd.id);
      if (state.payments.some((p) => p.key === cmd.key)) return input;
      ensureVersion(l, cmd.version);
      const total = moneyValue(
        principalLeft(l) +
          currentInstallments(l)
            .filter((i) => i.due <= today)
            .reduce((s, i) => s + i.interest - i.paidInterest, 0),
      );
      if (cents(total) !== cents(cmd.amount))
        throw new Error("El cálculo cambió. Revisa la liquidación nuevamente.");
      l.history.push({
        version: l.version,
        date: today,
        reason: "Liquidación anticipada: simulación convencional",
        installments: structuredClone(l.installments),
        terms: {
          tea: l.tea,
          count: l.count,
          firstDue: l.firstDue,
          method: l.method,
        },
      });
      const allocations = currentInstallments(l).map((i) => ({
        installmentId: i.id,
        principal: moneyValue(i.principal - i.paidPrincipal),
        interest: i.due <= today ? moneyValue(i.interest - i.paidInterest) : 0,
      }));
      l.installments.forEach((i) => {
        i.paidPrincipal = i.principal;
        i.paidInterest = i.interest;
      });
      l.status = "liquidado";
      l.version++;
      state.payments.unshift({
        id: newId("PAG"),
        key: cmd.key,
        loanId: l.id,
        amount: total,
        date: today,
        method: "Liquidación",
        reference: "DEMO",
        notes: "Interés exigible al corte; período convencional de demo.",
        allocations,
        credit: 0,
        reversed: false,
        loanVersion: l.version - 1,
        source: "liquidacion",
      });
      audit(l.id);
      break;
    }
    case "activity.save": {
      const a = cmd.activity;
      client(a.clientId);
      if (!a.title.trim() || a.start >= a.end)
        throw new Error("Revisa el título y el horario de la actividad.");
      if (a.type === "promesa" && (!a.loanId || !a.amount || a.amount <= 0))
        throw new Error("La promesa necesita préstamo e importe positivo.");
      const i = state.activities.findIndex((x) => x.id === a.id);
      if (i < 0) state.activities.unshift(a);
      else state.activities[i] = a;
      audit(a.id);
      break;
    }
    case "activity.status": {
      const a = state.activities.find((x) => x.id === cmd.id);
      if (!a) throw new Error("Actividad no disponible.");
      client(a.clientId);
      if (!cmd.notes.trim())
        throw new Error("Describe el resultado o motivo de la actividad.");
      a.status = cmd.status;
      a.notes = cmd.notes;
      audit(a.id);
      break;
    }
    case "promise.link": {
      const a = state.activities.find((x) => x.id === cmd.id);
      if (!a || a.type !== "promesa") throw new Error("Promesa no encontrada.");
      client(a.clientId);
      if (
        cmd.payments.some(
          (id) => state.payments.find((p) => p.id === id)?.loanId !== a.loanId,
        )
      )
        throw new Error("El pago debe pertenecer al mismo préstamo.");
      if (
        state.activities.some(
          (x) =>
            x.id !== a.id &&
            x.type === "promesa" &&
            x.status !== "cancelada" &&
            cmd.payments.some((id) => x.linkedPayments?.includes(id)),
        )
      )
        throw new Error("Ese pago ya está vinculado a otra promesa.");
      a.linkedPayments = cmd.payments;
      audit(a.id);
      break;
    }
    case "doc.save": {
      client(cmd.doc.clientId);
      state.documents = state.documents.filter((d) => d.id !== cmd.doc.id);
      state.documents.unshift(cmd.doc);
      audit(cmd.doc.id);
      break;
    }
    case "doc.remove": {
      const d = state.documents.find((x) => x.id === cmd.id);
      if (d) client(d.clientId);
      state.documents = state.documents.filter((d) => d.id !== cmd.id);
      audit(cmd.id);
      break;
    }
    case "rate.save": {
      const r = cmd.rate;
      if (r.min < 0 || r.max < r.min || r.tea < 0)
        throw new Error("Revisa los rangos y la tasa.");
      if (
        r.active &&
        state.rates.some(
          (x) => x.id !== r.id && x.active && x.min <= r.max && x.max >= r.min,
        )
      )
        throw new Error("El rango se solapa con otra regla activa.");
      state.rates = state.rates.filter((x) => x.id !== r.id);
      state.rates.push(r);
      audit(r.id);
      break;
    }
    case "reminder.save": {
      const r = cmd.reminder;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.recipient))
        throw new Error("Escribe un correo válido para el destinatario.");
      state.reminders = state.reminders.filter((x) => x.id !== r.id);
      state.reminders.push(r);
      audit(r.id);
      break;
    }
    case "user.save": {
      const u = cmd.user;
      if (!u.name.trim()) throw new Error("Escribe el nombre del usuario.");
      if (
        !u.active &&
        state.activities.some(
          (a) => a.owner === u.name && a.status === "pendiente",
        )
      )
        throw new Error(
          "Reasigna primero las actividades pendientes de este usuario.",
        );
      const others = state.users.filter((x) => x.id !== u.id);
      if (
        !(u.active && u.role === "Dueño") &&
        !others.some((x) => x.active && x.role === "Dueño")
      )
        throw new Error("Debe quedar al menos un dueño activo.");
      state.users = [...others, u];
      audit(u.id);
      break;
    }
    case "mail": {
      const rule = state.reminders.find((x) => x.id === cmd.ruleId);
      if (!rule?.active)
        throw new Error("Activa la regla antes de simular el envío.");
      const previous = cmd.retry
        ? state.mails.find((m) => m.id === cmd.retry)
        : state.mails.find(
            (m) =>
              m.ruleId === cmd.ruleId &&
              m.date === today &&
              m.status === "Aceptado",
          );
      if (previous?.status === "Aceptado")
        throw new Error(
          "Este reporte ya figura aceptado. No se genera otro envío para la misma regla y día.",
        );
      if (cmd.retry && previous?.status === "Desconocido")
        throw new Error(
          "Consulta el resultado del envío antes de reintentarlo.",
        );
      const mail = {
        id: previous?.id ?? newId("COR"),
        ruleId: rule.id,
        recipient: rule.recipient,
        subject: rule.name + " · " + today,
        date: today,
        status: cmd.rows.length
          ? cmd.result
          : rule.skipEmpty
            ? ("Omitido" as const)
            : cmd.result,
        attempts: (previous?.attempts ?? 0) + 1,
        error:
          cmd.result === "Fallido"
            ? "Fallo confirmado del proveedor de ejemplo."
            : cmd.result === "Desconocido"
              ? "Respuesta perdida. Consulta el resultado antes de reenviar."
              : "",
        rows: cmd.rows,
      };
      state.mails = state.mails.filter((m) => m.id !== mail.id);
      state.mails.unshift(mail);
      audit(mail.id);
      break;
    }
    case "mail.resolve": {
      const m = state.mails.find((x) => x.id === cmd.id);
      if (!m || m.status !== "Desconocido")
        throw new Error("Solo se consulta un envío de resultado desconocido.");
      m.status = cmd.accepted ? "Aceptado" : "Fallido";
      m.error = cmd.accepted
        ? ""
        : "El proveedor simulado confirmó que no hubo envío.";
      audit(m.id);
      break;
    }
    case "credit": {
      const c = client(cmd.clientId);
      if (
        state.credits.some((x) => x.key === cmd.key) ||
        state.payments.some((p) => p.key === cmd.key)
      )
        return input;
      if (cmd.amount <= 0 || cents(cmd.amount) > cents(c.credit))
        throw new Error("El importe supera el saldo a favor disponible.");
      if (!cmd.reason.trim())
        throw new Error("Indica el motivo de la operación.");
      if (cmd.refund) {
        if (role !== "Dueño")
          throw new Error("Solo el dueño registra devoluciones.");
        c.credit = moneyValue(c.credit - cmd.amount);
        state.credits.push({
          id: newId("DEV"),
          clientId: c.id,
          amount: cmd.amount,
          date: today,
          kind: "devolucion",
          reason: cmd.reason,
          key: cmd.key,
        });
      } else {
        const l = loan(cmd.loanId ?? "");
        if (l.clientId !== c.id)
          throw new Error("Selecciona un préstamo del mismo cliente.");
        c.credit = moneyValue(c.credit - cmd.amount);
        applyPayment(
          l,
          cmd.amount,
          today,
          cmd.key,
          "credit",
          "Saldo a favor",
          "",
          cmd.reason,
          undefined,
          false,
        );
      }
      audit(c.id);
      break;
    }
    case "business": {
      state.business = cmd.business;
      audit("negocio");
      break;
    }
  }
  return state;
}
