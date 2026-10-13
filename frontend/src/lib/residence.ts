import type { Client, Doc } from "../domain/types";

export type Coordinates = { lat: number; lng: number };
export type ResidenceValues = Record<string, string>;
export const photoLimit = 10 * 1024 * 1024;

export function validCoordinates(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function validateHousePhoto(file: { type: string; size: number }) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Elige una foto JPG, PNG o WebP del frontis.");
  if (!file.size || file.size > photoLimit)
    throw new Error("La foto debe tener contenido y pesar hasta 10 MB.");
}

export function normalizeMapsUrl(value: string) {
  if (!value.trim()) return "";
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Pega un enlace completo de Google Maps.");
  }
  const host = url.hostname.toLowerCase();
  const google = [
    "google.com",
    "www.google.com",
    "maps.google.com",
    "google.com.pe",
    "www.google.com.pe",
    "maps.google.com.pe",
  ];
  const allowed =
    (google.includes(host) &&
      (host.startsWith("maps.") || /^\/maps(?:\/|$)/.test(url.pathname))) ||
    (host === "maps.app.goo.gl" && url.pathname.length > 1) ||
    (host === "goo.gl" && /^\/maps\//.test(url.pathname));
  if (
    !allowed ||
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    value.length > 2048
  )
    throw new Error(
      "Usa un enlace de Google Maps, como maps.app.goo.gl o google.com/maps.",
    );
  url.protocol = "https:";
  return url.toString();
}

export function mapsCoordinates(value: string): Coordinates | undefined {
  const normalized = normalizeMapsUrl(value);
  if (!normalized) return;
  const url = new URL(normalized);
  // Shared short links have no coordinates to extract without resolving them.
  if (["maps.app.goo.gl", "goo.gl"].includes(url.hostname)) return;
  const parsePair = (text: string | null) => {
    const match = text?.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    );
    if (!match) return;
    const lat = Number(match[1]),
      lng = Number(match[2]);
    return validCoordinates(lat, lng) ? { lat, lng } : undefined;
  };
  const query = parsePair(
    url.searchParams.get("query") ?? url.searchParams.get("q"),
  );
  if (query) return query;
  const path = decodeURIComponent(url.pathname);
  // Place coordinates take priority over the map viewport's center.
  const place = path.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place) return parsePair(place[1] + "," + place[2]);
}

export function pointMapsUrl(point: Coordinates) {
  if (!validCoordinates(point.lat, point.lng))
    throw new Error("Revisa la latitud y longitud.");
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${point.lat},${point.lng}`)
  );
}

export function addressMapsUrl(address: string, district: string) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      [address.trim(), district.trim(), "Lima", "Perú"]
        .filter(Boolean)
        .join(", "),
    )
  );
}

export function clientMapsUrl(client: Client) {
  if (client.location?.confirmed) return pointMapsUrl(client.location);
  if (client.mapsUrl) {
    try {
      return normalizeMapsUrl(client.mapsUrl);
    } catch {
      /* Older local data can be corrected in the editor. */
    }
  }
  return addressMapsUrl(client.address, client.district);
}

export function frontisDocument(client: Client, documents: Doc[]) {
  return documents.find(
    (d) =>
      d.clientId === client.id &&
      d.mime.startsWith("image/") &&
      (client.frontisDocumentId
        ? d.id === client.frontisDocumentId
        : d.category === "Foto de casa"),
  );
}

export function residenceDefaults(client?: Client): ResidenceValues {
  return {
    address: client?.address ?? "",
    district: client?.district ?? "Miraflores",
    reference: client?.reference ?? "",
    mapsUrl:
      client?.mapsUrl ??
      (client?.location ? pointMapsUrl(client.location) : ""),
    lat: client?.location ? String(client.location.lat) : "",
    lng: client?.location ? String(client.location.lng) : "",
    locationSource: client?.location?.source ?? "manual",
    locationConfirmed: String(
      !!(client?.location?.confirmed || client?.mapsConfirmed),
    ),
  };
}

export function residenceData(
  values: ResidenceValues,
): Pick<
  Client,
  | "address"
  | "district"
  | "reference"
  | "mapsUrl"
  | "mapsConfirmed"
  | "location"
> {
  const mapsUrl = normalizeMapsUrl(values.mapsUrl ?? "");
  const hasLat = !!values.lat?.trim(),
    hasLng = !!values.lng?.trim();
  if (hasLat !== hasLng)
    throw new Error("Completa la latitud y longitud, o deja ambas vacías.");
  let point =
    hasLat && hasLng
      ? { lat: Number(values.lat), lng: Number(values.lng) }
      : mapsCoordinates(mapsUrl);
  if (point && !validCoordinates(point.lat, point.lng))
    throw new Error(
      "Revisa las coordenadas: latitud entre −90 y 90, longitud entre −180 y 180.",
    );
  const confirmed = values.locationConfirmed === "true";
  if (confirmed && !point && !mapsUrl)
    throw new Error(
      "Añade un punto o enlace de Maps antes de confirmar la ubicación.",
    );
  const source = ["photo", "maps", "manual"].includes(values.locationSource)
    ? (values.locationSource as NonNullable<Client["location"]>["source"])
    : "manual";
  return {
    address: (values.address ?? "").trim(),
    district: values.district ?? "Otro",
    reference: (values.reference ?? "").trim(),
    mapsUrl: mapsUrl || (point ? pointMapsUrl(point) : undefined),
    mapsConfirmed: confirmed && !!(mapsUrl || point),
    location: point ? { ...point, confirmed, source } : undefined,
  };
}

export async function readPhotoLocation(
  file: Blob | Uint8Array,
): Promise<Coordinates | undefined> {
  const { gps } = await import("exifr");
  const input = file instanceof Uint8Array ? file : await file.arrayBuffer();
  const data = await gps(input);
  if (!data || !validCoordinates(data.latitude, data.longitude)) return;
  return {
    lat: Number(data.latitude.toFixed(7)),
    lng: Number(data.longitude.toFixed(7)),
  };
}
