import type { State, Client, Loan, Payment } from "@/domain/types";
import { addDays, schedule } from "@/domain/finance";
export function createSeed(scenario: State["scenario"] = "normal"): State {
  const today = "2026-10-12";
  const names = [
    "Cliente Demo Uno",
    "Valeria Mendoza",
    "Carlos Ramírez",
    "Andrea Salazar",
    "Diego Huamán",
    "Camila Torres",
    "Jorge Paredes",
    "Luciana Flores",
    "Ricardo Vásquez",
    "Gabriela Rojas",
    "Miguel Castillo",
    "Daniela Silva",
    "Fernando Cruz",
    "Sofía Medina",
    "Alonso Quispe",
    "Mariana León",
    "Eduardo Castro",
    "Isabella Díaz",
    "Renato Vega",
    "Paola Reyes",
    "Sebastián Ortiz",
    "Natalia Campos",
    "Bruno Aguilar",
    "Antonella Ramos",
  ];
  const districts = [
    "Miraflores",
    "San Isidro",
    "Surco",
    "San Borja",
    "La Molina",
    "Barranco",
  ];
  const owners = ["Lucía Herrera", "Mateo Ruiz", "Sofía López"];
  const clients: Client[] = names.map((name, i) => ({
    id: `CLI-${String(i + 1).padStart(3, "0")}`,
    name,
    dni: String(i + 1).padStart(8, "0"),
    phone: `900${String(100000 + i).padStart(6, "0")}`,
    email: `cliente${i + 1}@example.com`,
    address: `Calle de Ejemplo ${120 + i * 13}`,
    district: districts[i % 6],
    reference:
      i % 3 === 0
        ? "Fachada clara, puerta de madera. Referencia ficticia."
        : "Dirección ficticia para presentación.",
    owner: owners[i % 3],
    tags: i % 3 === 0 ? ["Recurrente"] : ["Nuevo"],
    notes: "Expediente de demostración. Todos los datos son ficticios.",
    archived: false,
    location:
      i % 3 === 0
        ? { lat: -12.12 + i / 10000, lng: -77.03 - i / 10000, confirmed: true }
        : undefined,
    credit: 0,
  }));
  const loans: Loan[] = clients.map((client, i) => {
    const principal =
      i === 0 ? 1000 : [3200, 5500, 1800, 8000, 2600, 4200][i % 6];
    const count = i === 0 ? 2 : [6, 8, 4, 12][i % 4];
    const firstDue =
      i === 0
        ? "2026-09-12"
        : `2026-08-${String([12, 15, 18, 22, 5, 9][i % 6]).padStart(2, "0")}`;
    const id = `PRE-${String(i + 1).padStart(3, "0")}`;
    return {
      id,
      clientId: client.id,
      principal,
      tea: i === 0 ? 0 : [18, 24, 12][i % 3],
      method: "frances",
      count,
      disbursed: "2026-07-12",
      firstDue,
      status: i > 20 ? "borrador" : "activo",
      installments: schedule(
        principal,
        i === 0 ? 0 : [18, 24, 12][i % 3],
        count,
        firstDue,
        "frances",
        id,
      ),
      version: 1,
      history: [],
      notes: "Condiciones ficticias de presentación.",
    };
  });
  const payments: Payment[] = [];
  loans.forEach((loan, index) => {
    if (index === 0 || loan.status !== "activo") return;
    loan.installments.forEach((inst, j) => {
      if (j < 2 && index % 4 !== 0) {
        inst.paidPrincipal = inst.principal;
        inst.paidInterest = inst.interest;
        payments.push({
          id: `PAG-SEED-${index}-${j}`,
          key: `seed-${index}-${j}`,
          loanId: loan.id,
          amount: inst.principal + inst.interest,
          date:
            j === 1
              ? `2026-10-${String((index % 10) + 1).padStart(2, "0")}`
              : "2026-09-10",
          method: index % 2 ? "Transferencia" : "Yape / Plin",
          reference: `DEMO-${index}${j}`,
          notes: "Pago ficticio sembrado.",
          allocations: [
            {
              installmentId: inst.id,
              principal: inst.principal,
              interest: inst.interest,
            },
          ],
          credit: 0,
          reversed: false,
          loanVersion: 1,
          source: "cash",
        });
      }
    });
  });
  for (let i = 0; i < 6; i++) {
    const id = `PRE-${String(25 + i).padStart(3, "0")}`;
    loans.push({
      id,
      clientId: clients[i + 1].id,
      principal: 1500 + i * 250,
      tea: 18,
      method: "frances",
      count: 4,
      disbursed: today,
      firstDue: addDays(today, 30 + i),
      status: i === 5 ? "aprobado" : "activo",
      installments: schedule(
        1500 + i * 250,
        18,
        4,
        addDays(today, 30 + i),
        "frances",
        id,
      ),
      version: 1,
      history: [],
      notes: "Segundo préstamo de demostración.",
    });
  }
  const state: State = {
    schema: 1,
    scenario,
    clients,
    loans,
    payments,
    activities: [
      {
        id: "ACT-001",
        clientId: "CLI-002",
        loanId: "PRE-002",
        type: "visita",
        title: "Visita de seguimiento",
        start: today + "T10:30:00-05:00",
        end: today + "T11:00:00-05:00",
        owner: "Mateo Ruiz",
        status: "pendiente",
        notes: "Revisar compromiso y actualizar dirección.",
      },
      {
        id: "ACT-002",
        clientId: "CLI-004",
        loanId: "PRE-004",
        type: "llamada",
        title: "Confirmar próximo abono",
        start: today + "T14:00:00-05:00",
        end: today + "T14:20:00-05:00",
        owner: "Lucía Herrera",
        status: "pendiente",
        notes: "Llamada de demostración.",
      },
      {
        id: "ACT-003",
        clientId: "CLI-001",
        loanId: "PRE-001",
        type: "promesa",
        title: "Promesa de pago",
        start: "2026-10-13T12:00:00-05:00",
        end: "2026-10-13T12:30:00-05:00",
        owner: "Lucía Herrera",
        status: "pendiente",
        notes: "Compromiso ficticio.",
        amount: 300,
        linkedPayments: [],
      },
      {
        id: "ACT-004",
        clientId: "CLI-005",
        type: "visita",
        title: "Actualizar expediente",
        start: "2026-10-14T09:00:00-05:00",
        end: "2026-10-14T09:30:00-05:00",
        owner: "Mateo Ruiz",
        status: "pendiente",
        notes: "",
      },
    ],
    documents: clients
      .slice(0, 9)
      .map((client, i) => ({
        id: `DOC-${i + 1}`,
        clientId: client.id,
        name: i % 2 ? "Contrato de ejemplo" : "Fachada de referencia",
        category: i % 2 ? "Contrato" : "Foto de casa",
        size: 2400,
        mime: "image/svg+xml",
        created: today,
        asset: i % 2 ? "/documento-ejemplo.svg" : "/fachada-ejemplo.svg",
      })),
    rates: [
      {
        id: "TAS-01",
        name: "Capital inicial",
        min: 1,
        max: 3000,
        tea: 24,
        active: true,
      },
      {
        id: "TAS-02",
        name: "Cartera regular",
        min: 3000.01,
        max: 10000,
        tea: 18,
        active: true,
      },
      {
        id: "TAS-03",
        name: "Capital mayor",
        min: 10000.01,
        max: 50000,
        tea: 12,
        active: true,
      },
    ],
    reminders: [
      {
        id: "REC-01",
        name: "Próximos vencimientos",
        days: 7,
        hour: "08:00",
        recipient: "dueno@example.com",
        active: true,
        skipEmpty: true,
      },
      {
        id: "REC-02",
        name: "Vencimientos de hoy",
        days: 0,
        hour: "08:30",
        recipient: "dueno@example.com",
        active: true,
        skipEmpty: true,
      },
      {
        id: "REC-03",
        name: "Resumen de mora",
        days: -1,
        hour: "17:00",
        recipient: "dueno@example.com",
        active: true,
        skipEmpty: true,
      },
    ],
    mails: [
      {
        id: "COR-001",
        ruleId: "REC-03",
        recipient: "dueno@example.com",
        subject: "Resumen de cobranza · 12 de octubre",
        date: today,
        status: "Aceptado",
        attempts: 1,
        error: "",
        rows: [["Cliente ficticio", "S/ 500.00", "12/09/2026"]],
      },
    ],
    users: [
      { id: "USR-01", name: "Lucía Herrera", role: "Dueño", active: true },
      { id: "USR-02", name: "Mateo Ruiz", role: "Cobrador", active: true },
      { id: "USR-03", name: "Sofía López", role: "Cobrador", active: true },
    ],
    audit: [],
    credits: [],
    business: { name: "Mavric", email: "dueno@example.com", today },
  };
  if (scenario === "vacio") {
    state.clients = [];
    state.loans = [];
    state.payments = [];
    state.activities = [];
    state.documents = [];
    state.mails = [];
  }
  if (scenario === "envio") {
    state.mails[0].status = "Fallido";
    state.mails[0].error =
      "El proveedor de ejemplo no respondió. No se envió ningún correo real.";
  }
  return state;
}
