"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { State, Role, Theme, Panel } from "@/domain/types";
import { execute, type Command } from "@/domain/commands";
import { createSeed } from "@/mocks/seed";
type DemoContext = {
  state: State;
  role: Role;
  theme: Theme;
  ready: boolean;
  setRole: (r: Role) => void;
  setTheme: (t: Theme) => void;
  run: (c: Command) => State;
  reset: (scenario: State["scenario"]) => void;
  panel: Panel | null;
  open: (p: Panel) => void;
  back: () => void;
  close: () => void;
  notice: (s: string) => void;
  toast: string;
  dirty: boolean;
  setDirty: (d: boolean) => void;
};
const Demo = createContext<DemoContext | null>(null);
const storageKey = "mavric.demo.v1";
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => createSeed());
  const current = useRef(state);
  const [role, setRoleState] = useState<Role>("Dueño");
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [dirty, setDirty] = useState(false);
  const history = useRef<Panel[]>([]);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function notice(message: string) {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 5000);
  }
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const value = JSON.parse(stored) as State;
        if (
          value.schema === 1 &&
          Array.isArray(value.clients) &&
          Array.isArray(value.credits) &&
          Array.isArray(value.loans)
        ) {
          current.current = value;
          setState(value);
        }
      }
      const t = localStorage.getItem("mavric.theme") as Theme;
      if (["light", "dark", "navy"].includes(t)) {
        setThemeState(t);
        document.documentElement.dataset.theme = t;
      }
    } catch {
      setToast(
        "Se cargó el escenario inicial. El almacenamiento local no estaba disponible.",
      );
    }
    setReady(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  function update(value: State) {
    current.current = value;
    setState(value);
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      notice(
        "Los cambios están en esta sesión; el navegador no pudo conservarlos.",
      );
    }
  }
  function run(cmd: Command) {
    const next = execute(current.current, cmd, role);
    update(next);
    return next;
  }
  function open(p: Panel) {
    if (panel) history.current.push(panel);
    setPanel(p);
    setDirty(false);
  }
  function close() {
    setPanel(null);
    history.current = [];
    setDirty(false);
  }
  function back() {
    const previous = history.current.pop();
    setPanel(previous ?? null);
    setDirty(false);
  }
  function setRole(r: Role) {
    setRoleState(r);
    close();
    notice(`Vista de ${r.toLowerCase()} activada.`);
  }
  function setTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("mavric.theme", t);
    } catch {}
  }
  function reset(scenario: State["scenario"]) {
    update(createSeed(scenario));
    close();
    notice("Presentación restaurada. Solo se modificaron datos ficticios.");
  }
  return (
    <Demo.Provider
      value={{
        state,
        role,
        theme,
        ready,
        setRole,
        setTheme,
        run,
        reset,
        panel,
        open,
        back,
        close,
        notice,
        toast,
        dirty,
        setDirty,
      }}
    >
      {children}
    </Demo.Provider>
  );
}
export function useDemo() {
  const value = useContext(Demo);
  if (!value) throw new Error("DemoProvider requerido");
  return value;
}
export function useVisible() {
  const { state, role } = useDemo();
  const clients = state.clients.filter(
    (c) => role !== "Cobrador" || c.owner === "Mateo Ruiz",
  );
  const ids = new Set(clients.map((c) => c.id));
  const loans = state.loans.filter((l) => ids.has(l.clientId));
  return {
    clients,
    loans,
    activities: state.activities.filter((a) => ids.has(a.clientId)),
    payments: state.payments.filter((p) =>
      loans.some((l) => l.id === p.loanId),
    ),
    documents: state.documents.filter((d) => ids.has(d.clientId)),
  };
}
