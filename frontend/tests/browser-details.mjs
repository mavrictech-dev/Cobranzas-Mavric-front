import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "es-PE",
  timezoneId: "America/Lima",
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
const checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = "http://127.0.0.1:3000";
const d = () => page.getByRole("dialog");
try {
  await page.goto(base + "/prestamos/");
  await page
    .getByRole("button", { name: "Nuevo préstamo", exact: true })
    .click();
  await d()
    .getByLabel(/^Cliente/)
    .selectOption("CLI-001");
  await d()
    .getByLabel(/Capital a prestar/)
    .fill("1000");
  await d()
    .getByLabel(/Número de cuotas/)
    .fill("2");
  await d()
    .getByRole("button", { name: "Aplicar regla de tasa", exact: true })
    .click();
  if (
    (await d()
      .getByLabel(/Tasa anual ficticia/)
      .inputValue()) !== "24"
  )
    throw new Error("Rate rule not applied");
  await d()
    .getByRole("button", { name: "Simular préstamo", exact: true })
    .click();
  await d()
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await d().getByText("Borrador", { exact: true }).waitFor();
  await d()
    .getByRole("button", { name: "Aprobar condiciones", exact: true })
    .click();
  await d().getByRole("button", { name: "Confirmar", exact: true }).click();
  await d().getByText("Aprobado", { exact: true }).waitFor();
  await d()
    .getByRole("button", { name: "Registrar desembolso", exact: true })
    .click();
  await d().getByRole("button", { name: "Confirmar", exact: true }).click();
  await d().getByText("Al día", { exact: true }).waitFor();
  checks.push("Regla de tasa, simulación, borrador, aprobación y desembolso");
  await d()
    .getByRole("button", { name: "Abonar a capital", exact: true })
    .click();
  await d()
    .getByLabel(/Abono a capital/)
    .fill("100");
  await d()
    .getByRole("button", { name: "Confirmar prepago de ejemplo", exact: true })
    .click();
  await d().getByText("Pago confirmado", { exact: true }).waitFor();
  await d().getByRole("button", { name: "Ver préstamo", exact: true }).click();
  await d()
    .locator(".panel-metrics")
    .getByText(/900\.00/)
    .waitFor();
  checks.push("Prepago actualiza capital a 900");
  await d()
    .getByRole("button", { name: "Liquidar préstamo", exact: true })
    .click();
  await d()
    .getByRole("button", { name: "Confirmar liquidación", exact: true })
    .click();
  await d().getByText("Pago confirmado", { exact: true }).waitFor();
  await d().getByRole("button", { name: "Ver préstamo", exact: true }).click();
  await d().getByText("Liquidado", { exact: true }).waitFor();
  checks.push("Liquidación de ejemplo");
  await d().getByRole("button", { name: "Cerrar panel", exact: true }).click();
  await page.goto(base + "/documentos/");
  await page
    .getByRole("button", { name: "Cargar documento", exact: true })
    .click();
  await d()
    .getByLabel(/^Cliente/)
    .selectOption("CLI-001");
  await d().getByLabel("Categoría", { exact: true }).selectOption("Otro");
  await d()
    .locator("input[type=file]")
    .setInputFiles({
      name: "referencia-qa.png",
      mimeType: "image/png",
      buffer: await fs.readFile("qa/inicio-blanco.png"),
    });
  await d()
    .getByRole("button", { name: "Vincular documento", exact: true })
    .click();
  await d()
    .getByRole("img", { name: "referencia-qa.png", exact: true })
    .waitFor();
  checks.push("Carga y vista previa de archivo local");
  await d().getByRole("button", { name: "Cerrar panel", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /referencia-qa.png/ }).click();
  await d()
    .getByRole("img", { name: "referencia-qa.png", exact: true })
    .waitFor();
  checks.push("Archivo disponible tras recarga en IndexedDB");
  await d().getByRole("button", { name: "Cerrar panel", exact: true }).click();
  await page.goto(base + "/recordatorios/");
  await page
    .getByRole("button", { name: "Vista previa", exact: true })
    .nth(1)
    .click();
  await d()
    .getByLabel("Resultado del proveedor de ejemplo", { exact: true })
    .selectOption("Fallido");
  await d().getByRole("button", { name: "Simular envío", exact: true }).click();
  await d().getByText("Fallido", { exact: true }).waitFor();
  await d()
    .getByRole("button", { name: "Simular reintento", exact: true })
    .click();
  await d().getByText("Aceptado por proveedor", { exact: true }).waitFor();
  checks.push("Correo simulado: fallo y reintento");
  await d().getByRole("button", { name: "Cerrar panel", exact: true }).click();
  await page.goto(base + "/reportes/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF", exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs("qa/reporte-demo.pdf");
  const bytes = await fs.readFile("qa/reporte-demo.pdf");
  if (bytes.subarray(0, 4).toString() !== "%PDF")
    throw new Error("Invalid PDF");
  checks.push("Descarga PDF de los datos de la vista");
  await page.goto(base);
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Escribe para encontrar...").fill("00000001");
  await d()
    .getByRole("button", { name: /Cliente Demo Uno/ })
    .click();
  await d().getByRole("tab", { name: "Ubicación", exact: true }).click();
  await d()
    .getByRole("button", { name: "Completar ubicación", exact: true })
    .click();
  await d().getByText("Editar coordenadas", { exact: true }).click();
  await d().getByLabel("Latitud", { exact: true }).fill("-12.12");
  await d().getByLabel("Longitud", { exact: true }).fill("-77.03");
  await d()
    .getByLabel(
      "Confirmo que el punto de Google Maps corresponde a esta vivienda",
      { exact: true },
    )
    .check();
  await d()
    .getByRole("button", { name: "Confirmar punto", exact: true })
    .click();
  await d()
    .getByRole("heading", { name: "Cliente Demo Uno", exact: true })
    .waitFor();
  checks.push("Confirmación manual de ubicación");
  await d().getByRole("button", { name: "Cerrar panel", exact: true }).click();
  if (errors.length) throw new Error(errors.join("; "));
  console.log(JSON.stringify({ checks, errors }, null, 2));
} catch (e) {
  await page.screenshot({ path: "qa/details-error.png", fullPage: false });
  console.error(e);
  console.error(JSON.stringify({ checks, errors }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
