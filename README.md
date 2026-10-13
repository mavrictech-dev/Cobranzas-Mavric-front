# Mavric · Cobranzas

Frontend de presentación para gestionar clientes, préstamos con cuotas, cobranzas, calendario, documentos, reportes y recordatorios. Construido con Next.js y TypeScript, con temas blanco, negro y navi, y paneles laterales con fondo desenfocado.

Los datos son ficticios y se guardan en el navegador. Esta versión no tiene backend, autenticación real ni envíos de correo.

## Ejecutar la presentación

Se necesita Node.js y npm. Desde la carpeta del repositorio:

```sh
cd frontend
npm ci
npm run build
npm start
```

Abre [http://127.0.0.1:3000](http://127.0.0.1:3000). En Windows, después de instalar las dependencias, también puedes ejecutar **Iniciar presentacion.cmd** desde la carpeta principal. Mantén abierta su ventana mientras usas la presentación.

## Desarrollo y verificación

Desde `frontend/`:

```sh
npm run dev
npm run check
npm test
npm run build
```

Las pruebas de navegador (`npm run test:browser`) requieren Microsoft Edge y la presentación funcionando en el puerto 3000. La compilación genera la exportación estática en `frontend/out/`.

## Documentación

- [Uso, recorrido y límites de la demo](frontend/README.md)
- [Arquitectura prevista](docs/01-arquitectura.md)
- [Diagramas de flujos funcionales](docs/03-flujos-funcionales.md)
- [Plan detallado del frontend](docs/04-plan-detallado-frontend.md)
- [Escenarios de presentación](docs/05-escenarios-presentacion.md)
- [Frontend implementado](docs/06-frontend-implementado.md)

Las dependencias, los archivos compilados, las capturas de verificación y los archivos de entorno quedan excluidos del repositorio.
