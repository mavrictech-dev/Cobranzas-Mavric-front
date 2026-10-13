# Mavric · Cobranzas

Frontend de presentación en Next.js y TypeScript. Nueve pantallas, temas Blanco/Negro/Navi, paneles modales desde la derecha, datos ficticios persistidos en el navegador y archivos locales en IndexedDB. No implementa FastAPI, PostgreSQL ni envíos de correo.

Para abrir la versión compilada, ejecutar **Iniciar presentacion.cmd** en la carpeta principal. La ventana que se abre mantiene el servidor local; cerrarla detiene la presentación. La dirección es http://127.0.0.1:3000.

Para desarrollo: `npm install`, `npm run dev`. Verificación: `npm run check`, `npm test`, `npm run build`. La exportación estática se genera en `out/`. Todas las librerías quedan fijadas en package.json y package-lock.json.

## Recorrido sugerido

Buscar **Cliente Demo Uno**, abrir PRE-001 y registrar S/ 200, S/ 300 y S/ 500. El préstamo pasa de parcial a liquidado. Reversar el pago de S/ 300 restaura su deuda. Explorar una promesa vinculada al pago, el calendario, la vista previa del correo y los temas.

Desde Configuración → Presentación se restauran los datos y se cambian escenarios. El perfil del pie de la barra lateral permite explorar Dueño/Jefe/Cobrador/Consulta; los permisos son de demostración. El cobrador accede a la cartera ficticia de Mateo Ruiz.

## Límites de la simulación

Los intereses se calculan con períodos mensuales convencionales y redondeo a centavos. Liquidación utiliza capital e interés de cuotas exigibles al corte, sin devengo diario. La reducción de plazo por prepago es una aproximación proporcional identificada en el panel. Reversos con ajustes de cronograma dependientes se bloquean con explicación. La geocodificación es simulada; el punto se confirma manualmente y Maps abre el enlace solicitado. Registrar método de pago no ejecuta transferencias.

Los documentos subidos quedan en IndexedDB de este navegador. Las imágenes sembradas son ilustraciones identificadas. No hay acceso a servicios de identidad, correo, mapas ni banca desde el código de la demo, salvo abrir voluntariamente el enlace de Google Maps.

Los flujos previstos y casos de presentación están en los documentos de la carpeta `../docs/`.
