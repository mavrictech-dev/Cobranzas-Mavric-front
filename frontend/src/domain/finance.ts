import type { Installment, Loan, Payment, State, Activity } from "./types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/es";
dayjs.extend(utc);
dayjs.extend(timezone);
export const cents = (n: number) => Math.round((n + Number.EPSILON) * 100);
export const moneyValue = (n: number) => cents(n) / 100;
export const money = (n: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(n);
export const dateLabel = (value: string, short = false) =>
  value
    ? dayjs
        .utc(value.slice(0, 10) + "T12:00:00Z")
        .tz("America/Lima")
        .locale("es")
        .format(short ? "DD MMM" : "DD [de] MMMM [de] YYYY")
    : "—";
export const daysLate = (due: string, today: string) =>
  Math.max(
    0,
    Math.floor(
      (Date.parse(today + "T12:00:00Z") - Date.parse(due + "T12:00:00Z")) /
        86400000,
    ),
  );
export const addDays = (date: string, n: number) =>
  new Date(Date.parse(date + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
export function addMonths(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), Math.min(d, last)),
  )
    .toISOString()
    .slice(0, 10);
}
export function schedule(
  principal: number,
  tea: number,
  count: number,
  firstDue: string,
  method: "frances" | "simple" = "frances",
  prefix = "sim",
): Installment[] {
  if (
    !Number.isFinite(principal) ||
    principal <= 0 ||
    !Number.isFinite(tea) ||
    tea < 0 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 120 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(firstDue)
  )
    throw new Error(
      "Revisa el capital, la tasa, el plazo y la primera fecha de pago.",
    );
  const rate = Math.pow(1 + tea / 100, 1 / 12) - 1;
  let balance = cents(principal);
  const fixed =
    rate === 0
      ? balance / count
      : (balance * rate) / (1 - Math.pow(1 + rate, -count));
  return Array.from({ length: count }, (_, index) => {
    const interest =
      method === "simple"
        ? Math.round((cents(principal) * (tea / 100)) / 12)
        : Math.round(balance * rate);
    const amort =
      index === count - 1
        ? balance
        : Math.min(
            balance,
            Math.round(
              method === "simple" ? cents(principal) / count : fixed - interest,
            ),
          );
    balance -= amort;
    return {
      id: `${prefix}-${index + 1}`,
      number: index + 1,
      due: addMonths(firstDue, index),
      principal: amort / 100,
      interest: interest / 100,
      paidPrincipal: 0,
      paidInterest: 0,
    };
  });
}
export const remaining = (i: Installment) =>
  moneyValue(i.principal + i.interest - i.paidPrincipal - i.paidInterest);
export const principalLeft = (loan: Loan) =>
  moneyValue(
    loan.installments
      .filter((i) => !i.superseded)
      .reduce((sum, i) => sum + i.principal - i.paidPrincipal, 0),
  );
export const loanLeft = (loan: Loan) =>
  moneyValue(
    loan.installments
      .filter((i) => !i.superseded)
      .reduce((sum, i) => sum + remaining(i), 0),
  );
export const currentInstallments = (loan: Loan) =>
  loan.installments.filter((i) => !i.superseded);
export const overdue = (loan: Loan, today: string) =>
  moneyValue(
    currentInstallments(loan)
      .filter((i) => i.due < today)
      .reduce((sum, i) => sum + remaining(i), 0),
  );
export function condition(loan: Loan, today: string) {
  if (loan.status !== "activo")
    return loan.status === "liquidado"
      ? "Liquidado"
      : loan.status === "borrador"
        ? "Borrador"
        : loan.status === "aprobado"
          ? "Aprobado"
          : "Cancelado";
  if (overdue(loan, today) > 0) return "En mora";
  if (
    currentInstallments(loan).some((i) => i.due === today && remaining(i) > 0)
  )
    return "Vence hoy";
  return "Al día";
}
export function planPayment(loan: Loan, amount: number, selected?: string) {
  let rest = cents(amount);
  const rows = currentInstallments(loan)
    .filter((i) => remaining(i) > 0)
    .sort((a, b) => a.due.localeCompare(b.due));
  const candidates = selected ? rows.filter((i) => i.id === selected) : rows;
  const allocations = [];
  for (const i of candidates) {
    if (rest <= 0) break;
    const interest = Math.min(rest, cents(i.interest - i.paidInterest));
    rest -= interest;
    const principal = Math.min(rest, cents(i.principal - i.paidPrincipal));
    rest -= principal;
    if (principal + interest > 0)
      allocations.push({
        installmentId: i.id,
        principal: principal / 100,
        interest: interest / 100,
      });
  }
  return { allocations, excess: rest / 100 };
}
export function promiseStatus(
  activity: Activity,
  payments: Payment[],
  today: string,
) {
  if (activity.status === "cancelada") return "Cancelada";
  const linked = payments.filter(
    (p) => activity.linkedPayments?.includes(p.id) && !p.reversed,
  );
  const amount = linked.reduce(
    (s, p) =>
      s + p.allocations.reduce((a, b) => a + b.principal + b.interest, 0),
    0,
  );
  if (amount >= (activity.amount ?? Infinity))
    return linked.some((p) => p.date > activity.start.slice(0, 10))
      ? "Cumplida fuera de fecha"
      : "Cumplida";
  return activity.start.slice(0, 10) < today ? "Incumplida" : "Pendiente";
}
export function metrics(state: State, loans = state.loans) {
  const active = loans.filter((l) => l.status === "activo");
  const ids = new Set(loans.map((l) => l.id));
  const period = state.business.today.slice(0, 7);
  return {
    capital: moneyValue(active.reduce((s, l) => s + principalLeft(l), 0)),
    overdue: moneyValue(
      active.reduce((s, l) => s + overdue(l, state.business.today), 0),
    ),
    due: moneyValue(
      active.reduce(
        (s, l) =>
          s +
          currentInstallments(l)
            .filter((i) => i.due === state.business.today)
            .reduce((a, i) => a + remaining(i), 0),
        0,
      ),
    ),
    upcoming: moneyValue(
      active.reduce(
        (s, l) =>
          s +
          currentInstallments(l)
            .filter(
              (i) =>
                i.due > state.business.today &&
                i.due <= addDays(state.business.today, 7),
            )
            .reduce((a, i) => a + remaining(i), 0),
        0,
      ),
    ),
    net: moneyValue(
      state.payments
        .filter(
          (p) =>
            ids.has(p.loanId) &&
            p.date.startsWith(period) &&
            p.source !== "credit",
        )
        .reduce((s, p) => s + p.amount, 0) -
        state.payments
          .filter(
            (p) =>
              ids.has(p.loanId) &&
              p.reversed &&
              p.reversedOn?.startsWith(period) &&
              p.source !== "credit",
          )
          .reduce((s, p) => s + p.amount, 0) -
        state.credits
          .filter(
            (c) =>
              c.date.startsWith(period) &&
              loans.some((l) => l.clientId === c.clientId),
          )
          .reduce((s, c) => s + c.amount, 0),
    ),
    active: active.length,
  };
}
