"use client";
import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import esLocale from "@fullcalendar/core/locales/es";
import { useDemo, useVisible } from "@/providers/demo";
import {
  remaining,
  currentInstallments,
  money,
  promiseStatus,
} from "@/domain/finance";
export function CollectionCalendar({
  filter = "Todos",
  owner = "Todos",
  status = "Todos",
  clientId = "",
}: {
  filter?: string;
  owner?: string;
  status?: string;
  clientId?: string;
}) {
  const { state, open, role } = useDemo();
  const { loans, clients, activities } = useVisible();
  const ref = useRef<FullCalendar>(null);
  const client = (id: string) => clients.find((c) => c.id === id);
  const events = [
    ...loans
      .filter(
        (l) =>
          l.status === "activo" &&
          (!clientId || l.clientId === clientId) &&
          (filter === "Todos" || filter === "Cuotas") &&
          (owner === "Todos" || client(l.clientId)?.owner === owner),
      )
      .flatMap((l) =>
        currentInstallments(l)
          .filter(
            (i) =>
              status === "Todos" ||
              (status === "Pendientes" ? remaining(i) > 0 : remaining(i) === 0),
          )
          .map((i) => ({
            id: i.id,
            title: `${client(l.clientId)?.name} · ${money(remaining(i))}`,
            start: i.due,
            allDay: true,
            editable: false,
            classNames: [
              remaining(i) === 0
                ? "event-paid"
                : i.due < state.business.today
                  ? "event-overdue"
                  : "event-installment",
            ],
            extendedProps: { kind: "cuota", loanId: l.id, installmentId: i.id },
          })),
      ),
    ...activities
      .filter(
        (a) =>
          a.status !== "cancelada" &&
          (!clientId || a.clientId === clientId) &&
          (status === "Todos" ||
            (status === "Pendientes"
              ? a.status === "pendiente" &&
                !(
                  a.type === "promesa" &&
                  promiseStatus(
                    a,
                    state.payments,
                    state.business.today,
                  ).startsWith("Cumplida")
                )
              : a.status === "completada" ||
                (a.type === "promesa" &&
                  promiseStatus(
                    a,
                    state.payments,
                    state.business.today,
                  ).startsWith("Cumplida")))) &&
          (owner === "Todos" || a.owner === owner) &&
          (filter === "Todos" ||
            (filter === "Visitas" && a.type === "visita") ||
            (filter === "Promesas" && a.type === "promesa") ||
            (filter === "Tareas" && ["tarea", "llamada"].includes(a.type))),
      )
      .map((a) => ({
        id: a.id,
        title: `${a.title} · ${client(a.clientId)?.name}`,
        start: a.type === "promesa" ? a.start.slice(0, 10) : a.start,
        end: a.type === "promesa" ? undefined : a.end,
        allDay: a.type === "promesa",
        editable: a.type !== "promesa" && a.status === "pendiente",
        classNames: [
          a.status === "completada"
            ? "event-paid"
            : a.type === "promesa"
              ? "event-promise"
              : "event-activity",
        ],
        extendedProps: { kind: "actividad" },
      })),
  ];
  return (
    <div className="calendar-surface">
      <FullCalendar
        ref={ref}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin,
          luxonPlugin,
        ]}
        locale={esLocale}
        timeZone="America/Lima"
        initialDate={state.business.today}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          list: "Agenda",
        }}
        height="auto"
        events={events}
        dayMaxEvents={3}
        firstDay={1}
        now={state.business.today + "T12:00:00-05:00"}
        selectable={role !== "Consulta"}
        editable={role !== "Consulta"}
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        eventClick={(info) =>
          info.event.extendedProps.kind === "cuota"
            ? open({
                type: "installment",
                loanId: info.event.extendedProps.loanId,
                installmentId: info.event.extendedProps.installmentId,
              })
            : open({ type: "activity-detail", id: info.event.id })
        }
        dateClick={(info) =>
          role !== "Consulta" &&
          open({
            type: "activity-new",
            data: { start: info.dateStr.slice(0, 10) + "T10:00" },
          })
        }
        eventDrop={(info) => {
          const start = info.event.startStr;
          const end = info.event.endStr;
          info.revert();
          open({
            type: "activity-edit",
            id: info.event.id,
            data: { start, end, moved: true },
          });
        }}
        moreLinkClick={(info) => {
          ref.current?.getApi().changeView("listDay", info.date);
          return "listDay";
        }}
        eventContent={(info) => (
          <span className="calendar-event-label">
            {info.timeText && <b>{info.timeText} </b>}
            {info.event.title}
          </span>
        )}
      />
    </div>
  );
}
