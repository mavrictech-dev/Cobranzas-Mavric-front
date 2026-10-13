import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/mocks/seed";
import { execute } from "../src/domain/commands";
import {
  clientMapsUrl,
  mapsCoordinates,
  normalizeMapsUrl,
  readPhotoLocation,
  residenceData,
  residenceDefaults,
} from "../src/lib/residence";
import { jpegWithGps } from "./photo-fixture.mjs";

test("photo GPS is read from actual EXIF with south/west signs; missing GPS stays empty", async () => {
  const point = await readPhotoLocation(jpegWithGps());
  assert.ok(point);
  assert.ok(Math.abs(point.lat + 12.12) < 1e-8);
  assert.ok(Math.abs(point.lng + 77.03) < 1e-8);
  const png = Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jMfkAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  assert.equal(await readPhotoLocation(png), undefined);
});

test("Maps links accept shared URLs but never mistake the viewport center for the house", () => {
  assert.deepEqual(
    mapsCoordinates(
      "https://www.google.com/maps/search/?api=1&query=-12.12,-77.03",
    ),
    { lat: -12.12, lng: -77.03 },
  );
  assert.deepEqual(
    mapsCoordinates(
      "https://www.google.com/maps/place/Casa/@-1,-2,15z/data=!3d-12.12!4d-77.03",
    ),
    { lat: -12.12, lng: -77.03 },
  );
  assert.equal(
    mapsCoordinates("https://www.google.com/maps/@-1,-2,15z"),
    undefined,
  );
  assert.equal(
    mapsCoordinates("https://maps.app.goo.gl/referencia"),
    undefined,
  );
  assert.match(
    normalizeMapsUrl("http://maps.google.com/?q=-12,-77"),
    /^https:/,
  );
  for (const link of [
    "javascript:alert(1)",
    "https://www.google.com.evil.test/maps/",
    "https://example.com/",
    "https://user:pass@google.com/maps/",
    "https://google.com:444/maps/",
  ])
    assert.throws(() => normalizeMapsUrl(link));
});

test("GPS proposals remain unconfirmed and incomplete or invalid coordinates cannot be saved", () => {
  const values = {
    ...residenceDefaults(),
    lat: "0",
    lng: "0",
    locationSource: "photo",
    locationConfirmed: "false",
  };
  const proposal = residenceData(values);
  assert.equal(proposal.location?.confirmed, false);
  assert.equal(proposal.location?.lat, 0);
  assert.equal(proposal.mapsConfirmed, false);
  assert.throws(() => residenceData({ ...values, lng: "" }));
  assert.throws(() => residenceData({ ...values, lat: "91" }));
  assert.throws(() => residenceData({ ...values, lat: "NaN" }));
  const shared = residenceData({
    ...residenceDefaults(),
    mapsUrl: "https://maps.app.goo.gl/referencia",
    locationConfirmed: "true",
  });
  assert.equal(shared.location, undefined);
  assert.equal(shared.mapsConfirmed, true);
});

test("client and facade metadata save atomically; a duplicate or mismatched file leaves the input unchanged", () => {
  const state = createSeed();
  const client = {
    ...state.clients[0],
    id: "CLI-FOTO",
    dni: "87654321",
    name: "Cliente de prueba",
    frontisDocumentId: "DOC-FOTO",
    ...residenceData({
      ...residenceDefaults(),
      lat: "-12.12",
      lng: "-77.03",
      locationSource: "photo",
      locationConfirmed: "true",
    }),
  };
  const photo = {
    id: "DOC-FOTO",
    clientId: client.id,
    name: "frontis.jpg",
    mime: "image/jpeg",
    category: "Foto de casa",
    size: 1000,
    created: state.business.today,
  };
  const saved = execute(state, { type: "client.save", client, photo }, "Dueño");
  assert.equal(
    state.clients.some((c) => c.id === client.id),
    false,
  );
  assert.equal(
    saved.documents.find((d) => d.id === photo.id)?.clientId,
    client.id,
  );
  assert.equal(
    saved.clients.find((c) => c.id === client.id)?.frontisDocumentId,
    photo.id,
  );
  assert.match(clientMapsUrl(client), /query=-12.12%2C-77.03/);
  assert.throws(
    () =>
      execute(
        state,
        {
          type: "client.save",
          client: { ...client, dni: state.clients[0].dni },
          photo,
        },
        "Dueño",
      ),
    /DNI/,
  );
  assert.throws(
    () =>
      execute(
        state,
        {
          type: "client.save",
          client,
          photo: { ...photo, clientId: "CLI-OTRO" },
        },
        "Dueño",
      ),
    /foto/,
  );
  assert.equal(
    state.documents.some((d) => d.id === photo.id),
    false,
  );
});
