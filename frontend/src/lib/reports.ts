import type { State, Loan } from "@/domain/types";
import {
  money,
  remaining,
  principalLeft,
  condition,
  currentInstallments,
  daysLate,
} from "@/domain/finance";
export type ReportKind =
  | "Cartera activa"
  | "Mora"
  | "Vencimientos"
  | "Recaudación"
  | "Estado de cuenta";
export function reportData(
  state: State,
  loans: Loan[],
  kind: ReportKind,
  from = "2026-10-01",
  to = state.business.today,
  clientId = "",
) {
  const subset = loans.filter((l) => !clientId || l.clientId === clientId);
  const name = (id: string) =>
    state.clients.find((c) => c.id === id)?.name ?? "Cliente";
  const today = state.business.today;
  if (kind === "Cartera activa")
    return {
      headers: [
        "Cliente",
        "Préstamo",
        "Capital original",
        "Capital pendiente",
        "Condición",
      ],
      rows: subset
        .filter((l) => l.status === "activo")
        .map((l) => [
          name(l.clientId),
          l.id,
          money(l.principal),
          money(principalLeft(l)),
          condition(l, today),
        ]),
    };
  if (kind === "Recaudación") {
    const ids = new Set(subset.map((l) => l.id));
    const rows = state.payments
      .filter((p) => ids.has(p.loanId) && p.date >= from && p.date <= to)
      .map((p) => [
        name(state.loans.find((l) => l.id === p.loanId)!.clientId),
        p.id,
        p.date,
        p.method,
        p.source === "credit" ? "Aplicación de crédito" : money(p.amount),
        p.reversed ? "Reversado" : "Registrado",
      ]);
    for (const p of state.payments.filter(
      (p) =>
        ids.has(p.loanId) &&
        p.reversed &&
        p.reversedOn! >= from &&
        p.reversedOn! <= to,
    )) {
      rows.push([
        name(state.loans.find((l) => l.id === p.loanId)!.clientId),
        "REV · " + p.id,
        p.reversedOn!,
        p.method,
        p.source === "credit" ? "Restitución de crédito" : money(-p.amount),
        "Reverso",
      ]);
    }
    for (const c of state.credits.filter(
      (c) =>
        c.date >= from &&
        c.date <= to &&
        subset.some((l) => l.clientId === c.clientId),
    ))
      rows.push([
        name(c.clientId),
        c.id,
        c.date,
        "Devolución",
        money(-c.amount),
        "Salida",
      ]);
    return {
      headers: [
        "Cliente",
        "Movimiento",
        "Fecha",
        "Método",
        "Importe",
        "Estado",
      ],
      rows,
    };
  }
  const rows = subset
    .filter(
      (l) =>
        l.status === "activo" ||
        (kind === "Estado de cuenta" && l.status === "liquidado"),
    )
    .flatMap((l) =>
      currentInstallments(l)
        .filter(
          (i) =>
            kind === "Estado de cuenta" ||
            (remaining(i) > 0 &&
              (kind === "Mora" ? i.due < today : i.due >= from && i.due <= to)),
        )
        .map((i) => [
          name(l.clientId),
          l.id,
          String(i.number),
          i.due,
          money(remaining(i)),
          String(daysLate(i.due, today)),
        ]),
    );
  return {
    headers: [
      "Cliente",
      "Préstamo",
      "Cuota",
      "Vencimiento",
      "Pendiente",
      "Días de atraso",
    ],
    rows,
  };
}
