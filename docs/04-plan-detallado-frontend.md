# Plan detallado del frontend — acciones, paneles y estados

Fecha: 12 de octubre de 2026. Estado: especificación para implementar la presentación en Next.js.

Complementa [el diseño inicial](02-frontend-presentacion.md). Los ciclos del sistema están en [los diagramas F00–F16](03-flujos-funcionales.md). Si una acción inicial agrupaba aprobación y desembolso, prevalece el desglose de este documento. La presentación ya está implementada; [la entrega](06-frontend-implementado.md) describe su alcance efectivo. El backend e integraciones externas siguen pendientes.

## 1. Contrato común de los botones

Cada acción tiene identificador estable para localizarla en componentes, diagramas y pruebas de presentación. Las etiquetas visibles serán humanas; los identificadores no aparecerán en el producto.

| Momento | Comportamiento común |
|---|---|
| Abrir | Mantener cliente/préstamo/cuota/fecha de origen; enfocar el título o primer campo adecuado |
| Editar | Validar formato y reglas; mostrar errores junto al campo; no borrar entradas válidas |
| Revisar | Mostrar resumen del efecto antes de registrar dinero o cambiar condiciones |
| Confirmar | Deshabilitar confirmaciones repetidas; indicar guardado y conservar la misma clave de operación |
| Éxito | Mostrar objeto confirmado; actualizar vistas vinculadas; ofrecer siguiente acción contextual |
| Rechazo | Explicar regla, campo o permiso; conservar valores y permitir corrección |
| Conflicto de versión | Mostrar el nuevo saldo/estado y exigir volver a revisar |
| Resultado incierto | Mostrar «Estamos comprobando el resultado»; ofrecer Comprobar resultado con la misma clave |
| Cancelar / cerrar | Sin cambios: cerrar; con cambios: Seguir editando o Descartar cambios |
| Descarga fallida | Reintentar la descarga sin volver a registrar la operación |

Las acciones que consultan o filtran no necesitan confirmación. Las que cambian dinero, contrato, responsables o archivo histórico sí muestran el efecto concreto. Las confirmaciones estarán dentro del panel derecho activo.

## 2. Paneles y navegación interna

Todos los P-* comparten entrada desde la derecha, fondo desenfocado, título/contexto, botón Cerrar y pie de acciones. Panel estándar de 520 px, panel amplio de hasta 720 px para cronogramas o expedientes; en móvil, ancho completo. Se aplican los temas Blanco, Negro y Navi.

| Panel | Contenido y propósito | Recorrido interno |
|---|---|---|
| P-CLI-ALTA / P-CLI-EDITAR | Identidad, contacto, dirección y asignación | Datos → Guardar → Expediente; adjuntos después del alta |
| P-CLI-EXPEDIENTE | Resumen, Préstamos, Pagos, Documentos, Ubicación, Gestiones | Pestañas y acciones relacionadas con botón Volver |
| P-CLI-ASIGNAR / P-CLI-ARCHIVAR | Responsable o archivo de cliente | Selección → efecto → confirmación |
| P-PRE-NUEVO | Cliente, condiciones y simulación | Cliente → Condiciones → Cronograma → Revisión |
| P-PRE-APROBAR | Condiciones vigentes y facultad de aprobación | Revisión → aprobación, sin registrar dinero |
| P-PRE-DESEMBOLSO | Evidencia de entrega ya realizada | Datos de entrega → Revisión → Registrar |
| P-PRE-CRONOGRAMA / P-PRE-HISTORIAL | Cuotas y versiones | Consultar; volver al préstamo sin perder filtros |
| P-PAG-REGISTRO / P-PAG-REVISION | Pago y distribución a conceptos/cuotas | Datos → Distribución → Confirmación |
| P-PAG-CREDITO | Crédito disponible, aplicación o devolución | Selección → desglose → confirmar → comprobante |
| P-PAG-COMPROBANTE | Pago confirmado, referencia y archivo | Descargar, ver préstamo o registrar otro pago |
| P-AJU-PREPAGO / P-AJU-LIQUIDACION | Propuesta de aplicación financiera | Parámetros → cálculo → revisión → pago |
| P-AJU-REPROGRAMAR | Antes/después, motivo y versión | Condiciones → propuesta → autorización → nueva versión |
| P-AJU-REVERSO | Pago original, dependencias y efecto del reverso | Motivo → impacto → confirmar o bloqueo explicado |
| P-CAL-EVENTO / P-CAL-RESULTADO | Horario, responsable, visita/tarea y resultado | Crear/editar → guardar; completar → gestión |
| P-GES-CONTACTO / P-GES-PROMESA | Resultado del contacto y compromiso de pago | Gestión → compromiso opcional → seguimiento |
| P-DOC-CARGA / P-DOC-VISTA | Selección, clasificación y vista previa | Archivo → validar → vincular → consultar |
| P-LOC-UBICACION | Foto, dirección, origen y punto | Proponer → ajustar → confirmar o guardar pendiente |
| P-REP-VISTA | Reporte con corte, filtros, tabla y totales | Revisar → detalle, descargar o preparar correo |
| P-REC-REGLA / P-REC-CORREO / P-REC-HISTORIAL | Regla, contenido y resultado de envío | Editar → previa → simular → historial |
| P-CFG-TASA / P-CFG-ASIGNACION | Tasas por rango y cartera de usuarios | Validar → revisar efecto → guardar |
| P-CFG-NEGOCIO / P-CFG-USUARIO | Parámetros y usuarios ficticios | Editar → validar → guardar |
| P-GLO-BUSQUEDA / P-GLO-AVISOS | Resultados globales y avisos | Seleccionar → detalle con retorno |
| P-DEM-REINICIO | Pérdida de cambios ficticios | Revisar → restaurar escenario o cancelar |

Un único panel está abierto. Si se pasa del expediente al pago, el contenido cambia y conserva una ruta de retorno. Volver conserva filtros, scroll y datos de navegación; no duplica la ficha ni abre capas sucesivas. El panel se cierra con Escape, Cerrar o fondo cuando no hay cambios pendientes; el diálogo de descartar vive en ese mismo panel.

## 3. Acciones globales e Inicio

| ID / etiqueta | Habilitación y entrada | Resultado esperado y recuperación |
|---|---|---|
| A-GLO-01 · Buscar | Texto: nombre, documento, teléfono o código | P-GLO-BUSQUEDA; resultados agrupados por cliente/préstamo; vacío ofrece Crear cliente; elegir abre detalle |
| A-GLO-02 · Nuevo | Siempre en roles con alguna acción de alta | Menú con Nuevo cliente, Nuevo préstamo, Registrar pago y Nueva actividad según permisos |
| A-GLO-03 · Notificaciones | Hay avisos o estado vacío | P-GLO-AVISOS; Ver detalle abre cuota/promesa/envío; avisos resueltos se actualizan desde datos |
| A-GLO-04 · Blanco / Negro / Navi | Siempre | Cambia también tablas, calendario, gráficos, menús y paneles; conserva preferencia |
| A-GLO-05 · Contraer menú | Siempre | Contrae/expande sin perder ruta ni panel abierto |
| A-GLO-06 · Cambiar rol de presentación | Modo demo | Actualiza visibilidad y cartera ficticia; si invalida un panel abierto, explica y retorna a una vista permitida |
| A-INI-01 · Cambiar período | Fechas o período predefinido válido | Recalcula indicadores y gráfico desde la misma consulta; error si inicio supera fin |
| A-INI-02 · Ver cartera | Tiene permiso de consulta | Préstamos activos con filtros conservados y período indicado |
| A-INI-03 · Ver vencidas | Tiene permiso de cobranza/consulta | Cobranzas, pestaña Vencidas; importe pendiente al corte |
| A-INI-04 · Ver próximas | Tiene permiso de consulta | Calendario con próximas cuotas; leyenda del rango |
| A-INI-05 · Ver agenda completa | Siempre dentro de cartera permitida | Calendario/Agenda para el intervalo seleccionado |
| A-INI-06 · Ver reporte del día | Dueño/jefe o permiso de reportes | P-REP-VISTA con fecha y alcance visibles |
| A-DEM-01 · Restaurar presentación | Modo demo | P-DEM-REINICIO; borra solo cambios ficticios y restaura el escenario seleccionado |
| A-DEM-02 · Cambiar escenario | Modo demo | Selector: normal, mora, sin resultados, fallo de envío y resultado de pago incierto; avisa antes de descartar cambios |

Los importes de Inicio tendrán definición visible: **capital pendiente**, **recaudación neta del período** (pagos menos reversos), **importe vencido** y **próximas cuotas**. No se sumarán monedas distintas en una sola cifra. Vence hoy se distinguirá de vencida: una cuota de hoy no está atrasada todavía.

## 4. Clientes y expediente — F02

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-CLI-01 · Nuevo cliente | Permiso de alta; nombres, apellidos, tipo/documento y al menos un medio de contacto | P-CLI-ALTA; Guardar crea ficha; duplicado ofrece Ver cliente existente; adjuntos fallidos no repiten el alta |
| A-CLI-02 · Ver expediente | Cliente visible en cartera | P-CLI-EXPEDIENTE; pestañas muestran el mismo cliente y todos sus préstamos autorizados |
| A-CLI-03 · Editar cliente | Permiso y versión vigente; formato/documento únicos | P-CLI-EDITAR; Guardar actualiza ficha; conflicto pide revisar diferencias |
| A-CLI-04 · Asignar responsable | Dueño/jefe; responsable activo | P-CLI-ASIGNAR; muestra antes/después; actividades futuras se revisan por separado |
| A-CLI-05 · Archivar cliente | Permiso; sin préstamo activo ni saldo a favor pendiente | P-CLI-ARCHIVAR; motivo y confirmación; si hay deuda, Ver préstamos en lugar de archivar |
| A-CLI-06 · Reactivar cliente | Cliente archivado y permiso | Confirmación contextual; vuelve a estar disponible para préstamos nuevos; conserva historial |
| A-CLI-07 · Filtrar / Aplicar / Limpiar / Exportar CSV | Filtros por distrito, deuda, responsable y etiquetas | Panel de filtros; Aplicar conserva criterios; Limpiar restablece alcance permitido; CSV de resultados filtrados |

Campos obligatorios de la propuesta: nombres, apellidos, tipo/número de documento y teléfono o correo. Dirección y foto son recomendables para visitas; pueden quedar pendientes. DNI: texto de ocho dígitos para el tipo peruano, sin consulta oficial de identidad. Otros tipos tendrán su propia validación al habilitarlos. Correo opcional con formato válido; teléfono almacenado como texto para conservar prefijos.

Botones internos del alta: **Guardar cliente**, **Cancelar**, **Ver cliente existente** si hay duplicado. Después de guardar: **Añadir documentos**, **Completar ubicación**, **Nuevo préstamo**, **Volver a clientes**. Estas acciones usan A-DOC-01, A-LOC-01 y A-PRE-01 con el cliente ya seleccionado.

Expediente, pestaña Resumen: documento/contacto, responsable, dirección, ubicación y condición de cartera. Cada importe indica si es capital, cuota o deuda exigible. Préstamos muestra borradores y aprobados por separado de activos. Pagos muestra registrados y reversados, con comprobantes. Gestiones muestra fechas, resultados y compromisos, sin reescribir sus autores.

## 5. Préstamos — F05

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-PRE-01 · Nuevo préstamo | Cliente activo; permiso de crear | P-PRE-NUEVO; si no hay cliente seleccionado, primer paso de búsqueda; permite alta y retorno |
| A-PRE-02 · Aplicar regla de tasa | Capital/plazo/método válidos y regla vigente inequívoca | Muestra tasa, tipo y origen; si falta regla, explica y permite excepción solo con permiso |
| A-PRE-03 · Simular / Actualizar simulación | Capital mayor que cero; cuotas enteras positivas; fechas válidas; tasa no negativa | Cronograma mensual y resumen; cambiar un campo marca la simulación desactualizada y bloquea aprobar hasta recalcular |
| A-PRE-04 · Guardar borrador | Campos mínimos válidos | Conserva condiciones editables; no activa deuda ni eventos; ofrece Seguir editando o Ver borrador |
| A-PRE-05 · Aprobar condiciones | Dueño/permiso; simulación vigente; excepción con motivo | P-PRE-APROBAR; revalida y guarda versión; éxito ofrece Registrar desembolso |
| A-PRE-06 · Registrar desembolso | Préstamo aprobado sin desembolso; permiso; entrega efectivamente realizada | P-PRE-DESEMBOLSO; fecha, importe aprobado, método y referencia; confirma una sola vez y activa cuotas |
| A-PRE-07 · Ver cronograma / Descargar PDF | Simulación o préstamo disponible | P-PRE-CRONOGRAMA; cuotas y conceptos; PDF mantiene corte y versión; error de archivo no altera préstamo |
| A-PRE-08 · Ver historial | Préstamo visible | P-PRE-HISTORIAL; versiones de condiciones y cronograma, pagos, ajustes y autores |
| A-PRE-09 · Cancelar borrador o aprobado sin desembolso | Permiso; sin entrega registrada | Motivo y efecto visibles; si ya está activo, la acción no se ofrece y se muestra el flujo de liquidación/ajuste |

Campos de condiciones: cliente, capital, moneda, método (francés o simple identificado), tipo de tasa, tasa, número de cuotas mensuales, fecha de desembolso prevista, primer vencimiento, responsable y nota. La tasa individual necesita permiso y motivo. Capital y cuotas de un préstamo ya desembolsado no se editan mediante este formulario.

Para el cronograma mensual convencional se conservará el día pactado; si no existe en un mes, se utilizará el último día de ese mes, sin desplazar sucesivamente los meses siguientes. La demo lo indicará como convención; el cálculo por días reales se acuerda antes de habilitarlo. La primera fecha de pago debe ser posterior al desembolso. Tasas y cargos no validados para el negocio no se presentarán como recomendaciones.

Botones por paso: **Continuar**, **Volver**, **Simular**, **Guardar borrador**, **Revisar aprobación**. El cierre propone descartar únicamente cambios no guardados. Tras aprobación aparecen **Registrar desembolso** y **Volver al préstamo**; no se afirma que se entregó dinero todavía.

## 6. Cobranzas y pagos — F06 y F15

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-PAG-01 · Registrar pago / Pagar cuota | Préstamo activo y cartera autorizada | P-PAG-REGISTRO; conserva cuota de origen; si hay varios préstamos, exige seleccionar uno |
| A-PAG-02 · Revisar distribución | Importe positivo; fecha permitida; método; destino completo | P-PAG-REVISION; muestra aplicación por cuota/concepto y saldos; exceso exige elegir cuotas futuras, prepago o saldo a favor |
| A-PAG-03 · Confirmar pago | Desglose vigente; datos válidos | Registra una vez; spinner/botón bloqueado; éxito va a comprobante; conflicto obliga a revisar nuevo desglose |
| A-PAG-04 · Ver / Descargar comprobante | Pago confirmado visible | P-PAG-COMPROBANTE; descarga PDF ficticio; reintentar descarga conserva el mismo pago |
| A-PAG-05 · Comprobar resultado / Reintentar operación | Petición rechazada por fallo confirmado o respuesta incierta | Usa la misma clave; pago existente retorna su comprobante; sin conexión conserva datos y estado incierto |
| A-PAG-06 · Filtrar pagos / Ver detalle / Exportar CSV | Fecha, responsable, método, registrado/reversado | Filtra movimientos; incluye signo/estado del reverso; no confunde bruto y neto |

Campos del pago: préstamo, cuotas elegidas, importe, fecha efectiva, método, referencia, comprobante opcional y nota. Fecha futura no se acepta como cobro ya realizado. Si se registra un pago de fecha anterior y hay operaciones financieras posteriores, la demo explicará el bloqueo de ese caso hasta definir su recálculo. Un pago normal puede ser de hoy; una promesa futura se registra en Gestiones.

Distribución visible: número de cuota, vencimiento, saldo anterior, interés aplicado, capital aplicado, mora si está habilitada y saldo posterior. Mora cero en el escenario base. «Adelantar cuotas» y «Abonar a capital» serán destinos diferenciados. Si existe saldo a favor, se mantiene como crédito explícito del cliente en la misma moneda y no reduce capital por sí mismo.

Pantalla de éxito: **Ver comprobante**, **Descargar PDF**, **Ver préstamo**, **Registrar otro pago**. El último botón inicia una operación nueva; no es el mecanismo de reintento. Un comprobante opcional que falla al subirse tiene estado propio y puede añadirse después al pago confirmado.

### Ciclo del saldo a favor

El excedente reservado como crédito se mostrará en el expediente, separado de deuda y capital. Para cubrir el ciclo completo se proponen estas acciones, accesibles solo si existe crédito disponible:

| ID / etiqueta | Condiciones | Efecto |
|---|---|---|
| A-PAG-07 · Aplicar saldo a favor | Misma moneda; crédito disponible; cuotas/préstamo seleccionados y permiso | P-PAG-CREDITO; revisión del crédito utilizado y deuda cubierta; registra aplicación, sin contabilizar un nuevo ingreso de dinero |
| A-PAG-08 · Registrar devolución | Crédito disponible; permiso del dueño; devolución efectivamente realizada | P-PAG-CREDITO; motivo, fecha, método y evidencia; registra salida y reduce crédito; no ejecuta transferencia bancaria |

El backend necesitará movimientos de crédito y devoluciones, además de pagos. La presentación reproducirá este libro con movimientos ficticios y mostrará ambas operaciones de F16. El escenario de validación específico comprobará que no se contabilice dos veces el mismo ingreso.

## 7. Ajustes financieros — F07, F08 y F09

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-AJU-01 · Simular prepago / Confirmar prepago | Préstamo activo; importe y fecha; política admitida | P-AJU-PREPAGO; elegir reducir plazo/cuota; muestra vencido y aplicación a capital; confirma pago y nueva versión si corresponde |
| A-AJU-02 · Calcular liquidación / Confirmar liquidación | Fecha de corte permitida; préstamo con obligaciones | P-AJU-LIQUIDACION; capital y conceptos devengados separados; confirma pago; si saldo cambia, recalcula antes de cerrar |
| A-AJU-03 · Reversar pago / Confirmar reverso | Permiso; pago registrado sin reverso; motivo obligatorio | P-AJU-REVERSO; efecto visible; dependencias bloquean el reverso directo; éxito conserva original y movimiento compensatorio |
| A-AJU-04 · Proponer reprogramación / Guardar propuesta | Préstamo activo; deuda remanente; motivo y nuevas fechas válidas | P-AJU-REPROGRAMAR; tabla antes/después; guardar no cambia agenda contractual |
| A-AJU-05 · Aprobar y aplicar reprogramación | Dueño/permiso; propuesta válida y versión vigente | Nueva versión remanente; conserva pagos; elimina del calendario vigente los vencimientos sustituidos; conflicto pide recalcular |

Prepago: saldo de capital, vencido actual, importe, fecha y elección de reducción. No se muestra una cuota «reducida» sin haber calculado su cronograma. Liquidación: total por fecha, vigencia de propuesta y conceptos; imprimir una cotización no liquida el préstamo.

Reverso: pago, autor, fecha, importe, motivo, cuotas afectadas y dependencias. Para corregir un pago, tras reversar se ofrece **Registrar pago corregido**, precargando solo el contexto y creando una clave nueva.

Reprogramación: deuda remanente, plazos/fechas nuevos, interés/cargos identificados y motivo. Botones **Calcular propuesta**, **Guardar propuesta**, **Aprobar y aplicar**, **Cancelar**. El panel avisa si un pago posterior cambió la base del cálculo. No se activan dos cronogramas contractuales simultáneos.

## 8. Calendario y actividades — F10

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-CAL-01 · Hoy / Anterior / Siguiente / Mes / Semana / Día / Agenda | Consulta autorizada | Cambia intervalo/vista sin perder filtros; Hoy usa fecha de negocio de la demo |
| A-CAL-02 · Nueva actividad / Guardar actividad | Responsable activo, tipo y fecha; fin posterior a inicio | P-CAL-EVENTO; fecha del día pulsado precargada; solapamiento avisa y permite confirmar |
| A-CAL-03 · Ver evento / Más eventos | Evento dentro de alcance | Panel de cuota, actividad o promesa según tipo; ofrece acciones correspondientes y Volver |
| A-CAL-04 · Mover actividad / Confirmar horario | Visita/tarea pendiente; permiso; nuevo horario válido | Resumen antes/después; cancelar o falla restaura posición; no admite arrastrar cuotas |
| A-CAL-05 · Completar actividad / Guardar resultado | Actividad pendiente y asignada/permiso | P-CAL-RESULTADO; resultado y nota; opcional próxima visita, promesa o paso a pago |
| A-CAL-06 · Cancelar actividad / Filtrar / Limpiar | Cancelación con motivo; filtros por cliente, tipo, responsable y estado | Cancelar conserva historial; filtros actualizan calendario y agenda del día; actividades pasadas no se eliminan |

Detalle de cuota: cliente, código de préstamo, número, fecha, capital/interés previstos, pagado, pendiente y días de atraso cuando aplica. Botones **Registrar pago**, **Ver préstamo**, **Ver cliente**, **Proponer reprogramación** según permiso. Cuota pagada ofrece comprobantes en vez de otra confirmación del mismo pago.

Detalle de visita: horario, dirección/punto confirmado o pendiente, responsable, estado y nota. Botones **Abrir Google Maps**, **Editar**, **Completar visita**, **Cancelar visita**. Si no hay punto confirmado, Maps puede abrir una búsqueda por dirección identificada como aproximada.

Se propondrá actualizar automáticamente responsable de cliente para nuevas actividades. Las actividades ya creadas conservan su asignación hasta que se confirme transferirlas. Cambiar de mes no modifica el corte de los reportes abiertos en otros módulos.

## 9. Gestiones y promesas — F11

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-GES-01 · Registrar contacto / Guardar gestión | Cliente visible; tipo, fecha y resultado | P-GES-CONTACTO; registra llamada/visita sin modificar dinero; opcional próxima acción |
| A-GES-02 · Crear promesa / Guardar compromiso | Préstamo activo; importe positivo, fecha y responsable | P-GES-PROMESA; evento derivado; compromisos solapados piden revisar antes de duplicar |
| A-GES-03 · Vincular pago / Revisar cumplimiento | Pago del mismo préstamo; importe no comprometido doblemente | Muestra progreso; cumple solo con cobertura suficiente; si el pago se reversa reevalúa |
| A-GES-04 · Cancelar promesa / Registrar nuevo acuerdo | Motivo; permiso de gestión | Conserva anterior y crea nueva si corresponde; incumplida ofrece siguiente contacto/visita |

Los pagos parciales vinculados se muestran como progreso, no como compromiso cumplido. Promesa incumplida mantiene fecha original y días de seguimiento. Un pago posterior puede cumplirla fuera de fecha; el historial conserva el atraso. Si el acuerdo cambia condiciones del préstamo, el panel remite a A-AJU-04.

## 10. Documentos y ubicación — F03 y F04

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-DOC-01 · Cargar documento / Vincular archivo | Cliente/préstamo/pago existentes; categoría; extensión/MIME/tamaño permitidos | P-DOC-CARGA; progreso por archivo; falla permite reintentar uno sin repetir todo el expediente |
| A-DOC-02 · Ver documento | Disponible y autorizado | P-DOC-VISTA; imagen/PDF o mensaje de tipo sin vista previa; archivos pendientes/rechazados no se abren |
| A-DOC-03 · Descargar documento | Archivo disponible | Descarga autorizada futura/local en demo; error no borra metadatos |
| A-DOC-04 · Cambiar categoría | Permiso; categoría compatible | Guarda clasificación y nota; conserva autor del archivo original |
| A-DOC-05 · Retirar documento / Buscar / Lista / Galería | Retiro sujeto a permiso/retención; búsqueda independiente | Motivo y confirmación; en demo puede quitarse referencia ficticia; bloqueo de retención explicado |
| A-LOC-01 · Completar ubicación | Cliente visible; foto opcional, dirección o referencia | P-LOC-UBICACION; muestra estado pendiente y origen del punto |
| A-LOC-02 · Proponer por dirección | Dirección suficiente | Propuesta etiquetada; sin resultado ofrece Ajustar punto; demo informa simulación |
| A-LOC-03 · Ajustar punto / Confirmar punto | Coordenadas válidas y decisión explícita | Conserva autor/fecha de confirmación; cambiar dirección después marca que la ubicación necesita revisión |
| A-LOC-04 · Guardar pendiente | Dirección o referencia ingresada | Conserva datos sin inventar coordenadas ni confirmación |
| A-LOC-05 · Abrir Google Maps / Copiar enlace | Punto o dirección disponibles | Punto confirmado abre coordenadas; pendiente abre dirección aproximada; sin datos ofrece Completar ubicación |

Propuesta de archivos para la demo: JPG/PNG/WebP y PDF, hasta 10 MB por archivo, ajustable en implementación. No se incrustan datos reales en los recursos de muestra. Metadatos mínimos: categoría, propietario, nombre, tamaño, fecha y disponibilidad. No se guardan los bytes en localStorage.

La miniatura de fachada tiene acción Ver foto. La carga no dispara una afirmación «Google encontró la casa». El panel de ubicación incluye estado, procedencia, dirección y coordenadas, además del mapa de ejemplo.

## 11. Reportes — F13

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-REP-01 · Elegir reporte / Aplicar filtros | Tipo, corte y período coherentes; cartera autorizada | Recalcula tabla/gráfico desde misma fuente; sin registros muestra Cambiar filtros |
| A-REP-02 · Generar vista previa / Ver detalle | Criterios válidos; objeto relacionado visible | P-REP-VISTA; corte/filtros/totales; Ver detalle conserva reporte para Volver |
| A-REP-03 · Descargar PDF / CSV | Consulta completada | Archivo de la misma consulta; reintento no altera pagos; PDF identifica datos ficticios |
| A-REP-04 · Preparar correo al dueño | Permiso; destinatario de ejemplo válido | P-REC-CORREO; muestra contenido exacto y ofrece Simular envío |

Tipos iniciales: cartera activa por capital, vencimientos, mora por cuota, recaudación bruta/netos y estado de cuenta individual. Las exportaciones incluyen moneda, fecha de corte, período y filtros; las celdas no convierten referencias/documentos a números. No habrá un botón Excel que en realidad produzca CSV.

Antigüedad de mora propuesta: 1–7, 8–30, 31–60, 61–90 y más de 90 días; Vence hoy fuera de esos grupos. Es una agrupación operativa, no una clasificación regulatoria. Se puede explorar un tramo y volver sin perder filtros.

## 12. Recordatorios — F12

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-REC-01 · Nueva regla / Guardar regla | Tipo, destinatario, anticipación/frecuencia, hora y zona | P-REC-REGLA; detecta duplicidad exacta; correo de ejemplo válido; no solicita credenciales en demo |
| A-REC-02 · Editar regla | Permiso y versión vigente | Conserva envíos históricos; cambios aplican a generación futura |
| A-REC-03 · Activar / Pausar | Regla válida para activar | Confirma alcance; pausar evita nuevos despachos pendientes de esa regla; no retira correos ya aceptados |
| A-REC-04 · Vista previa / Preparar resumen | Regla o reporte con parámetros válidos | P-REC-CORREO; destinatario, asunto, corte y cuotas/deudores; sin datos muestra regla de omitir/reporte vacío |
| A-REC-05 · Simular envío / Simular reintento | Solo demo; contenido relevante y envío no aceptado | Añade resultado ficticio; fallo confirmado permite reintento; desconocido ofrece Consultar resultado antes de reenviar |
| A-REC-06 · Ver historial / Consultar resultado | Envío visible | P-REC-HISTORIAL; intentos, fecha, estado y error; distingue aceptado de entregado/leído |

Regla de demostración: avisos a 7, 3 y 1 día, resumen de hoy y mora, hora configurable de America/Lima. El usuario elige si se omite un reporte sin registros. Antes de despachar se reevaluará lo pagado. Una regla pausada puede conservar el historial; un envío en curso aceptado no se puede recuperar por pausar después.

## 13. Configuración — F14

| ID / etiqueta | Condiciones y validación | Efecto, panel y recuperación |
|---|---|---|
| A-CFG-01 · Guardar negocio | Dueño; nombre y datos válidos | P-CFG-NEGOCIO; cambiar moneda base no convierte préstamos ya registrados; zona cambia presentación futura según alcance revisado |
| A-CFG-02 · Nueva tasa / Editar / Desactivar | Rango, tipo de tasa, método, plazo y vigencia inequívocos | P-CFG-TASA; conflictos por rangos solapados; versión nueva no altera contratos existentes |
| A-CFG-03 · Nuevo usuario / Editar / Desactivar | Nombre, rol y estado; al menos un administrador activo | P-CFG-USUARIO; al desactivar muestra tareas pendientes y exige reasignarlas o confirmarlas con otro responsable |
| A-CFG-04 · Asignar cartera | Usuarios y clientes activos; permiso | P-CFG-ASIGNACION; antes/después y decisión sobre visitas futuras; actualiza acceso sin cambiar autoría histórica |
| A-CFG-05 · Revisar política de cobranza | Dueño | Muestra imputación, mora y periodicidades; en demo base mantiene mora cero; parámetros no implementados se identifican y no simulan efectos |

Las acciones del dueño aparecerán disponibles en su rol de demo. El cobrador consulta su cartera, registra contactos y pagos; no cambia tasas, no aprueba ajustes y no reversa. El jefe administra gestiones y asignaciones según permisos propuestos, sin heredar automáticamente facultades financieras.

## 14. Contratos de datos para los mocks y el backend futuro

| Operación conceptual | Entrada imprescindible | Salida que el frontend necesita |
|---|---|---|
| Crear/editar cliente | Identidad, contacto, responsable; versión al editar | Cliente, versión y estado; código de duplicado y cliente existente autorizado |
| Simular préstamo | Condiciones y regla/excepción | Identificador de simulación, condiciones, cuotas y desglose |
| Aprobar préstamo | Borrador, simulación y versión | Condiciones fijadas y estado aprobado |
| Registrar desembolso | Préstamo aprobado, fecha, referencia y clave de operación | Estado activo, versión, cuotas y registro de entrega |
| Simular/registrar pago | Fecha, importe, destinos y versión; clave al confirmar | Aplicación, saldos, estado, identificador de pago y comprobante |
| Proponer/aplicar ajuste | Préstamo, motivo, parámetros y versión | Antes/después, dependencias, propuesta y nueva versión cuando se aplica |
| Registrar gestión/promesa | Cliente/préstamo, resultado, fecha e importe si aplica | Gestión, compromiso y evento derivado |
| Actividad de calendario | Intervalo, responsable y versión | Actividad confirmada y eventual aviso de solapamiento |
| Adjuntar archivo | Objeto propietario, categoría y archivo | Identificador, estado de carga/validación y disponibilidad |
| Confirmar ubicación | Coordenadas, dirección, origen y versión | Estado, autor/fecha y enlace |
| Generar reporte | Tipo, fecha de corte, período, filtros | Filas, totales, criterios y versión/instante de consulta |
| Preparar/envío de correo | Regla, destinatario y corte | Contenido, identificador de envío, estado e intentos |

Los mensajes normalizados serán: **campo inválido**, **documento duplicado**, **sin permiso**, **estado no permite acción**, **saldo/versión cambió**, **resultado pendiente de comprobar**, **archivo no disponible** y **envío fallido/desconocido**. Los códigos técnicos no se mostrarán al cliente; el mensaje indicará qué puede hacer.

Cada mock reproducirá éxito y al menos los errores relevantes del flujo. La presentación no devolverá éxito a todos los botones de forma indiscriminada. La actualización de vistas tendrá una sola fuente: la operación confirmada modifica el estado compartido; los módulos vuelven a calcular sus consultas.

## 15. Plan de construcción de la presentación

| Orden | Trabajo | Condición de cierre |
|---|---|---|
| 1 | Estructura Next.js, navegación, temas y panel común | Acceso a nueve pantallas; teclado y retorno del panel funcionan |
| 2 | Contratos, reloj de demo y escenarios ficticios | Los mismos datos alimentan Inicio, tablas, calendario y reportes |
| 3 | Clientes y expediente | Alta, duplicado, edición, asignación y archivo completos |
| 4 | Préstamos y cronograma | Borrador, simulación, aprobación y desembolso diferenciados |
| 5 | Pagos y ajustes | Pago parcial/total, clave de operación, reverso, prepago y propuesta de ajuste |
| 6 | Calendario y gestiones | Cuotas derivadas; visitas editables; promesas vinculadas |
| 7 | Archivo y ubicación | Carga local, disponibilidad y confirmación sin reconocimiento ficticio |
| 8 | Reportes y recordatorios | Totales coherentes, PDF/CSV y envío simulado con fallos |
| 9 | Usuarios, reglas y revisión de presentación | Permisos de demo y escenarios de validación completos |

Salida de esta fase de planificación: inventario de acciones, contenido de paneles, respuestas esperadas y [escenarios para mostrar al cliente](05-escenarios-presentacion.md). La implementación comienza después de esta definición; los diagramas no implican que FastAPI ni PostgreSQL ya estén disponibles.
