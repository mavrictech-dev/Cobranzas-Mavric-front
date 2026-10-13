# Frontend de presentación implementado

Fecha: 12 de octubre de 2026. Código: `../frontend/`. Esta entrega implementa una demo local; el backend Python, FastAPI y PostgreSQL sigue pendiente.

## Lo construido

- Nueve pantallas en Next.js: Inicio, Clientes, Préstamos, Cobranzas, Calendario, Documentos, Reportes, Recordatorios y Configuración.
- Temas Blanco, Negro y Navi, navegación adaptable y paneles modales desde la derecha con fondo desenfocado y control de cambios pendientes.
- Cartera de 24 clientes y 30 préstamos ficticios; escenarios restaurables; información compartida y persistida en el navegador.
- Registro/edición/archivo de clientes, búsqueda, filtros, expedientes y asignación de responsables.
- Simulación mensual, regla de tasa por monto, borrador, aprobación y desembolso diferenciados, cronograma e historial.
- Pagos parciales/completos, aplicación a cuotas, comprobantes PDF, control de operación duplicada, reversos autorizados, reprogramación, prepago y liquidación simulados.
- Crédito a favor: excedente explícito, aplicación sin duplicar ingresos y registro de devolución.
- Calendario FullCalendar con mes/semana/día/agenda, cuotas derivadas, actividades, movimiento confirmado y promesas vinculadas a pagos.
- Archivos locales en IndexedDB, carga JPG/PNG/WebP/PDF, previsualización y descarga; referencias ilustradas para los ejemplos iniciales.
- Ubicación con coordenadas editables, confirmación manual y enlaces a Google Maps; propuesta de punto identificada como simulada.
- Reportes PDF/CSV y correo de ejemplo con éxito, fallo, resultado desconocido y reintento controlado.
- Roles de presentación Dueño/Jefe/Cobrador/Consulta y bloqueo de operaciones no autorizadas dentro del adaptador mock.

## Qué sigue siendo simulación

No hay autenticación real, llamadas a FastAPI, base de datos compartida, consulta oficial de DNI, entrega de dinero, geocodificación por fotografía ni envío de correo. El servidor de presentación solo entrega los archivos estáticos exportados.

Las condiciones financieras de la demo utilizan períodos mensuales convencionales. La liquidación considera capital e interés exigible de cuotas al corte, sin devengo diario. La reducción de plazo por prepago es proporcional y está identificada como aproximación. Los reversos relacionados con ajustes de cronograma se bloquean para revisión. Esas reglas deben definirse y validarse antes del sistema real.

Las fechas de las cuotas son de negocio, separadas de los horarios de visita. El reloj de la demo se fija al 12/10/2026. Los reportes de cartera muestran saldo actual de ese escenario; los períodos filtran movimientos y vencimientos, no prometen reconstrucción contable arbitraria del pasado.

## Apertura

Ejecutar `Iniciar presentacion.cmd` en la carpeta principal. Abrirá el navegador en la dirección local y mantendrá el servidor de archivos en una ventana. Cerrarla detiene esa sesión. El código y los pasos de desarrollo están descritos en `../frontend/README.md`.

## Verificación

Se utilizan pruebas de reglas de negocio para redondeo, pagos, duplicados, conflicto de saldo, reversos, crédito a favor, reprogramación, promesas, permisos y recordatorios. Las pruebas de navegador verifican rutas, temas, recorrido numérico, altas, duplicados, calendario, navegación, archivos y descargas. Las capturas quedan en `../frontend/qa/`.

La compilación estática de Next.js y la comprobación de TypeScript pasaron. Las nueve pruebas de negocio pasaron. El navegador verificó las nueve pantallas, tres temas, pagos parciales/completos, reverso, alta y duplicado de cliente, calendario, conservación del rol al navegar y diseño móvil. Un segundo recorrido verificó regla de tasa, simulación, aprobación/desembolso, prepago, liquidación, archivo disponible tras recarga, envío simulado con reintento, descarga PDF y confirmación manual de ubicación; no se detectaron errores de ejecución en esos recorridos.

La especificación de planificación se conserva en los documentos 01–05 como referencia. Los límites y comportamientos efectivos de esta entrega se describen aquí y en el README.
