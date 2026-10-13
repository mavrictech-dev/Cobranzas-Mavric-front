import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  locale: "es-PE",
  timezoneId: "America/Lima",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = "http://127.0.0.1:3000";
await fs.mkdir("qa", { recursive: true });
const dialog = () => page.getByRole("dialog");
async function openControl() {
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Escribe para encontrar...").fill("00000001");
  await dialog()
    .getByRole("button", { name: /Cliente Demo Uno/ })
    .click();
  await dialog().getByRole("tab", { name: "Préstamos", exact: true }).click();
  await dialog()
    .getByRole("button", { name: /PRE-001/ })
    .click();
}
async function pay(amount) {
  await dialog()
    .getByRole("button", { name: "Registrar pago", exact: true })
    .click();
  await dialog()
    .getByLabel(/Importe recibido/)
    .fill(String(amount));
  await dialog()
    .getByRole("button", { name: "Revisar distribución", exact: true })
    .click();
  await dialog()
    .getByRole("button", { name: "Confirmar pago", exact: true })
    .click();
  await dialog().getByText("Pago confirmado", { exact: true }).waitFor();
  return (await dialog().locator(".mono").textContent()).trim();
}
const result = { routes: [], themes: [], flows: [] };
try {
  await page.goto(base);
  await page
    .getByRole("heading", { name: "Tu cartera, en orden.", exact: true })
    .waitFor();
  await page.locator(".chart canvas").waitFor();
  await page.screenshot({ path: "qa/inicio-blanco.png", fullPage: true });
  await page.screenshot({path:"qa/inicio-presentacion.png",fullPage:false});
  await page.getByRole("button", { name: "Tema negro", exact: true }).click();
  await page.screenshot({ path: "qa/inicio-negro.png", fullPage: true });
  result.themes.push("Negro");
  await page.getByRole("button", { name: "Tema navi", exact: true }).click();
  await page.screenshot({ path: "qa/inicio-navi.png", fullPage: true });
  result.themes.push("Navi");
  await page.getByRole("button", { name: "Tema blanco", exact: true }).click();
  result.themes.push("Blanco");
  await openControl();
  await dialog()
    .getByRole("button", { name: "Registrar pago", exact: true })
    .click();
  await page.screenshot({ path: "qa/panel-pago.png", fullPage: false });
  await dialog()
    .getByLabel(/Importe recibido/)
    .fill("200");
  await dialog()
    .getByRole("button", { name: "Revisar distribución", exact: true })
    .click();
  await dialog()
    .getByRole("button", { name: "Confirmar pago", exact: true })
    .click();
  await dialog().getByText("Pago confirmado", { exact: true }).waitFor();
  await dialog()
    .getByRole("button", { name: "Ver préstamo", exact: true })
    .click();
  await dialog()
    .locator(".panel-metrics")
    .getByText(/800\.00/)
    .waitFor();
  result.flows.push("Pago parcial 200 → capital 800");
  const payment300 = await pay(300);
  await dialog()
    .getByRole("button", { name: "Ver préstamo", exact: true })
    .click();
  await pay(500);
  await dialog()
    .getByRole("button", { name: "Ver préstamo", exact: true })
    .click();
  await dialog().getByText("Liquidado", { exact: true }).waitFor();
  result.flows.push("Pagos 300 y 500 → liquidado");
  await dialog().getByRole("tab", { name: "Historial", exact: true }).click();
  await dialog().getByRole("button").filter({ hasText: payment300 }).click();
  await dialog()
    .getByRole("button", { name: "Reversar pago", exact: true })
    .click();
  await dialog()
    .getByLabel(/Motivo del reverso/)
    .fill("Corrección de presentación");
  await dialog()
    .getByRole("button", { name: "Confirmar reverso", exact: true })
    .click();
  await dialog()
    .getByRole("button", { name: "Ver préstamo", exact: true })
    .click();
  await dialog()
    .locator(".panel-metrics")
    .getByText(/300\.00/)
    .waitFor();
  result.flows.push("Reverso 300 → préstamo reabierto y capital 300");
  await dialog()
    .getByRole("button", { name: "Cerrar panel", exact: true })
    .click();
  for (const [route, title] of [
    ["clientes", "Cada cliente, a un clic."],
    ["prestamos", "Préstamos con claridad."],
    ["cobranzas", "Un paso más cerca de cobrar."],
    ["calendario", "Cada fecha tiene su lugar."],
    ["documentos", "Todo su expediente, a mano."],
    ["reportes", "Una vista más completa."],
    ["recordatorios", "Que ninguna fecha se pase."],
    ["configuracion", "A tu manera."],
  ]) {
    await page.goto(base + "/" + route + "/");
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    if (route === "calendario") {
      await page.locator(".fc").waitFor();
      await page.screenshot({ path: "qa/calendario.png", fullPage: true });
    }
    result.routes.push(route);
  }
  await page.goto(base + "/clientes/");
  await page
    .getByRole("button", { name: "Nuevo cliente", exact: true })
    .click();
  await dialog()
    .getByLabel(/Nombres y apellidos/)
    .fill("Cliente QA presentación");
  await dialog().getByLabel(/^DNI/).fill("12345678");
  await dialog().getByLabel("Teléfono", { exact: true }).fill("900000000");
  await dialog()
    .getByRole("button", { name: "Guardar cliente", exact: true })
    .click();
  await dialog()
    .getByRole("heading", { name: "Cliente QA presentación", exact: true })
    .waitFor();
  result.flows.push("Alta de cliente");
  await dialog()
    .getByRole("button", { name: "Cerrar panel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nuevo cliente", exact: true })
    .click();
  await dialog()
    .getByLabel(/Nombres y apellidos/)
    .fill("Duplicado");
  await dialog().getByLabel(/^DNI/).fill("12345678");
  await dialog().getByLabel("Teléfono", { exact: true }).fill("900000000");
  await dialog()
    .getByRole("button", { name: "Guardar cliente", exact: true })
    .click();
  await dialog()
    .getByRole("alert")
    .filter({ hasText: /DNI ya/ })
    .waitFor();
  result.flows.push("Documento duplicado rechazado");
  await dialog()
    .getByRole("button", { name: "Cerrar panel", exact: true })
    .click();
  await dialog()
    .getByRole("button", { name: "Descartar cambios", exact: true })
    .click();
  await page.goto(base + "/calendario/");
  await page.locator(".fc").waitFor();
  await page.getByRole("button", { name: "Semana", exact: true }).click();
  await page.locator(".fc-timegrid").waitFor();
  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await page.locator(".fc-list").waitFor();
  result.flows.push("Calendario mes/semana/agenda");
  await page
    .getByLabel("Perfil de presentación", { exact: true })
    .selectOption("Cobrador");
  await page.getByRole("link", { name: "Calendario", exact: true }).click();
  await page
    .getByRole("heading", { name: "Cada fecha tiene su lugar.", exact: true })
    .waitFor();
  if (
    (await page
      .getByLabel("Perfil de presentación", { exact: true })
      .inputValue()) !== "Cobrador"
  )
    throw new Error("Role lost during client navigation");
  result.flows.push("Navegación conserva rol de cobrador");
  await page
    .getByLabel("Perfil de presentación", { exact: true })
    .selectOption("Dueño");
  await page.goto(base);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("heading", { name: "Tu cartera, en orden.", exact: true })
    .waitFor();
  await page.locator(".chart canvas").waitFor();
  await page.screenshot({ path: "qa/inicio-movil.png", fullPage: true });
  result.flows.push("Vista móvil 390 px");
  result.errors = errors;
  if (errors.length) throw new Error("Browser errors: " + errors.join("; "));
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  await page.screenshot({ path: "qa/error.png", fullPage: true });
  console.error(e);
  console.error(JSON.stringify({ completed: result, errors }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
