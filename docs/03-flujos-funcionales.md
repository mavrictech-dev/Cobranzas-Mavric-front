# Diagramas funcionales — ciclos del backend y consecuencias en el frontend

Fecha: 12 de octubre de 2026. Etapa: planificación; estos diagramas no representan un backend implementado.

Este documento detalla la [arquitectura](01-arquitectura.md) y alimenta el [plan de acciones del frontend](04-plan-detallado-frontend.md). Los flujos describen el sistema real; la presentación de Next.js reproducirá sus respuestas con datos ficticios.

## Convenciones y decisiones de la propuesta

- Rectángulo: acción o procesamiento. Rombo: decisión. Nodo redondeado: entrada o resultado. Los caminos negativos indican cómo recuperarse.
- F00–F16 identifican flujos. A-* identifica acciones del frontend; P-* identifica paneles. Los identificadores conectan los documentos.
- Se proponen cuotas mensuales, moneda PEN y zona America/Lima. El dueño aprueba condiciones, desembolsos, reversos y reprogramaciones; otros roles solo podrán hacerlo si reciben ese permiso.
- Aprobar un préstamo y registrar la entrega del dinero son operaciones diferentes. Registrar un desembolso o un pago no ejecuta una transferencia bancaria.
- La ubicación de una casa necesita confirmación. Un préstamo puede existir con ubicación pendiente; el dato se destaca para organizar visitas.
- Un pago confirmado no se edita ni se borra. Se reversa y, si corresponde, se registra uno nuevo.
- Una promesa de pago modifica la agenda de gestión; una reprogramación modifica condiciones financieras.
- Reprogramación y prepago conservan versiones. Un reverso de un pago anterior a una reprogramación requiere revisión de esa relación; no se aplicará una restauración automática incorrecta.

## Mapa de funcionalidades

```mermaid
flowchart LR
    A[Plataforma de cobranzas] --> B[Clientes y expediente]
    A --> C[Préstamos y condiciones]
    A --> D[Pagos y ajustes]
    A --> E[Gestiones y promesas]
    A --> F[Calendario de cuotas y visitas]
    A --> G[Documentos y ubicación]
    A --> H[Reportes y recordatorios]
    A --> I[Usuarios, tasas y configuración]
    B --> B1[Buscar, registrar, editar y asignar]
    C --> C1[Simular, aprobar y registrar desembolso]
    D --> D1[Cobrar, aplicar crédito, liquidar y reversar]
    E --> E1[Contactar, acordar y comprobar cumplimiento]
    F --> F1[Consultar agenda, mover visitas y completar tareas]
    G --> G1[Adjuntar, consultar y confirmar punto]
    H --> H1[Filtrar, exportar, preparar correo y revisar resultado]
    I --> I1[Administrar reglas, permisos y cartera]
```

El dueño supervisa toda la operación y autoriza decisiones financieras. El jefe organiza la cartera y seguimiento según permisos. El cobrador actúa sobre clientes asignados. El perfil Consulta lee lo autorizado. Todas las funciones de dinero están relacionadas con un préstamo, y todas las actividades de gestión conservan su cliente y responsable.

## F00. Ciclo completo del negocio

```mermaid
flowchart TD
    A([Buscar o registrar cliente]) --> B[Completar expediente y asignar responsable]
    B --> C[Simular préstamo y revisar cronograma]
    C --> D[Guardar borrador]
    D --> E{¿Condiciones aprobadas?}
    E -- No --> C
    E -- Sí --> F[Registrar desembolso realizado]
    F --> G[Activar préstamo y cuotas]
    G --> H[Mostrar vencimientos en calendario]
    H --> I{¿Hay pago?}
    I -- Sí --> J[Registrar y distribuir pago]
    J --> K{¿Obligaciones pendientes?}
    K -- No --> L([Liquidado con historial conservado])
    K -- Sí --> H
    I -- No --> M{¿Cuota vencida?}
    M -- No --> N[Preparar aviso y próximas acciones]
    N --> H
    M -- Sí --> O[Marcar atraso y gestionar cobranza]
    O --> P{¿Resultado de gestión?}
    P -- Pago --> J
    P -- Promesa o visita --> Q[Agendar seguimiento sin cambiar contrato]
    P -- Solicitud de ajuste --> R[Proponer reprogramación autorizada]
    Q --> H
    R --> H
```

Lo que el cliente verá: alta de cliente, préstamo con borrador/aprobación/desembolso, cuotas en calendario, abonos, atraso, gestiones y cierre. Cada saldo se deriva de los mismos movimientos y condiciones.

## F01. Acceso, permisos y ejecución de una operación

```mermaid
flowchart TD
    A([Usuario inicia una acción]) --> B{¿Sesión válida?}
    B -- No --> C[Solicitar acceso y conservar formulario local]
    C --> B
    B -- Sí --> D{¿Permiso y cartera autorizados?}
    D -- No --> E([Mostrar acceso insuficiente])
    D -- Sí --> F[Validar entrada y estado actual]
    F --> G{¿Datos válidos?}
    G -- No --> H[Devolver errores por campo o regla]
    H --> I[Corregir conservando los datos]
    I --> F
    G -- Sí --> J{¿Versión sigue vigente?}
    J -- No --> K[Mostrar cambios y solicitar nueva revisión]
    K --> I
    J -- Sí --> L[Ejecutar caso de uso y guardar resultado]
    L --> M[Registrar auditoría cuando corresponda]
    M --> N([Devolver estado actualizado])
```

Frontend: las acciones sin permiso se ocultarán o mostrarán una explicación útil, pero la protección real estará en FastAPI. En la demo habrá selector de rol y respuesta de permiso simulado; no se pedirán contraseñas reales. Cancelar un formulario no crea una operación de negocio.

## F02. Cliente: buscar, crear, editar, asignar y archivar

```mermaid
flowchart TD
    A([Buscar por nombre, DNI o teléfono]) --> B{¿Existe?}
    B -- Sí --> C[Abrir expediente existente]
    B -- No --> D[Abrir Nuevo cliente]
    D --> E[Ingresar identidad, contacto y dirección]
    E --> F{¿Formato válido y documento disponible?}
    F -- No --> G[Mostrar campos incorrectos o cliente duplicado]
    G --> E
    F -- Sí --> H[Guardar cliente y responsable]
    H --> I[Adjuntar documentos y foto en operaciones separadas]
    I --> C
    C --> J{¿Acción elegida?}
    J -- Editar --> K[Validar versión y guardar cambios]
    K --> C
    J -- Asignar --> L[Comprobar permiso y responsable activo]
    L --> C
    J -- Archivar --> M{¿Tiene deuda activa?}
    M -- Sí --> N[Explicar bloqueo y mostrar préstamos]
    N --> C
    M -- No --> O[Confirmar y archivar sin borrar historial]
    O --> P([Cliente archivado])
    J -- Crear préstamo --> Q([Continuar F05])
```

A-CLI-01 a A-CLI-07; P-CLI-ALTA, P-CLI-EXPEDIENTE y P-CLI-EDITAR. Si falla un adjunto después del alta, el cliente permanece creado y se ofrece reintentar ese archivo. El botón «Ver cliente existente» recupera el caso de documento duplicado. Un cliente archivado se puede reactivar con permiso antes de crearle otro préstamo.

## F03. Foto, dirección y punto confirmado

```mermaid
flowchart TD
    A([Abrir ubicación del cliente]) --> B[Adjuntar foto y escribir dirección o referencias]
    B --> C{¿Hay coordenadas disponibles?}
    C -- Sí --> D[Proponer punto e indicar origen]
    C -- No --> E{¿Dirección suficiente?}
    E -- Sí --> F[Solicitar propuesta por dirección]
    F --> G{¿Se obtuvo un resultado?}
    G -- Sí --> D
    G -- No --> H[Ofrecer ingreso o ajuste manual del punto]
    E -- No --> H
    H --> D
    D --> I[Mostrar foto, dirección y coordenadas]
    I --> J{¿Usuario confirma el punto?}
    J -- No --> K[Ajustar punto o guardar ubicación pendiente]
    K -- Ajustar --> I
    K -- Pendiente --> L([Expediente con ubicación pendiente])
    J -- Sí --> M[Guardar punto, autor y fecha de confirmación]
    M --> N[Construir enlace a Google Maps]
    N --> O([Ubicación confirmada y enlace disponible])
```

A-LOC-01 a A-LOC-05; P-LOC-UBICACION. La foto no acredita por sí misma la ubicación. En la demo se etiqueta la propuesta como simulada; «Confirmar punto» registra una decisión del usuario, no una verificación realizada por Google.

## F04. Ciclo de un documento

```mermaid
flowchart TD
    A([Elegir archivo y expediente]) --> B[Clasificar: foto, identidad, contrato o comprobante]
    B --> C{¿Tipo y tamaño permitidos?}
    C -- No --> D[Mostrar motivo y elegir otro archivo]
    D --> A
    C -- Sí --> E[Subir a almacenamiento temporal privado]
    E --> F{¿Carga completada?}
    F -- No --> G[Conservar expediente y permitir reintento]
    G --> E
    F -- Sí --> H[Validar contenido y finalizar vinculación]
    H --> I{¿Archivo habilitado?}
    I -- No --> J[Mostrar pendiente o rechazado sin ofrecer descarga]
    J -- Validación completada --> H
    J -- Archivo rechazado y reemplazo --> A
    I -- Sí --> K[Mostrar documento disponible]
    K --> L{¿Acción?}
    L -- Ver o descargar --> M[Comprobar permiso de acceso al expediente]
    M --> N([Entregar vista previa o descarga])
    L -- Retirar --> O[Comprobar retención y permiso]
    O --> P{¿Retiro permitido?}
    P -- No --> Q([Explicar bloqueo])
    P -- Sí --> R([Retirar referencia y registrar motivo])
```

A-DOC-01 a A-DOC-05; P-DOC-CARGA y P-DOC-VISTA. El almacenamiento y la base de datos no forman una sola transacción: se usarán cargas temporales, finalización y limpieza de archivos huérfanos. En la demo los archivos son locales; no se simulará un análisis antivirus como si hubiera ocurrido.

## F05. Simulación, borrador, aprobación y desembolso

```mermaid
flowchart TD
    A([Nuevo préstamo para cliente activo]) --> B[Ingresar capital, método, plazo y fechas]
    B --> C[Resolver regla de tasa o excepción autorizada]
    C --> D{¿Condiciones válidas?}
    D -- No --> E[Mostrar regla incumplida]
    E --> B
    D -- Sí --> F[Calcular simulación y cronograma]
    F --> G[Revisar cuota, intereses y total]
    G --> H{¿Siguiente acción?}
    H -- Cambiar condiciones --> B
    H -- Guardar borrador --> I[Guardar préstamo sin activar cobros]
    H -- Aprobar --> J[Comprobar permiso y recalcular condiciones actuales]
    I --> J
    J --> K{¿Resultado coincide con revisión?}
    K -- No --> G
    K -- Sí --> L[Guardar condiciones aprobadas y versión]
    L --> M[Solicitar datos de desembolso realizado]
    M --> N{¿Datos completos y estado aprobado?}
    N -- No --> O[Conservar aprobado y mostrar qué falta]
    O --> M
    N -- Sí --> P[Registrar desembolso una sola vez]
    P --> Q[Activar préstamo y cronograma]
    Q --> R([Actualizar cartera, expediente y calendario])
```

A-PRE-01 a A-PRE-09; P-PRE-NUEVO, P-PRE-APROBAR y P-PRE-DESEMBOLSO. Modificar condiciones invalida la simulación anterior. Borradores y aprobados sin desembolso no suman cartera activa ni generan avisos de cobro. Si se cambia la fecha efectiva de desembolso respecto a la aprobada, se vuelve a revisar el cronograma antes de activar.

## F06. Registro de pago total o parcial

```mermaid
flowchart TD
    A([Registrar pago desde cuota, préstamo o cliente]) --> B[Consultar saldo y versión vigente]
    B --> C[Ingresar importe, fecha, método y destino]
    C --> D{¿Importe y destino válidos?}
    D -- No --> E[Mostrar errores conservando el formulario]
    E --> C
    D -- Sí --> F[Mostrar distribución y saldo resultante]
    F --> G[Confirmar con clave de operación]
    G --> H{¿Esa clave ya fue procesada?}
    H -- Sí --> I[Devolver el mismo pago existente]
    H -- No --> J[Comprobar permisos y bloquear estado financiero]
    J --> K{¿Saldo coincide con el revisado?}
    K -- No --> L[Devolver nuevo desglose para revisar]
    L --> F
    K -- Sí --> M[Guardar pago y aplicaciones en una transacción]
    M --> N{¿Transacción confirmada?}
    N -- No --> O[Revertir cambios y permitir reintento]
    O --> G
    N -- Sí --> P[Calcular cuota parcial, pagada y deuda restante]
    P --> Q{¿Quedan obligaciones?}
    Q -- Sí --> R[Conservar préstamo activo]
    Q -- No --> S[Marcar préstamo liquidado]
    R --> T[Actualizar calendario, promesas e indicadores]
    S --> T
    I --> T
    T --> U([Mostrar pago confirmado y comprobante])
```

A-PAG-01 a A-PAG-06; P-PAG-REGISTRO, P-PAG-REVISION y P-PAG-COMPROBANTE. Un exceso no se acepta sin destino explícito. El comprobante se obtiene del pago ya registrado; si falla su descarga, el pago sigue válido. Si se pierde la conexión después de confirmar, se consulta/reintenta con la misma clave antes de crear otra operación.

## F07. Prepago a capital o liquidación anticipada

```mermaid
flowchart TD
    A([Simular prepago o liquidación]) --> B[Elegir fecha efectiva y consultar situación vigente]
    B --> C{¿Objetivo?}
    C -- Prepago --> D[Ingresar importe y reducción de plazo o cuota]
    C -- Liquidación --> E[Calcular capital y conceptos devengados aplicables]
    D --> F[Mostrar aplicación y propuesta de nuevo cronograma]
    E --> G[Mostrar total a liquidar y conceptos separados]
    F --> H[Revisar y confirmar]
    G --> H
    H --> I{¿Estado y cálculo siguen vigentes?}
    I -- No --> B
    I -- Sí --> J[Guardar pago, aplicaciones y versión cuando corresponda]
    J --> K{¿Liquidación completada?}
    K -- Sí --> L[Liquidar préstamo]
    K -- No --> M[Activar nuevo cronograma sin alterar el historial]
    L --> N([Actualizar saldo, calendario y comprobante])
    M --> N
```

A-AJU-01 y A-AJU-02; P-AJU-PREPAGO y P-AJU-LIQUIDACION. No se cobra automáticamente todo el interés futuro previsto. La propuesta de prepago muestra qué pasa con cuotas pendientes, intereses exigibles y capital; confirmar un prepago también registra un pago, con las mismas garantías de F06.

## F08. Reverso de un pago

```mermaid
flowchart TD
    A([Abrir pago confirmado y pedir reverso]) --> B[Comprobar permiso y estado]
    B --> C{¿Ya fue reversado?}
    C -- Sí --> D([Mostrar reverso existente])
    C -- No --> E[Ingresar motivo y revisar operaciones posteriores]
    E --> F{¿Hay cambios de cronograma dependientes?}
    F -- Sí --> G[Presentar dependencias y bloquear reverso directo]
    G --> H([Requiere propuesta de ajuste revisada por el dueño])
    F -- No --> I[Mostrar cuotas y saldos que volverán a quedar pendientes]
    I --> J[Confirmar reverso]
    J --> K{¿Versión y pago siguen vigentes?}
    K -- No --> E
    K -- Sí --> L[Guardar movimientos compensatorios y auditoría]
    L --> M[Recalcular cuotas, promesas y condición del préstamo]
    M --> N{¿Préstamo liquidado ahora tiene deuda?}
    N -- Sí --> O[Reabrir como activo]
    N -- No --> P[Conservar ciclo de vida calculado]
    O --> Q([Actualizar vistas y mostrar comprobante de reverso])
    P --> Q
```

A-AJU-03; P-AJU-REVERSO. La primera versión de demo permite reversos completos sin reprogramaciones dependientes. Un caso con dependencias muestra el bloqueo y su explicación; no inventa un cálculo correctivo. El ajuste complejo se define antes de habilitarlo en el sistema real. Si se corrige un importe, el usuario registra un nuevo pago después del reverso.

## F09. Reprogramación de cuotas

```mermaid
flowchart TD
    A([Solicitar reprogramación desde préstamo o cuota]) --> B[Consultar cronograma, pagos y versión actual]
    B --> C[Ingresar nuevas condiciones, fechas y motivo]
    C --> D[Calcular propuesta sobre obligaciones pendientes]
    D --> E{¿Propuesta válida?}
    E -- No --> F[Mostrar conflicto o fechas inválidas]
    F --> C
    E -- Sí --> G[Mostrar antes y después con desglose]
    G --> H{¿Acción?}
    H -- Cancelar --> I([Conservar cronograma vigente])
    H -- Guardar propuesta --> J[Guardar borrador de ajuste]
    J --> G
    H -- Aprobar y aplicar --> K[Comprobar permiso y versión del préstamo]
    K --> L{¿Hubo un pago u otro cambio?}
    L -- Sí --> B
    L -- No --> M[Crear nueva versión y mapa de obligaciones remanentes]
    M --> N[Conservar pagos y cuotas históricas]
    N --> O[Retirar vencimientos sustituidos de la agenda vigente]
    O --> P([Activar nuevas cuotas y recalcular avisos])
```

A-AJU-04 y A-AJU-05; P-AJU-REPROGRAMAR. Las cuotas pagadas no se convierten en impagadas al reprogramar. La cuota parcialmente pagada conserva sus aplicaciones y solo se trata su obligación remanente. La propuesta indicará cualquier cambio de intereses, cargos, plazo y total; nada se aplica por arrastrar un evento en el calendario.

## F10. Visita o tarea: creación, movimiento y cierre

```mermaid
flowchart TD
    A([Nueva actividad o clic en día vacío]) --> B[Elegir tipo, cliente, responsable y horario]
    B --> C{¿Datos válidos?}
    C -- No --> D[Corregir inicio, fin o responsable]
    D --> B
    C -- Sí --> E{¿Se cruza con otra actividad?}
    E -- Sí --> F[Mostrar aviso y permitir ajustar o confirmar]
    F -- Ajustar --> B
    F -- Confirmar --> G[Guardar actividad]
    E -- No --> G
    G --> H[Mostrar en calendario y expediente]
    H --> I{¿Acción?}
    I -- Mover --> J[Mostrar horario anterior y nuevo]
    J --> K{¿Confirmar cambio?}
    K -- No --> H
    K -- Sí --> L[Validar versión y guardar nuevo horario]
    L --> H
    I -- Completar --> M[Registrar resultado, nota y próxima acción]
    M --> N([Actividad completada y gestión guardada])
    I -- Cancelar --> O[Registrar motivo sin borrar historial]
    O --> P([Actividad cancelada])
```

A-CAL-01 a A-CAL-06; P-CAL-EVENTO y P-CAL-RESULTADO. Un solapamiento es un aviso, no un rechazo automático, en esta propuesta. Si el nuevo horario no se confirma, el calendario restaura inmediatamente la posición anterior. Completar una visita no registra un pago; se ofrece continuar a F06.

## F11. Contacto y promesa de pago

```mermaid
flowchart TD
    A([Registrar llamada, contacto o visita]) --> B[Ingresar resultado y nota]
    B --> C{¿Hay compromiso?}
    C -- No --> D[Guardar gestión y próxima acción opcional]
    C -- Sí --> E[Elegir préstamo, importe, fecha y responsable]
    E --> F{¿Datos válidos?}
    F -- No --> E
    F -- Sí --> G[Guardar promesa pendiente y evento derivado]
    G --> H[Seguir pagos vinculados al compromiso]
    H --> I{¿Qué ocurrió?}
    I -- Pago suficiente vinculado --> J[Marcar promesa cumplida]
    I -- Pago parcial --> K[Mostrar progreso y saldo prometido]
    K --> H
    I -- Fecha vencida con saldo --> L[Marcar promesa incumplida y proponer seguimiento]
    I -- Cancelación o nuevo acuerdo --> M[Guardar motivo y conservar compromiso anterior]
    M --> N[Crear nuevo compromiso si corresponde]
    D --> O([Actualizar historial de gestiones])
    J --> O
    L --> O
    N --> O
```

A-GES-01 a A-GES-04; P-GES-CONTACTO y P-GES-PROMESA. La promesa apunta a un préstamo concreto. Un pago solo cuenta para ella si se vincula; un mismo importe no satisface varias promesas de forma duplicada. Reversar ese pago reevalúa la promesa. La fecha contractual del préstamo no se modifica.

## F12. Recordatorio y reporte por correo al dueño

```mermaid
flowchart TD
    A([Llegó el horario de la regla]) --> B{¿Regla activa y destinatario configurado?}
    B -- No --> C([Sin envío; mostrar configuración pendiente si aplica])
    B -- Sí --> D[Consultar obligaciones y gestiones vigentes]
    D --> E{¿Hay contenido relevante?}
    E -- No --> F([Omitir según regla de reporte vacío])
    E -- Sí --> G[Generar resumen con fecha de corte]
    G --> H[Crear entrada única en bandeja de correo]
    H --> I[Tomar entrada pendiente con bloqueo temporal]
    I --> J[Revalidar deuda y regla antes de despachar]
    J --> K{¿Sigue siendo relevante?}
    K -- No --> L([Omitir o regenerar resumen])
    K -- Sí --> M[Enviar mediante proveedor]
    M --> N{¿Resultado?}
    N -- Aceptado --> O([Registrar aceptado por proveedor])
    N -- Fallo confirmado --> P[Registrar error e intento]
    P --> Q{¿Quedan reintentos?}
    Q -- Sí --> R[Programar próximo intento espaciado]
    R --> I
    Q -- No --> S([Mostrar fallido y acción necesaria])
    N -- Incierto --> T[Marcar resultado desconocido]
    T --> U[Consultar proveedor cuando sea posible]
    U --> V{¿Resultado conciliado?}
    V -- Aceptado --> O
    V -- No enviado --> P
    V -- Sin evidencia --> W([Mantener desconocido; revisar antes de reenviar])
```

A-REC-01 a A-REC-06; P-REC-REGLA, P-REC-CORREO y P-REC-HISTORIAL. La demo usa «Simular envío» y no llama a un proveedor. El estado visible distingue «Pendiente», «Aceptado por proveedor», «Fallido» y «Resultado desconocido». Un reporte aceptado conserva el contenido que tenía al enviarse; los reportes nuevos consultan saldos actuales.

## F13. Reportes, exportación y recuperación

```mermaid
flowchart TD
    A([Elegir reporte]) --> B[Seleccionar corte, período, moneda y responsable]
    B --> C{¿Criterios válidos y autorizados?}
    C -- No --> D[Mostrar error y conservar filtros]
    D --> B
    C -- Sí --> E[Consultar movimientos y saldos a la fecha elegida]
    E --> F{¿Hay registros?}
    F -- No --> G[Mostrar sin datos y permitir cambiar filtros]
    G --> B
    F -- Sí --> H[Mostrar totales, tabla y gráfico coherentes]
    H --> I{¿Acción?}
    I -- Cambiar filtros --> B
    I -- Ver detalle --> J[Abrir objeto relacionado sin perder reporte]
    J --> H
    I -- PDF o CSV --> K[Generar desde la misma consulta y fecha de corte]
    K --> L{¿Archivo generado?}
    L -- Sí --> M([Descargar con criterios y fecha])
    L -- No --> N[Mostrar error y permitir reintento]
    N --> K
    I -- Preparar correo --> O([Continuar en vista previa F12])
```

A-REP-01 a A-REP-04; P-REP-VISTA. Un reporte de mora incluye importes vencidos a su corte, no todo el capital pendiente. Un reporte histórico debe poder reconstruirse desde movimientos/versiones; en la demo ese comportamiento se limita a las fechas y operaciones disponibles.

## F14. Tasas, configuración y asignación de cartera

```mermaid
flowchart TD
    A([Abrir configuración autorizada]) --> B{¿Qué cambiar?}
    B -- Regla de tasa --> C[Editar rango, plazo, método y vigencia]
    C --> D{¿Hay solapamiento o tipo de tasa ambiguo?}
    D -- Sí --> E[Mostrar conflicto y corregir]
    E --> C
    D -- No --> F[Guardar nueva versión y fecha de aplicación]
    F --> G[Aplicar a simulaciones y préstamos nuevos]
    G --> H([Conservar condiciones de préstamos aprobados])
    B -- Asignación --> I[Elegir usuarios activos y clientes]
    I --> J[Mostrar cartera antes y después]
    J --> K[Confirmar asignación y registrar auditoría]
    K --> L([Actualizar permisos y agenda de responsables])
    B -- Tema --> M([Aplicar tema y guardar preferencia])
    B -- Recordatorios --> N([Continuar en edición de regla F12])
```

A-CFG-01 a A-CFG-05; P-CFG-TASA y P-CFG-ASIGNACION. Cambiar responsable de cartera no reescribe el autor de pagos anteriores. La asignación de visitas existentes se revisa explícitamente; no se traslada sin avisar. Desactivar un usuario no borra su historial ni deja actividades futuras sin responsable.

## F15. Fallo de conexión o respuesta incierta

```mermaid
flowchart TD
    A([Confirmación enviada]) --> B{¿Se recibió respuesta?}
    B -- Sí --> C{¿Resultado confirmado?}
    C -- Sí --> D([Mostrar operación y actualizar vistas])
    C -- No --> E[Mostrar rechazo y permitir corregir]
    B -- No --> F[Mostrar comprobando resultado]
    F --> G[Consultar usando la misma clave de operación]
    G --> H{¿Estado encontrado?}
    H -- Confirmado --> D
    H -- Rechazado --> E
    H -- No consta --> I[Reintentar con la misma clave cuando haya conexión]
    I --> B
    H -- Sigue sin conexión --> J([Conservar datos y ofrecer Comprobar resultado])
```

A-PAG-05 y acciones financieras equivalentes. El formulario no mostrará «No se registró» si solo falta una respuesta. No se generará otra clave al reintentar la misma operación. Este flujo se simula mediante un escenario específico, sin conectar la demo a un backend.

## F16. Excedente, saldo a favor, aplicación y devolución

```mermaid
flowchart TD
    A([Pago con importe superior al destino elegido]) --> B[Mostrar excedente y solicitar destino]
    B --> C{¿Elección?}
    C -- Cuotas futuras o prepago --> D([Continuar F06 o F07 con destino completo])
    C -- Mantener crédito --> E[Registrar pago y crédito en la misma operación]
    E --> F[Mostrar crédito separado de capital y deuda]
    F --> G{¿Uso posterior?}
    G -- Aplicar --> H[Elegir obligación de la misma moneda]
    H --> I[Revisar importe disponible y deuda cubierta]
    G -- Devolver --> J[Registrar datos de devolución realizada y permiso]
    J --> K[Revisar salida, evidencia y crédito restante]
    I --> L[Confirmar con clave de operación]
    K --> L
    L --> M{¿Crédito y versión siguen vigentes?}
    M -- No --> F
    M -- Sí --> N[Guardar movimiento de crédito y aplicación o devolución]
    N --> O[Actualizar crédito y saldo del destino]
    O --> P([Mostrar comprobante e historial])
```

A-PAG-07 y A-PAG-08. Aplicar crédito no registra dinero nuevo recibido: ese ingreso ya quedó registrado cuando surgió el excedente. Devolver crédito registra una salida realizada, sin ejecutar transferencias. Se bloquea el crédito durante confirmaciones concurrentes y se impide aplicarlo/devolverlo dos veces. Un cliente con crédito disponible no puede archivarse hasta resolverlo.

## Estados principales del dominio

### Préstamo

```mermaid
stateDiagram-v2
    [*] --> Borrador
    Borrador --> Aprobado: Aprobar condiciones
    Borrador --> Cancelado: Cancelar borrador
    Aprobado --> Borrador: Revisar condiciones antes de desembolso
    Aprobado --> Cancelado: Cancelar sin desembolso
    Aprobado --> Activo: Registrar desembolso
    Activo --> Activo: Pago parcial o ajuste autorizado
    Activo --> Liquidado: Sin obligaciones pendientes
    Liquidado --> Activo: Reverso autorizado restaura deuda
    Cancelado --> [*]
```

«Al día», «Vence hoy» y «En mora» son condiciones calculadas, separadas de estos estados. Un préstamo activo puede estar al día o en mora. Un préstamo cancelado no tuvo desembolso; un préstamo liquidado sí lo tuvo.

### Cuota

```mermaid
stateDiagram-v2
    [*] --> Pendiente
    Pendiente --> Parcial: Abono inferior a obligación
    Pendiente --> Pagada: Pago suficiente
    Parcial --> Parcial: Nuevo abono parcial
    Parcial --> Pagada: Completar obligación
    Pagada --> Parcial: Reverso restaura parte de deuda
    Pagada --> Pendiente: Reverso restaura toda la deuda
    Parcial --> Pendiente: Reverso de sus abonos
```

Una cuota pendiente o parcial pasa a condición «Vencida» al superar la fecha límite con saldo exigible. Reprogramada se visualiza en el historial de la versión sustituida; no se interpreta como pagada. El corte de día en America/Lima determina Hoy/Vencida.

### Promesa de pago

```mermaid
stateDiagram-v2
    [*] --> Pendiente
    Pendiente --> Cumplida: Pagos vinculados cubren compromiso
    Pendiente --> Incumplida: Fecha vencida con importe pendiente
    Pendiente --> Cancelada: Cancelación con motivo
    Incumplida --> Cumplida: Pago posterior registrado
    Cumplida --> Pendiente: Reverso restaura importe antes del límite
    Cumplida --> Incumplida: Reverso restaura importe después del límite
```

Si se cumple después del límite, se indica «Cumplida fuera de fecha» con ambos momentos conservados. Un nuevo acuerdo crea otra promesa y relaciona la anterior.

## Matriz de actualización entre pantallas

| Operación confirmada | Cliente / expediente | Préstamos y cuotas | Cobranzas | Calendario | Reportes y avisos |
|---|---|---|---|---|---|
| Crear cliente | Nueva ficha | Sin deuda | Sin movimiento | Sin cuota | Recuento de clientes |
| Guardar borrador | Préstamo borrador | No suma cartera activa | Sin obligación | Sin cuota activa | Sin aviso de cobro |
| Registrar desembolso | Préstamo activo | Capital y cuotas vigentes | Fechas exigibles | Vencimientos derivados | Cartera y próximas cuotas |
| Pago parcial | Menor capital según aplicación | Cuota parcial | Pendiente restante | Evento actualizado | Importes y reglas reevaluados |
| Pago completo | Pago visible | Cuota pagada | Sale de pendiente | Pagado u oculto por filtro | Excluir saldo pagado de nuevos avisos |
| Liquidar | Historial disponible | Préstamo liquidado | Sin deuda exigible | Sin próximas cuotas activas | Excluir de cartera activa |
| Reversar | Movimiento compensatorio | Restaurar deuda aplicable | Pendiente actualizado | Restituir condición | Recalcular; conservar correos ya enviados |
| Reprogramar | Ajuste e historial | Nueva versión remanente | Nuevos vencimientos | Sustituir eventos vigentes | Reevaluar avisos pendientes |
| Promesa | Gestión vinculada | Contrato intacto | Próxima gestión visible | Evento de compromiso | Reporte de compromisos |
| Mover visita | Nueva fecha en gestión | Contrato intacto | Próxima actividad | Nuevo horario confirmado | Agenda operativa |
| Cambiar tasa | Historial intacto | Nuevos préstamos usan nueva regla | Deuda actual intacta | Fechas actuales intactas | Condiciones actuales intactas |

## Reglas por cerrar antes del sistema real

Política financiera de mora, imputación y prepagos; tratamiento de pagos con fecha anterior a operaciones ya confirmadas; ajustes de pagos relacionados con reprogramaciones; periodicidades por días reales; conservación de documentos; aprobación comercial y evidencia de acuerdos. La demo mostrará los supuestos y bloqueos definidos aquí, sin aparentar que esos casos complejos ya están resueltos.
