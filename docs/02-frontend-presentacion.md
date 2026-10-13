# Frontend de presentación — Next.js, calendario y paneles laterales

Fecha: 12 de octubre de 2026. Estado: especificación de diseño; frontend de presentación construido en `../frontend/`. Véanse [la entrega y sus límites](06-frontend-implementado.md).

Ampliación: [diagramas y ciclos completos](03-flujos-funcionales.md), [detalle de botones y paneles](04-plan-detallado-frontend.md) y [recorrido con casos de validación](05-escenarios-presentacion.md). El detalle sustituye la acción conjunta de aprobar/desembolsar por dos pasos visibles y añade el ciclo del crédito a favor.

## 1. Objetivo de la demo

Presentar una plataforma completa de cobranzas de préstamos que se pueda recorrer y utilizar con datos ficticios. La demo permitirá registrar clientes y préstamos simulados, generar cronogramas, registrar abonos, gestionar visitas, consultar documentos y mostrar reportes. Los cambios se reflejarán entre pantallas.

**Tecnología confirmada: Next.js.** Se usará App Router, React y TypeScript, con CSS Modules y variables de tema. El catálogo solicitado para escoger librerías es [libreriasjs.com](https://libreriasjs.com/). Se consultó el catálogo y se contrastaron las capacidades relevantes con documentación oficial.

La demo se ejecutará en el navegador para presentarla. El empaquetado en escritorio queda para la aplicación real. Los servicios de correo, geocodificación, autenticación y base de datos se simularán, con una indicación discreta «Modo presentación · datos ficticios».

## 2. Librerías elegidas desde el catálogo

| Librería | Uso propuesto | Referencia del catálogo | Documentación oficial |
|---|---|---|---|
| FullCalendar | Calendario de cuotas, visitas y compromisos | [Artículo](https://libreriasjs.com/libreria-javascript-crear-calendarios-eventos-fullcalendar/) | [Integración React/Next.js](https://fullcalendar.io/docs/react) |
| AG Grid Community | Tablas de clientes, préstamos y pagos; ordenar y filtrar | [Artículo](https://libreriasjs.com/libreria-javascript-crear-tablas-dinamicas-aggrid/) | [Community y Enterprise](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/) |
| Apache ECharts | Recaudación, vencimientos y antigüedad de deuda | [Artículo](https://libreriasjs.com/libreria-javascript-crear-graficos-y-visualizacion-datos-echarts/) | [Guía oficial](https://echarts.apache.org/handbook/en/get-started/) |
| Yup | Validación de formularios y mensajes por campo | [Artículo](https://libreriasjs.com/libreria-javascript-validar-formularios-yup/) | [Repositorio oficial](https://github.com/jquense/yup) |
| Day.js | Fechas, formato español y zona America/Lima | [Artículo](https://libreriasjs.com/libreria-javascript-fechas-dayjs/) | [Zona horaria](https://day.js.org/docs/en/timezone/timezone) |
| Anime.js | Apertura/cierre de paneles y transiciones discretas | [Artículo](https://libreriasjs.com/libreria-javascript-animaciones-animejs/) | [Integración React](https://animejs.com/documentation/getting-started/using-with-react/) |
| jsPDF | Descarga local de reportes y comprobantes ficticios | [Artículo](https://libreriasjs.com/libreria-javascript-crear-pdf-jspdf/) | [Repositorio oficial](https://github.com/parallax/jsPDF) |

Se usará **FullCalendar Standard**, con vistas de mes, semana, día y agenda, y plugins oficiales compatibles de una misma versión. Standard tiene licencia MIT; no se necesitan las vistas Premium de recursos para esta presentación. [Licencias de FullCalendar](https://fullcalendar.io/license).

AG Grid se limitará a funciones Community. Los filtros laterales serán componentes de la aplicación; no dependerán de los paneles Enterprise. La descarga tabular será CSV. La exportación Excel integrada de AG Grid es Enterprise y no forma parte de este plan. [Comparación oficial de ediciones](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/).

Para los paneles se propone el elemento nativo `dialog`, con estilos y animación desde la derecha; no se añade otra biblioteca de modales ajena al catálogo. Los menús, botones e inputs compartirán componentes propios sencillos. El motor financiero del backend seguirá siendo la autoridad cuando se integre; la simulación del frontend no se utilizará como registro contable real.

## 3. Dirección visual

Lectura del diseño: plataforma de trabajo para el dueño y sus cobradores, con lenguaje minimalista y tranquilo, superficies suaves y una densidad moderada. La referencia a ChatGPT se aplicará a la claridad, esquinas, espaciado, botones y navegación; la pantalla central seguirá siendo apropiada para gestionar cartera y calendario.

### Temas

| Token | Blanco | Negro | Navi |
|---|---|---|---|
| Fondo principal | `#FFFFFF` | `#171717` | `#0E172A` |
| Superficie secundaria | `#F5F5F5` | `#212121` | `#162238` |
| Superficie elevada | `#FFFFFF` | `#2B2B2B` | `#1D2D47` |
| Texto principal | `#202020` | `#F5F5F5` | `#F2F5FA` |
| Texto secundario | `#606060` | `#B4B4B4` | `#B7C3D4` |
| Borde | `#E6E6E6` | `#3A3A3A` | `#33445F` |

La acción principal usará un botón de contraste alto, oscuro en Blanco y claro en Negro/Navi. Se usarán tonos semánticos discretos para pagado, próximo y vencido, siempre acompañados de texto o icono. La paleta es una propuesta inicial; se comprobará contraste real al construirla.

Tipografía sans serif con base de 14–16 px; importes con cifras tabulares; títulos entre 24 y 30 px. Inputs con esquinas de 12 px, superficies de 16–20 px y botones principales redondeados. Alturas de controles entre 40 y 44 px. Espaciado consistente de 8, 12, 16, 24 y 32 px. Las tablas tendrán filas de aproximadamente 52 px, sin una cuadrícula pesada.

Los gráficos, calendario, filtros, campos, menús, tooltips, estados vacíos y paneles deberán cambiar de tema junto con el resto. No bastará con cambiar el color del fondo.

### Panel modal desde la derecha

- Entrada desde el borde derecho, duración aproximada de 220–280 ms.
- Panel habitual de 520 px; expediente o cronograma de hasta 720 px; ancho completo en pantallas pequeñas.
- Fondo con oscurecimiento suave y `backdrop-filter: blur(8px)`; el panel permanecerá legible y sólido.
- Cabecera con título, contexto y botón Cerrar; contenido con desplazamiento propio y acciones fijas al pie.
- Cierre con Cerrar, Escape o clic en el fondo cuando no haya cambios pendientes. Con cambios, se mostrará «Seguir editando» / «Descartar cambios» dentro del mismo panel.
- Enfoque inicial adecuado, navegación por teclado contenida en el panel y retorno al botón que lo abrió.
- El fondo queda sin interacción mientras el modal está abierto.
- Movimiento reducido y opción de transparencia reducida con transición sencilla y fondo opaco.
- Un panel activo. Abrir «Registrar pago» desde el expediente cambia el contenido y ofrece Volver; evita apilar formularios.

Búsquedas y filtros actúan sobre su pantalla; acciones de alta, edición, detalle, confirmación y vista previa utilizan el panel. Los menús pequeños pueden ser desplegables; no necesitan ocupar un panel completo.

## 4. Navegación

Barra lateral izquierda colapsable, cabecera con búsqueda global, acción «Nuevo», notificaciones y selector de tema. El ancho útil se adaptará a escritorio, laptop y tablet. En móvil la navegación se ocultará y los paneles ocuparán todo el ancho.

| Entrada | Ruta estática prevista | Contenido |
|---|---|---|
| Inicio | `/` | Resumen de cartera y trabajo de hoy |
| Clientes | `/clientes` | Buscador, filtros y expedientes |
| Préstamos | `/prestamos` | Condiciones, cronogramas y saldos |
| Cobranzas | `/cobranzas` | Cuotas exigibles, abonos y gestiones |
| Calendario | `/calendario` | Mes, semana, día y agenda |
| Documentos | `/documentos` | Archivo de expedientes |
| Reportes | `/reportes` | Cartera, mora, recaudación y exportación |
| Recordatorios | `/recordatorios` | Reglas y vista previa del correo al dueño |
| Configuración | `/configuracion` | Tasas, usuarios, negocio y apariencia |

Los detalles de entidades se resolverán en el cliente mediante el identificador del panel, por ejemplo `/clientes?cliente=...`, para admitir clientes creados en la demo sin requerir rutas dinámicas generadas en servidor. El adaptador real podrá mantener este patrón. El arranque leerá el estado persistido en el navegador después de la hidratación.

## 5. Pantallas y botones

Este inventario es el alcance previsto. Todo botón visible debe navegar, abrir un panel, cambiar datos, descargar un archivo o explicar por qué no está disponible. Cada panel tendrá Cerrar, Volver cuando corresponda, Cancelar y su acción principal.

### 5.1 Acciones globales

| Control | Comportamiento |
|---|---|
| Contraer/expandir menú | Cambia el ancho de la navegación |
| Buscar cliente, DNI, teléfono o préstamo | Filtra resultados y abre el expediente o préstamo al seleccionar |
| Nuevo cliente | Abre alta de cliente |
| Nuevo préstamo | Abre selección de cliente y simulación |
| Registrar cobranza | Abre pago con búsqueda de préstamo |
| Nueva visita/tarea | Abre evento con responsable y horario |
| Notificaciones | Abre avisos ficticios; Ver detalle lleva al objeto vinculado |
| Blanco / Negro / Navi | Aplica y conserva el tema elegido |
| Perfil / cambiar rol de demo | Permite revisar la experiencia de dueño, jefe o cobrador |
| Reiniciar presentación | Abre confirmación y restaura el escenario ficticio inicial |

### 5.2 Inicio

Resumen: capital pendiente, cobrado en el período, importe vencido y cuotas próximas. Definiciones y período visibles; importes calculados desde los mismos datos del resto de la demo. Gráfico de recaudación y agenda del día.

| Botón o interacción | Resultado |
|---|---|
| Cambiar período | Actualiza indicadores y gráfico |
| Ver cartera | Abre Préstamos con el filtro correspondiente |
| Ver vencidas | Abre Cobranzas con cuotas vencidas |
| Ver próximas | Abre Calendario con próximas cuotas |
| Registrar pago en fila | Abre pago con cuota y préstamo seleccionados |
| Ver agenda completa | Abre Calendario en agenda |
| Ver reporte del día | Abre vista previa del resumen al dueño |

### 5.3 Clientes

Tabla: nombre, DNI, teléfono, distrito, préstamos activos, capital pendiente, condición de pago y responsable. Filtros por estado de deuda, distrito, responsable y etiquetas; búsqueda por nombre/documento/teléfono.

| Botón o interacción | Resultado |
|---|---|
| Nuevo cliente | Alta en panel |
| Filtros | Panel de filtros con Aplicar y Limpiar |
| Ordenar columna | Reordena la tabla |
| Exportar CSV | Descarga los resultados filtrados con encabezados |
| Ver expediente / clic en nombre | Abre expediente con pestañas |
| Editar cliente | Abre datos existentes y valida cambios |
| Nuevo préstamo desde expediente | Conserva el cliente seleccionado |
| Registrar pago desde expediente | Solicita préstamo si hay varios |
| Añadir documento/foto | Abre selección y clasificación de archivo |
| Confirmar ubicación | Abre foto, dirección y propuesta de punto |
| Añadir gestión / promesa | Abre nota, resultado y próxima acción |
| Agendar visita | Abre evento vinculado al cliente |
| Archivar cliente | Confirmación; mantiene historial; bloqueado si la política exige cerrar deuda activa |

Alta de cliente: nombres, apellidos, tipo/número de documento, teléfono principal y alterno, correo opcional, dirección, distrito, provincia, referencias, responsable, etiquetas, notas, foto de casa y documentos. DNI peruano de 8 dígitos validado en formato; no se simulará una consulta oficial de identidad. Correo validado si se ingresa. Documento duplicado mostrará acceso al cliente existente.

Expediente: Resumen, Préstamos, Pagos, Documentos, Ubicación y Gestiones. Muestra claramente capital original, capital pendiente, deuda exigible a la fecha y próxima cuota, sin sumar intereses futuros como si fueran mora.

### 5.4 Préstamos

Tabla: código, cliente, capital original, capital pendiente, TEA, método, próxima cuota, condición de pago y responsable. Filtros por ciclo de vida, mora, método y período.

| Botón | Resultado |
|---|---|
| Nuevo préstamo | Panel con Cliente → Condiciones → Cronograma → Revisión |
| Elegir cliente / crear cliente | Busca un expediente o cambia al alta con retorno al flujo |
| Simular | Calcula cuota e intereses ficticios y muestra cronograma |
| Aplicar regla de tasa | Sugiere la regla según monto/plazo y muestra su origen |
| Tasa personalizada | Campo habilitado por rol con motivo |
| Ver cronograma | Panel con capital, interés, saldo y vencimientos por cuota |
| Guardar borrador | Conserva la simulación editable |
| Aprobar condiciones (demo) | Fija condiciones revisadas; conserva el estado aprobado sin activar cobros |
| Registrar desembolso (demo) | Registra entrega realizada de ejemplo y activa préstamo, cuotas y eventos vinculados |
| Descargar cronograma PDF | Genera archivo marcado «Presentación · datos ficticios» |
| Registrar pago | Abre pago del préstamo |
| Simular prepago / liquidación | Muestra desglose y nuevo escenario |
| Reprogramar | Propuesta antes/después, motivo y confirmación autorizada |
| Ver historial | Condiciones, cronogramas y operaciones anteriores |

Campos: cliente, capital, moneda, método, TEA o tasa simple identificada, número de cuotas mensuales, desembolso, primera fecha de pago, responsable y nota. Resumen permanente con cuota, interés previsto, total previsto y fecha final. En esta demo se calculan cuotas mensuales; las demás periodicidades no aparecerán como opciones funcionales hasta definir su cálculo.

### 5.5 Cobranzas

Pestañas: Hoy, Próximas, Vencidas y Pagos registrados. Tabla por cuota exigible, con cliente, préstamo, fecha, importe pendiente, días de atraso, responsable y próxima gestión. Una fila no representa todo el capital del préstamo.

| Botón | Resultado |
|---|---|
| Registrar cobranza | Selección de cliente/préstamo y cuotas |
| Pagar cuota | Importe sugerido con desglose editable para pago parcial |
| Aplicar a varias cuotas | Selección y distribución visible |
| Añadir comprobante | Adjunto local clasificado |
| Confirmar pago | Valida importe y actualiza saldos, calendario e indicadores |
| Ver comprobante | Vista previa en panel |
| Descargar comprobante PDF | Archivo de demo |
| Registrar llamada/visita | Añade gestión al expediente |
| Promesa de pago | Guarda importe, fecha y nota; añade evento vinculado |
| Reversar pago | Motivo, resumen del efecto y confirmación por rol |
| Aplicar saldo a favor / Registrar devolución | Revisa crédito disponible y aplicación o devolución realizada; evita contar otro ingreso al aplicar crédito |
| Filtrar / exportar CSV | Aplica filtros y descarga resultados visibles |

Pago: préstamo, fecha efectiva, importe, cuotas/destino, método (efectivo, transferencia, Yape/Plin como datos de registro), número de operación opcional, comprobante y nota. Registrar una referencia a Yape/Plin no integra una pasarela de pago. El resumen muestra qué se paga y cuánto queda. No se acepta importe cero/negativo; el excedente necesita destino.

### 5.6 Calendario

FullCalendar con encabezado suave, miniagenda del día y leyenda. Vistas Mes, Semana, Día y Agenda. Filtros por tipo, responsable, estado y cliente. Cada evento identifica tipo y cliente; el importe se muestra cuando corresponde.

| Botón o interacción | Resultado |
|---|---|
| Hoy | Lleva a la fecha de negocio actual de la demo |
| Anterior / Siguiente | Cambia intervalo |
| Mes / Semana / Día / Agenda | Cambia vista conservando filtros |
| Elegir fecha | Navega a esa fecha |
| Nueva actividad | Panel con tipo, cliente, responsable y horario |
| Clic en día vacío | Abre actividad con fecha preseleccionada |
| Clic en cuota | Panel de cuota con préstamo, saldo y acciones |
| Registrar pago desde cuota | Abre pago conservando el contexto |
| Reprogramar cuota | Abre flujo financiero; no edita fecha directamente |
| Clic en visita/tarea | Detalle con Editar, Completar o Cancelar |
| Arrastrar visita/tarea | Propone nuevo horario y exige confirmar dentro del panel |
| Clic en promesa | Permite revisar, actualizar, cumplir o cancelar la gestión |
| Más eventos del día | Abre agenda completa de ese día en panel |
| Ver cliente / Ver préstamo | Abre el detalle relacionado con opción Volver |
| Filtros / Limpiar | Actualiza calendario y miniagenda |

Las cuotas no se arrastran. Una promesa no se marca cumplida solo por hacer clic: se pide vincular el pago correspondiente o registrar el resultado de la gestión. Una visita completada permite registrar nota y próxima acción. Cuotas pagadas se mostrarán con estado visible o se ocultarán por filtro, manteniendo historial.

Se mantendrán los vencimientos como fechas sin hora. Los eventos horarios se normalizarán para America/Lima mediante el adaptador oficial que requiera FullCalendar y los plugins UTC/timezone de Day.js. Se verificará que abrir la demo en un equipo de otra zona no cambie fechas de cobro.

### 5.7 Documentos y ubicación

| Botón | Resultado |
|---|---|
| Cargar documento | Elige archivo, cliente/préstamo, categoría y nota |
| Buscar / filtrar categoría | Reduce documentos mostrados |
| Vista lista / galería | Cambia representación |
| Ver archivo | Previsualiza imágenes/PDF o informa tipo sin vista previa |
| Descargar | Descarga el archivo local si está disponible |
| Cambiar categoría | Edita metadatos ficticios |
| Quitar adjunto de demo | Confirmación y actualización local |
| Buscar por dirección | Muestra propuesta ficticia identificada |
| Ajustar punto | Permite corregir coordenadas o punto del mapa de presentación |
| Confirmar ubicación | Guarda punto y estado de confirmación local |
| Abrir Google Maps | Abre enlace a dirección/coordenadas del ejemplo |
| Copiar enlace | Copia el enlace y confirma brevemente |

La demo no afirmará que ubicó una fachada automáticamente. Se podrá presentar «Foto cargada · sin GPS detectado» y permitir dirección/punto manual. Un ejemplo previamente georreferenciado estará marcado como ficticio. Las fotos y adjuntos elegidos por el usuario se previsualizarán localmente; no se enviarán a terceros.

### 5.8 Reportes y recordatorios

Reportes: cartera activa, mora por antigüedad, vencimientos próximos, recaudación por período/cobrador y estado de cuenta individual. Los gráficos y las tablas tendrán los mismos filtros y totales.

| Botón | Resultado |
|---|---|
| Elegir reporte | Cambia tabla/gráfico y criterios |
| Período / responsable / moneda | Actualiza resultados |
| Generar reporte | Abre vista previa con filtros y totales |
| Descargar PDF / CSV | Genera archivo local de demo |
| Preparar correo al dueño | Abre vista previa con destinatario configurable |
| Simular envío | Añade entrada al historial marcada «Simulado» |
| Nueva regla | Panel con anticipación, frecuencia, hora y destinatario |
| Editar regla | Muestra y valida parámetros existentes |
| Activar / Pausar | Cambia estado ficticio de la regla |
| Vista previa | Muestra asunto, resumen y tabla de deudores |
| Ver historial | Panel con estados y errores ficticios |
| Simular reintento | Actualiza un envío fallido de ejemplo |

Se usará un correo de ejemplo bajo el dominio reservado `example.com`, editable, hasta contar con el destinatario real. La demo no solicitará claves SMTP ni enviará comunicaciones. Un ejemplo de fallo permitirá comprobar que la interfaz informa el resultado en lugar de mostrar siempre éxito.

### 5.9 Configuración

Secciones: Negocio, Tasas, Cobranza, Usuarios, Apariencia y Presentación. Roles y permisos se simulan para mostrar el alcance; no constituyen autenticación real.

| Botón | Resultado |
|---|---|
| Editar datos del negocio | Nombre, moneda y zona; Guardar cambios locales |
| Nueva regla de tasa | Rango, plazo, método, tipo de tasa y vigencia |
| Editar / desactivar regla | Cambia reglas para préstamos nuevos; conserva los existentes |
| Editar política de cobranza | Muestra parámetros y alcance; mora desactivada por defecto |
| Nuevo usuario / editar | Nombre ficticio, rol y cartera |
| Asignar clientes | Panel con búsqueda y selección |
| Cambiar tema | Aplica Blanco, Negro o Navi |
| Cambiar escenario | Muestra cartera normal, cartera con mora o estado vacío |
| Restaurar datos de demo | Confirmación y reinicio reproducible |

## 6. Estado de la demo y separación de datos

Se usará React Context y `useReducer` para el estado compartido. Los módulos consumirán un adaptador de datos con operaciones asíncronas; inicialmente responderá desde los mocks. Cuando se integre FastAPI se reemplazará el adaptador, conservando componentes y contratos.

Los datos ficticios y preferencias se podrán conservar en localStorage con versión de esquema. Los archivos seleccionados se guardarán temporalmente como objetos de archivo y referencias locales; **no se promete conservar sus bytes después de recargar**. Si se necesita persistencia de adjuntos en la presentación, se añadirá IndexedDB. La interfaz indicará cuándo un archivo temporal deja de estar disponible.

Los escenarios iniciales serán reproducibles alrededor del 12 de octubre de 2026; «Hoy» usará el reloj de negocio de la demo. Podrá ofrecerse un escenario relativo a la fecha actual. Todos los módulos usarán ese mismo reloj, evitando calendarios e indicadores contradictorios.

Datos de muestra propuestos: 24 clientes ficticios, 30 préstamos con casos al día y en mora, pagos parciales, un cliente con varios préstamos, una tasa cero, documentos de ejemplo, ubicaciones confirmadas/pendientes, visitas, promesas y recordatorios. Los KPI se calcularán desde ese conjunto; no serán números decorativos.

Cada operación tendrá validación, éxito y error cuando corresponda. Habrá estados vacíos, sin resultados, carga inicial breve, documento no disponible y permiso insuficiente. Las simulaciones no introducirán esperas largas. La autorización real no se inferirá del rol almacenado en el navegador.

## 7. Estructura prevista de Next.js

```text
frontend/
  src/
    app/
      layout.tsx
      page.tsx
      clientes/page.tsx
      prestamos/page.tsx
      cobranzas/page.tsx
      calendario/page.tsx
      documentos/page.tsx
      reportes/page.tsx
      recordatorios/page.tsx
      configuracion/page.tsx
    components/
      shell/                    navegación, búsqueda y cabecera
      ui/                       botones, inputs, tabs, dialog y avisos
    features/
      clients/ loans/ payments/ collections/
      calendar/ documents/ locations/ reports/ reminders/ settings/
    domain/                     tipos y reglas de simulación
    data/                       contratos y adaptador mock
    mocks/                      datos y escenarios
    providers/                  tema, estado y reloj de negocio
    styles/                     tokens, base y temas
  public/                       recursos ficticios para presentación
```

La exportación estática se planificará desde el inicio. Los componentes interactivos usarán límites de cliente; librerías que requieran navegador se cargarán en esos límites. localStorage se accederá tras montaje; las imágenes locales no dependerán del optimizador de imágenes de servidor. No se crearán endpoints ni Server Actions para esta demo. [Restricciones de exportación estática](https://nextjs.org/docs/app/guides/static-exports).

Se cargarán calendario, gráficos, tablas y generación PDF por módulo para evitar incluir todo en la primera pantalla. Las instancias de animación, gráfico y calendario se limpiarán al desmontarse. Las versiones elegidas se fijarán al construir, comprobando compatibilidad con React y Next.js vigentes.

## 8. Secuencia de presentación

1. Mostrar Inicio y cambiar entre Blanco, Negro y Navi.
2. Buscar un cliente por DNI y abrir su expediente a la derecha.
3. Crear cliente ficticio con dirección, foto y documento; confirmar un punto de ejemplo.
4. Simular préstamo mensual, revisar intereses y aprobar el desembolso de demo.
5. Ver cuotas en el calendario y abrir una desde su evento.
6. Registrar pago parcial; observar el saldo actualizado en cuota, expediente e Inicio.
7. Registrar una promesa y agendar visita con responsable.
8. Mover la visita y confirmar; mostrar que reprogramar una cuota usa otro flujo.
9. Revisar el reporte de mora y descargar PDF/CSV de ejemplo.
10. Abrir el correo al dueño, simular envío y mostrar su historial.

## 9. Criterios de aceptación de la presentación

- Las nueve pantallas son navegables y los botones del inventario tienen resultado observable.
- Buscar por nombre, DNI, teléfono o código encuentra los ejemplos previstos; filtros, orden y exportaciones coinciden.
- Crear un cliente/préstamo y registrar un abono modifica las vistas relacionadas sin recargar.
- El calendario muestra cuotas, visitas y promesas; mes, semana, día y agenda comparten datos y filtros.
- Cambiar una visita no modifica una cuota; reprogramaciones mantienen historial.
- Los paneles entran desde la derecha, desenfocan el fondo y funcionan por teclado.
- Blanco, Negro y Navi cubren tablas, gráficos, calendario, formularios y paneles con texto legible.
- Formularios rechazan datos inválidos, duplicados y abonos sin destino definido.
- Los estados vacíos, errores y adjuntos temporales tienen mensajes y acciones comprensibles.
- Correos, ubicación propuesta y permisos se identifican como simulación donde corresponda.
- Los PDF/CSV se generan desde los datos visibles, incluyen fecha/filtros y señalan que son ficticios.
- La exportación estática compila y puede abrirse desde un servidor de archivos sin backend.
- La experiencia se revisa al menos en 1440 px, 1280 px y tablet; se adapta a móvil.

Orden de construcción: base visual y temas → clientes/expediente → préstamos/cronograma → pagos/cobranzas → calendario → documentos/ubicación → reportes/recordatorios → configuración y revisión completa. Esta fase no incluye implementar FastAPI, PostgreSQL ni el instalador de escritorio.
