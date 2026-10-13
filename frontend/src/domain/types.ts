export type Role = "Dueño" | "Jefe" | "Cobrador" | "Consulta";
export type Theme = "light" | "dark" | "navy";
export type LoanStatus =
  "borrador" | "aprobado" | "activo" | "liquidado" | "cancelado";
export type Client = {
  id: string;
  name: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  reference: string;
  owner: string;
  tags: string[];
  notes: string;
  archived: boolean;
  location?: { lat: number; lng: number; confirmed: boolean };
  credit: number;
};
export type Installment = {
  id: string;
  number: number;
  due: string;
  principal: number;
  interest: number;
  paidPrincipal: number;
  paidInterest: number;
  superseded?: boolean;
};
export type ScheduleVersion = {
  version: number;
  date: string;
  reason: string;
  installments: Installment[];
  terms?: {
    tea: number;
    count: number;
    firstDue: string;
    method: "frances" | "simple";
  };
};
export type Loan = {
  id: string;
  clientId: string;
  principal: number;
  tea: number;
  method: "frances" | "simple";
  count: number;
  disbursed: string;
  firstDue: string;
  status: LoanStatus;
  installments: Installment[];
  version: number;
  history: ScheduleVersion[];
  notes: string;
  adjustment?: {
    count: number;
    firstDue: string;
    tea: number;
    reason: string;
    basedOn: number;
  };
};
export type Allocation = {
  installmentId: string;
  principal: number;
  interest: number;
};
export type Payment = {
  id: string;
  key: string;
  loanId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  notes: string;
  allocations: Allocation[];
  credit: number;
  reversed: boolean;
  reversedOn?: string;
  reverseReason?: string;
  loanVersion: number;
  source?: "cash" | "credit" | "prepago" | "liquidacion";
};
export type Activity = {
  id: string;
  clientId: string;
  loanId?: string;
  type: "visita" | "tarea" | "llamada" | "promesa";
  title: string;
  start: string;
  end: string;
  owner: string;
  status: "pendiente" | "completada" | "cancelada";
  notes: string;
  amount?: number;
  linkedPayments?: string[];
};
export type Doc = {
  id: string;
  clientId: string;
  loanId?: string;
  name: string;
  category: string;
  size: number;
  mime: string;
  created: string;
  asset?: string;
  temporary?: boolean;
};
export type Rate = {
  id: string;
  name: string;
  min: number;
  max: number;
  tea: number;
  active: boolean;
};
export type Reminder = {
  id: string;
  name: string;
  days: number;
  hour: string;
  recipient: string;
  active: boolean;
  skipEmpty: boolean;
};
export type Mail = {
  id: string;
  ruleId: string;
  recipient: string;
  subject: string;
  date: string;
  status: "Aceptado" | "Fallido" | "Desconocido" | "Omitido";
  attempts: number;
  error: string;
  rows: string[][];
};
export type User = { id: string; name: string; role: Role; active: boolean };
export type Audit = {
  id: string;
  date: string;
  actor: string;
  action: string;
  entity: string;
};
export type CreditMovement = {
  id: string;
  clientId: string;
  loanId?: string;
  amount: number;
  date: string;
  kind: "devolucion";
  reason: string;
  key: string;
};
export type State = {
  schema: 1;
  clients: Client[];
  loans: Loan[];
  payments: Payment[];
  activities: Activity[];
  documents: Doc[];
  rates: Rate[];
  reminders: Reminder[];
  mails: Mail[];
  users: User[];
  audit: Audit[];
  credits: CreditMovement[];
  business: { name: string; email: string; today: string };
  scenario: "normal" | "vacio" | "mora" | "envio" | "incierto";
};
export type Panel = {
  type: string;
  id?: string;
  clientId?: string;
  loanId?: string;
  installmentId?: string;
  data?: Record<string, unknown>;
};
