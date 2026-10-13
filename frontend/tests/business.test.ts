import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/mocks/seed";
import { execute } from "../src/domain/commands";
import {
  schedule,
  addMonths,
  principalLeft,
  remaining,
  overdue,
  metrics,
  promiseStatus,
} from "../src/domain/finance";
import type { State, Loan } from "../src/domain/types";
const control = (s: State) => s.loans.find((l) => l.id === "PRE-001")!;
function pay(
  s: State,
  amount: number,
  key: string,
  extra: Record<string, unknown> = {},
) {
  return execute(
    s,
    {
      type: "payment",
      key,
      loanId: "PRE-001",
      amount,
      date: s.business.today,
      method: "Efectivo",
      reference: "DEMO",
      notes: "",
      allowCredit: false,
      version: control(s).version,
      ...extra,
    } as Parameters<typeof execute>[1],
    "Dueño",
  );
}
test("rate zero, cent rounding and stable end-of-month dates", () => {
  const rows = schedule(1000, 0, 3, "2026-01-31");
  assert.equal(
    rows.reduce((s, i) => Math.round((s + i.principal) * 100) / 100, 0),
    1000,
  );
  assert.deepEqual(
    rows.map((i) => i.due),
    ["2026-01-31", "2026-02-28", "2026-03-31"],
  );
  assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
});
test("full payment journey: 200, 300, 500 then reverse 300", () => {
  let s = createSeed();
  s = pay(s, 200, "test-200");
  assert.equal(principalLeft(control(s)), 800);
  assert.equal(remaining(control(s).installments[0]), 300);
  assert.equal(overdue(control(s), s.business.today), 300);
  s = pay(s, 300, "test-300");
  const payment = s.payments.find((p) => p.key === "test-300")!;
  assert.equal(principalLeft(control(s)), 500);
  s = pay(s, 500, "test-500");
  assert.equal(control(s).status, "liquidado");
  s = execute(
    s,
    { type: "reverse", id: payment.id, reason: "Corrección de prueba" },
    "Dueño",
  );
  assert.equal(control(s).status, "activo");
  assert.equal(principalLeft(control(s)), 300);
  assert.equal(remaining(control(s).installments[1]), 0);
  assert.equal(overdue(control(s), s.business.today), 300);
  assert.throws(
    () =>
      execute(s, { type: "reverse", id: payment.id, reason: "otra" }, "Dueño"),
    /ya fue reversado/,
  );
});
test("duplicate key returns original payment and stale version changes nothing", () => {
  const base = createSeed();
  const paid = pay(base, 200, "same-key");
  const duplicate = pay(paid, 200, "same-key");
  assert.equal(duplicate.payments.length, paid.payments.length);
  assert.equal(principalLeft(control(duplicate)), 800);
  assert.throws(
    () => pay(paid, 100, "other-key", { version: control(base).version }),
    /saldo cambió/,
  );
  assert.equal(principalLeft(control(paid)), 800);
});
test("excess must have destination; applying credit is not new revenue", () => {
  let s = createSeed();
  assert.throws(() => pay(s, 1200, "excess"), /excede/);
  s = pay(s, 1200, "excess", { allowCredit: true });
  assert.equal(s.clients[0].credit, 200);
  assert.equal(control(s).status, "liquidado");
  const other: Loan = {
    ...control(s),
    id: "CREDIT-LOAN",
    principal: 100,
    installments: schedule(100, 0, 1, "2026-10-12", "frances", "credit"),
    history: [],
    status: "activo",
    version: 1,
  };
  s.loans.push(other);
  const before = metrics(s).net;
  s = execute(
    s,
    {
      type: "credit",
      clientId: "CLI-001",
      loanId: other.id,
      amount: 100,
      key: "apply-credit",
      reason: "Aplicación",
      refund: false,
    },
    "Dueño",
  );
  assert.equal(s.clients[0].credit, 100);
  assert.equal(metrics(s).net, before);
  s = execute(
    s,
    {
      type: "credit",
      clientId: "CLI-001",
      amount: 100,
      key: "refund-credit",
      reason: "Entrega realizada",
      refund: true,
    },
    "Dueño",
  );
  assert.equal(s.clients[0].credit, 0);
  assert.equal(metrics(s).net, before - 100);
});
test("saving reprogram proposal does not change dates; apply preserves payments and blocks stale reversal", () => {
  let s = pay(createSeed(), 500, "first");
  const original = control(s).installments[1].due;
  const cmd = {
    type: "reschedule" as const,
    id: "PRE-001",
    count: 2,
    firstDue: "2026-11-12",
    tea: 0,
    reason: "Nuevo acuerdo",
    version: control(s).version,
    apply: false,
  };
  s = execute(s, cmd, "Dueño");
  assert.equal(control(s).installments[1].due, original);
  s = execute(s, { ...cmd, apply: true }, "Dueño");
  assert.equal(principalLeft(control(s)), 500);
  assert.deepEqual(
    control(s).installments.map((i) => i.due),
    ["2026-11-12", "2026-12-12"],
  );
  assert.equal(control(s).history[0].installments[0].paidPrincipal, 500);
  assert.throws(
    () =>
      execute(
        s,
        {
          type: "reverse",
          id: s.payments.find((p) => p.key === "first")!.id,
          reason: "Corrección",
        },
        "Dueño",
      ),
    /dependiente/,
  );
});
test("promise depends on linked payment; reversal restores pending status", () => {
  let s = pay(createSeed(), 300, "promise-payment");
  const a = s.activities.find((a) => a.id === "ACT-003")!;
  const p = s.payments.find((p) => p.key === "promise-payment")!;
  assert.equal(promiseStatus(a, s.payments, s.business.today), "Pendiente");
  s = execute(s, { type: "promise.link", id: a.id, payments: [p.id] }, "Dueño");
  assert.equal(
    promiseStatus(
      s.activities.find((x) => x.id === a.id)!,
      s.payments,
      s.business.today,
    ),
    "Cumplida",
  );
  s = execute(s, { type: "reverse", id: p.id, reason: "Corrección" }, "Dueño");
  assert.equal(
    promiseStatus(
      s.activities.find((x) => x.id === a.id)!,
      s.payments,
      s.business.today,
    ),
    "Pendiente",
  );
});
test("archive, roles, duplicate clients and conflicting rate ranges are protected", () => {
  const s = createSeed();
  assert.throws(
    () =>
      execute(
        s,
        { type: "client.archive", id: "CLI-001", archived: true },
        "Dueño",
      ),
    /deuda/,
  );
  assert.throws(
    () => execute(s, { type: "loan.approve", id: "PRE-022" }, "Cobrador"),
    /permiso/,
  );
  assert.throws(
    () =>
      execute(
        s,
        {
          type: "client.save",
          client: { ...s.clients[1], dni: s.clients[0].dni },
        },
        "Dueño",
      ),
    /DNI ya/,
  );
  assert.throws(
    () =>
      execute(
        s,
        {
          type: "rate.save",
          rate: {
            id: "new",
            name: "Overlap",
            min: 2000,
            max: 4000,
            tea: 5,
            active: true,
          },
        },
        "Dueño",
      ),
    /solapa/,
  );
  assert.throws(
    () =>
      execute(
        s,
        { type: "client.save", client: { ...s.clients[0], name: "Changed" } },
        "Cobrador",
      ),
    /cartera/,
  );
});
test("draft approval is distinct from disbursement and rate changes preserve loan terms", () => {
  let s = createSeed();
  const draft = s.loans.find((l) => l.status === "borrador")!;
  const oldRate = draft.tea;
  const before = metrics(s).capital;
  s = execute(s, { type: "loan.approve", id: draft.id }, "Dueño");
  assert.equal(metrics(s).capital, before);
  s = execute(
    s,
    { type: "loan.disburse", id: draft.id, date: "2026-07-12" },
    "Dueño",
  );
  assert.equal(s.loans.find((l) => l.id === draft.id)!.status, "activo");
  assert.equal(metrics(s).capital, before + draft.principal);
  s = execute(
    s,
    { type: "rate.save", rate: { ...s.rates[0], tea: 1 } },
    "Dueño",
  );
  assert.equal(s.loans.find((l) => l.id === draft.id)!.tea, oldRate);
});
test("mail pause, duplicate accepted send and uncertain result are handled separately", () => {
  let s = createSeed();
  const r = s.reminders[0];
  s = execute(
    s,
    { type: "mail", ruleId: r.id, result: "Desconocido", rows: [["demo"]] },
    "Dueño",
  );
  const m = s.mails[0];
  assert.throws(
    () =>
      execute(
        s,
        {
          type: "mail",
          ruleId: r.id,
          result: "Aceptado",
          rows: [["demo"]],
          retry: m.id,
        },
        "Dueño",
      ),
    /Consulta/,
  );
  s = execute(s, { type: "mail.resolve", id: m.id, accepted: true }, "Dueño");
  assert.throws(
    () =>
      execute(
        s,
        { type: "mail", ruleId: r.id, result: "Aceptado", rows: [["demo"]] },
        "Dueño",
      ),
    /ya figura aceptado/,
  );
  s = execute(
    s,
    { type: "reminder.save", reminder: { ...r, active: false } },
    "Dueño",
  );
  assert.throws(
    () =>
      execute(
        s,
        { type: "mail", ruleId: r.id, result: "Aceptado", rows: [["demo"]] },
        "Dueño",
      ),
    /Activa/,
  );
});
