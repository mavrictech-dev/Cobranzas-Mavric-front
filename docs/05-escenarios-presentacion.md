# Escenarios completos para presentar y validar el frontend

Fecha: 12 de octubre de 2026. Todos los nombres, documentos, préstamos, archivos, referencias y correos del recorrido son ficticios. Estos son criterios de la futura demo, no pruebas de una aplicación ya construida.

## 1. Recorrido narrativo para el cliente

| Paso | Qué hace la persona | Qué debe verse |
|---|---|---|
| 1 | Abre Inicio y cambia Blanco → Negro → Navi | Mismos datos; colores coherentes en todas las superficies |
| 2 | Busca por nombre o DNI | Resultado inmediato; expediente a la derecha |
| 3 | Registra cliente nuevo y adjunta foto/documento | Alta, ficha y disponibilidad de archivo por separado |
| 4 | Ingresa dirección y confirma un punto ficticio | Foto como referencia; ubicación y enlace identificados |
| 5 | Simula préstamo mensual y guarda borrador | Cuotas y desglose; aún sin cartera activa ni avisos |
| 6 | Aprueba condiciones | Préstamo aprobado; el dinero aún no se registra como entregado |
| 7 | Registra desembolso realizado de ejemplo | Préstamo activo; cuotas en calendario y cartera |
| 8 | Abre una cuota y registra pago parcial | Pendiente actualizado en calendario, cobranza, expediente e Inicio |
| 9 | Registra promesa y visita | Compromiso en agenda; fechas contractuales intactas |
| 10 | Mueve visita y confirma | Horario cambiado; cuota no se arrastra |
| 11 | Completa cuota y liquida escenario de ejemplo | Préstamo cerrado financieramente, historial visible |
| 12 | Reversa un pago autorizado en escenario de corrección | Original conservado; deuda restaurada y préstamo reabierto si corresponde |
| 13 | Propone reprogramación en otra rama del escenario | Antes/después; guardar no aplica; autorizar activa nueva versión |
| 14 | Genera mora/recaudación y descarga | Totales coinciden con tabla y movimientos; PDF/CSV ficticios |
| 15 | Revisa correo y simula éxito/fallo | Contenido, corte y estado visibles; reintento controlado |

La exposición recorrerá situaciones relacionadas, no botones aislados. Reverso y reprogramación se muestran como ramas separadas para no mezclar saldos de ejemplos diferentes.

## 2. Caso numérico reproducible: pagos y reverso

El escenario sembrado incluye un préstamo ya desembolsado PR-DEMO-001, para Cliente Demo Uno: capital **S/ 1,000.00**, dos cuotas de **S/ 500.00**, tasa **0%**, sin mora ni cargos monetarios. Desembolso histórico: 12/08/2026. Vencimientos: 12/09/2026 y 12/10/2026. Fecha de negocio de la presentación: **12/10/2026**, America/Lima.

La tasa cero es un caso de control aritmético, no una tasa comercial recomendada. La primera cuota está vencida; la segunda vence hoy y todavía no está atrasada. Las cifras siguientes se refieren solo a este préstamo; otras operaciones del conjunto de datos se filtran para comparar.

| Momento | Acción | Cuota 1 pendiente | Cuota 2 pendiente | Capital pendiente | Vencido | Recaudación neta acumulada |
|---|---|---:|---:|---:|---:|---:|
| E0 | Abrir escenario | S/ 500.00 | S/ 500.00 | S/ 1,000.00 | S/ 500.00 | S/ 0.00 |
| E1 | Pagar S/ 200.00 a cuota 1 | S/ 300.00 | S/ 500.00 | S/ 800.00 | S/ 300.00 | S/ 200.00 |
| E2 | Pagar S/ 300.00 a cuota 1 | S/ 0.00 | S/ 500.00 | S/ 500.00 | S/ 0.00 | S/ 500.00 |
| E3 | Pagar S/ 500.00 a cuota 2 | S/ 0.00 | S/ 0.00 | S/ 0.00 | S/ 0.00 | S/ 1,000.00 |
| E4 | Reversar el pago de S/ 300.00 de E2 | S/ 300.00 | S/ 0.00 | S/ 300.00 | S/ 300.00 | S/ 700.00 |

Resultados: E1 muestra cuota 1 parcial. E2 la muestra pagada. E3 liquida el préstamo. E4 conserva los tres pagos y añade reverso; reabre el préstamo como activo y restaura la deuda correspondiente. No se puede reversar de nuevo E2. Descargar su comprobante o fallar una descarga no modifica las cifras.

Los pagos del recorrido se registran con fecha de hoy y referencias ficticias. El escenario inicial es histórico ya sembrado; no necesita permitir altas retroactivas de préstamos para demostrarlo.

## 3. Rama de reprogramación

Restaurar el escenario a E2, antes del último pago. Queda S/ 500.00 de la segunda cuota, que vence hoy. Proponer dos cuotas de S/ 250.00 con tasa cero, sin cargos, para el 12/11/2026 y 12/12/2026.

Antes de aplicar: vencimiento del 12/10 visible, capital pendiente S/ 500.00 y propuesta guardada aparte. Después de aprobar: capital pendiente S/ 500.00, nuevas cuotas activas en noviembre/diciembre, cuota original sustituida en historial y pagos de la primera cuota conservados. Guardar propuesta no produce esos cambios.

Si se registra un pago mientras se revisa la propuesta, «Aprobar y aplicar» devuelve conflicto y obliga a recalcular. No se confirma la propuesta calculada con S/ 500.00 si ya queda otro saldo. Un intento de reversar E2 después de aplicar esta reprogramación mostrará la revisión de dependencias definida en F08, en lugar de inventar un resultado financiero.

## 4. Rama de promesa y visita

Restaurar a E1. Crear promesa por S/ 300.00 para el 13/10/2026, vinculada al préstamo. La cuota 1 conserva el vencimiento 12/09/2026. Agendar una visita para el 13/10 a las 10:30–11:00. Moverla al 14/10: cancelar restaura el 13/10; confirmar conserva el 14/10.

Vincular el pago de S/ 300.00 de E2 a esa promesa la cumple. Reversar ese pago la vuelve a pendiente antes de su fecha límite o incumplida después. No se crea otro pago al pulsar «Vincular pago». Completar visita guarda resultado; no marca la cuota pagada.

## 5. Rama de excedente y crédito

Con un préstamo de tasa cero y S/ 100.00 exigibles, ingresar S/ 120.00 obliga a decidir el destino de los S/ 20.00. Si se elige crédito a favor, la deuda cubierta baja S/ 100.00 y el crédito queda S/ 20.00. La recaudación refleja S/ 120.00 recibidos, separados entre aplicación y crédito.

Aplicar esos S/ 20.00 a otra obligación de la misma moneda reduce el crédito a cero y cubre esa obligación; **no suma otros S/ 20.00 a la recaudación**. En una rama alternativa, registrar su devolución reduce crédito a cero y registra salida S/ 20.00; recaudación neta del caso queda S/ 100.00. Cada operación mantiene su motivo, evidencia y clave. La presentación reproduce este ciclo con movimientos ficticios.

## 6. Escenarios de validación por flujo

| Caso | Acción / flujo | Resultado esperado |
|---|---|---|
| V01 · Documento duplicado | A-CLI-01 / F02 | No crea otra ficha; muestra Ver cliente existente dentro de alcance autorizado |
| V02 · Archivo demasiado grande | A-DOC-01 / F04 | Rechaza ese archivo con motivo; mantiene cliente y permite elegir otro |
| V03 · Ubicación sin GPS | A-LOC-01 / F03 | Conserva foto; pide dirección/punto; no afirma reconocimiento automático |
| V04 · Borrador sin desembolso | A-PRE-04 / F05 | No suma capital a cartera activa ni cuotas a calendario de cobro |
| V05 · Cambiar tasa tras simular | A-PRE-03 / F05 | Marca simulación desactualizada; requiere recalcular antes de aprobar |
| V06 · Tasa cero y fin de mes | A-PRE-03 / F05 | Divide capital correctamente; fecha pactada ajustada al último día sin desplazar meses posteriores |
| V07 · Pago parcial | A-PAG-03 / F06 | Reduce deuda según distribución; mantiene préstamo activo y cuota parcial |
| V08 · Doble clic al confirmar | A-PAG-03 / F06 | Un solo pago; botón bloqueado y clave única |
| V09 · Respuesta perdida después de guardar | A-PAG-05 / F15 | Comprobar resultado devuelve el pago existente sin duplicarlo |
| V10 · Saldo cambió por otro cobrador | A-PAG-03 / F06 | Conserva datos; nuevo desglose; nueva confirmación requerida |
| V11 · Descarga fallida | A-PAG-04 / F06 | Pago permanece confirmado; solo reintenta el archivo |
| V12 · Excedente sin destino | A-PAG-02 / F06 | No confirma hasta indicar aplicación completa |
| V13 · Reverso repetido | A-AJU-03 / F08 | Muestra el reverso existente; no resta dinero dos veces |
| V14 · Reverso con ajuste dependiente | A-AJU-03 / F08 | Bloquea reverso directo y muestra operaciones relacionadas |
| V15 · Pago durante reprogramación | A-AJU-05 / F09 | Descarta aprobación de propuesta obsoleta y solicita recalcular |
| V16 · Arrastrar cuota | A-CAL-03 / F09 | No permite movimiento; ofrece Proponer reprogramación |
| V17 · Cancelar movimiento de visita | A-CAL-04 / F10 | Restaura el horario previo y no crea otro evento |
| V18 · Promesa con pago parcial | A-GES-03 / F11 | Muestra progreso; no la marca cumplida hasta cubrir importe |
| V19 · Pago antes del despacho de aviso | A-REC-05 / F12 | Reevalúa deuda; omite cuota pagada o regenera resumen |
| V20 · Envío fallido confirmado | A-REC-05 / F12 | Estado fallido, motivo y reintento sin otra entrada duplicada |
| V21 · Envío de resultado desconocido | A-REC-06 / F12 | Solicita consultar resultado antes de reenviar |
| V22 · Regla pausada | A-REC-03 / F12 | Conserva historial; evita nuevos despachos relevantes de esa regla |
| V23 · Reporte sin datos | A-REP-01 / F13 | Estado vacío con Cambiar filtros; ningún total inventado |
| V24 · Cambio de regla de tasa | A-CFG-02 / F14 | Afecta nuevas simulaciones; conserva préstamos aprobados/activos |
| V25 · Cobrador sin permiso | A-AJU-03 / F01 | No puede reversar ni modificar tasas; acceso explicado |
| V26 · Cliente con deuda al archivar | A-CLI-05 / F02 | Bloqueo y acceso a sus préstamos; historial intacto |
| V27 · Cerrado con formulario editado | Contrato común | Seguir editando / Descartar cambios; no guarda por cerrar |
| V28 · Navegación por teclado | Todos los paneles | Foco contenido y regreso al botón; Escape respeta cambios pendientes |
| V29 · Temas y resolución | Todas las pantallas | Texto, tablas, calendario, gráficos y paneles legibles en Blanco/Negro/Navi |
| V30 · Recarga y adjunto temporal | A-DOC-02 / F04 | Conserva metadatos; informa archivo temporal no disponible si no se persistieron bytes |
| V31 · Aplicación de crédito | A-PAG-07 / F16 | Reduce deuda/crédito sin contabilizar nueva recaudación |
| V32 · Devolución de crédito | A-PAG-08 / F16 | Registra salida real declarada y evita devolver dos veces |

## 7. Cómo se considerará lista la presentación

Se comprobará el recorrido completo y las ramas con las cifras de este documento. Las descargas y el correo de ejemplo usarán el mismo corte y filtros que la vista. Las operaciones rechazas no cambiarán saldos; las inciertas se consultarán antes de repetirse. Los mocks cubrirán los casos relevantes, además de la pantalla de éxito.

El resultado de esta revisión se anotará por escenario: correcto, pendiente o bloqueado por una regla de negocio aún no definida. No se declarará completo un botón que solo muestra un mensaje de éxito sin producir el efecto previsto.
