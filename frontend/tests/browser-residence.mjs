import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { jpegWithGps } from "./photo-fixture.mjs";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  locale: "es-PE",
});
const page = await context.newPage();
const errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const dialog = () => page.getByRole("dialog");
const base = "http://127.0.0.1:3000";
async function newClient(name, dni) {
  await page.goto(base + "/clientes/");
  await page
    .getByRole("button", { name: "Nuevo cliente", exact: true })
    .click();
  await dialog()
    .getByLabel(/Nombres y apellidos/)
    .fill(name);
  await dialog().getByLabel(/^DNI/).fill(dni);
  await dialog().getByLabel("Teléfono", { exact: true }).fill("900000000");
}
async function data() {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("mavric.demo.v1")),
  );
}
const confirm = () =>
  dialog().getByLabel(
    "Confirmo que el punto de Google Maps corresponde a esta vivienda",
    { exact: true },
  );
try {
  await fs.mkdir("qa", { recursive: true });
  await newClient("Cliente Foto Sin GPS", "12345670");
  await page.screenshot({
    path: "qa/cliente-foto-formulario.png",
    fullPage: false,
  });
  const photos = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#d8e9df";
    ctx.fillRect(0, 0, 240, 160);
    ctx.fillStyle = "#304739";
    ctx.font = "16px sans-serif";
    ctx.fillText("Imagen de prueba", 42, 85);
    return {
      png: canvas.toDataURL("image/png").split(",")[1],
      jpeg: canvas.toDataURL("image/jpeg").split(",")[1],
    };
  });
  await dialog()
    .getByLabel("Foto del frontis de la casa", { exact: true })
    .setInputFiles({
      name: "frontis-sin-gps.png",
      mimeType: "image/png",
      buffer: Buffer.from(photos.png, "base64"),
    });
  await dialog()
    .getByRole("status")
    .filter({ hasText: "no contiene coordenadas GPS" })
    .waitFor();
  assert.equal(
    await dialog()
      .getByLabel("Enlace de Google Maps", { exact: true })
      .inputValue(),
    "",
  );
  await dialog()
    .getByLabel("Dirección", { exact: true })
    .fill("Calle de prueba 101");
  await dialog()
    .getByLabel("Enlace de Google Maps", { exact: true })
    .fill("https://example.com/");
  await dialog()
    .getByRole("button", { name: "Usar enlace de Maps", exact: true })
    .click();
  await dialog()
    .getByRole("alert")
    .filter({ hasText: "Usa un enlace de Google Maps" })
    .waitFor();
  await dialog()
    .getByLabel("Enlace de Google Maps", { exact: true })
    .fill("https://maps.app.goo.gl/referencia");
  await dialog()
    .getByRole("button", { name: "Usar enlace de Maps", exact: true })
    .click();
  await confirm().check();
  await dialog()
    .getByRole("button", { name: "Guardar cliente", exact: true })
    .click();
  await dialog()
    .getByRole("heading", { name: "Cliente Foto Sin GPS", exact: true })
    .waitFor();
  await dialog().getByRole("tab", { name: "Ubicación", exact: true }).click();
  await dialog()
    .getByRole("img", { name: "Foto del frontis de la vivienda", exact: true })
    .waitFor();
  let state = await data(),
    client = state.clients.find((c) => c.dni === "12345670");
  assert.equal(client.location, undefined);
  assert.equal(client.mapsConfirmed, true);
  assert.equal(
    state.documents.find((d) => d.id === client.frontisDocumentId).category,
    "Foto de casa",
  );
  checks.push(
    "Foto sin GPS conserva foto y enlace confirmado, sin inventar coordenadas",
  );
  await dialog()
    .getByRole("button", { name: "Cerrar panel", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Nuevo cliente", exact: true })
    .waitFor();
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Escribe para encontrar...").fill("12345670");
  await dialog()
    .getByRole("button", { name: /Cliente Foto Sin GPS/ })
    .click();
  await dialog().getByRole("tab", { name: "Ubicación", exact: true }).click();
  const preview = dialog().getByRole("img", {
    name: "Foto del frontis de la vivienda",
    exact: true,
  });
  await preview.waitFor();
  await preview.evaluate((img) => img.decode());
  checks.push("Foto del expediente disponible después de recargar");

  await newClient("Cliente Foto Con GPS", "12345671");
  await dialog()
    .getByLabel("Foto del frontis de la casa", { exact: true })
    .setInputFiles({
      name: "frontis-gps.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from(jpegWithGps(Buffer.from(photos.jpeg, "base64"))),
    });
  await dialog()
    .getByRole("status")
    .filter({ hasText: "GPS encontrado" })
    .waitFor();
  assert.match(
    await dialog()
      .getByLabel("Enlace de Google Maps", { exact: true })
      .inputValue(),
    /query=-12.12%2C-77.03/,
  );
  assert.equal(await confirm().isChecked(), false);
  await dialog()
    .getByLabel("Dirección", { exact: true })
    .fill("Calle de prueba 102");
  await confirm().check();
  await dialog()
    .getByRole("button", { name: "Guardar cliente", exact: true })
    .click();
  await dialog()
    .getByRole("heading", { name: "Cliente Foto Con GPS", exact: true })
    .waitFor();
  state = await data();
  client = state.clients.find((c) => c.dni === "12345671");
  assert.ok(Math.abs(client.location.lat + 12.12) < 1e-8);
  assert.ok(Math.abs(client.location.lng + 77.03) < 1e-8);
  assert.equal(client.location.source, "photo");
  assert.equal(client.location.confirmed, true);
  checks.push("GPS real del EXIF, enlace generado y confirmación persistida");
  await dialog().getByRole("tab", { name: "Ubicación", exact: true }).click();
  await dialog()
    .getByRole("button", { name: "Completar ubicación", exact: true })
    .click();
  await dialog()
    .getByLabel("Foto del frontis de la casa", { exact: true })
    .setInputFiles({
      name: "invalido.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });
  await dialog()
    .getByRole("alert")
    .filter({ hasText: "Elige una foto JPG" })
    .waitFor();
  checks.push("El frontis rechaza documentos PDF");

  await newClient("Vista de presentación", "12345672");
  for (const [name, theme] of [
    ["blanco", "light"],
    ["negro", "dark"],
    ["navi", "navy"],
  ]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    await page.screenshot({
      path: "qa/cliente-foto-" + name + ".png",
      fullPage: false,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog()
    .getByRole("button", { name: "Agregar foto del frontis", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "qa/cliente-foto-movil.png", fullPage: false });
  assert.equal(
    await dialog()
      .locator(".drawer-content")
      .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
    false,
  );
  checks.push("Tres temas y panel móvil sin desbordamiento");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks, errors }, null, 2));
} catch (e) {
  await page.screenshot({ path: "qa/error-residence.png", fullPage: false });
  console.error(e);
  console.error(JSON.stringify({ checks, errors }));
  process.exitCode = 1;
} finally {
  await browser.close();
}
