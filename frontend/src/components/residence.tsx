"use client";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ArrowUpRight,
  Camera,
  CheckCircle,
  CopySimple,
  MapPin,
  Scan,
  SpinnerGap,
  UploadSimple,
} from "@phosphor-icons/react";
import type { Doc } from "@/domain/types";
import { getFile } from "@/lib/export";
import {
  addressMapsUrl,
  mapsCoordinates,
  normalizeMapsUrl,
  pointMapsUrl,
  readPhotoLocation,
  validCoordinates,
  validateHousePhoto,
} from "@/lib/residence";
import { useDemo } from "@/providers/demo";
import type { Values } from "./forms";
import { Badge, Button, Field, FormError } from "./ui";

function usePhotoPreview(file: File | null, document?: Doc) {
  const [preview, setPreview] = useState({ src: "", error: "" });
  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    setPreview({ src: "", error: "" });
    if (!file && document?.asset) {
      setPreview({ src: document.asset, error: "" });
      return;
    }
    if (!file && !document) return;
    Promise.resolve(file ?? getFile(document!.id))
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setPreview({
            src: "",
            error:
              "La foto no está disponible en este navegador. Vuelve a cargarla.",
          });
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setPreview({ src: objectUrl, error: "" });
      })
      .catch(() => {
        if (!cancelled)
          setPreview({ src: "", error: "No se pudo abrir la foto guardada." });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, document?.id, document?.asset]);
  return preview;
}

export function FrontisPreview({ document }: { document?: Doc }) {
  const { src, error } = usePhotoPreview(null, document);
  if (!document)
    return (
      <div className="frontis-empty">
        <Camera size={28} />
        <span>Foto del frontis pendiente</span>
      </div>
    );
  return (
    <>
      {src && (
        <div className="location-preview frontis-preview">
          <img
            src={src}
            alt={
              document.asset
                ? "Referencia ilustrada de una fachada ficticia"
                : "Foto del frontis de la vivienda"
            }
          />
          <Badge tone="neutral">
            {document.asset ? "Referencia ilustrada" : "Foto del frontis"}
          </Badge>
        </div>
      )}
      <FormError message={error} />
    </>
  );
}

export function ResidenceFields({
  values,
  change,
  file,
  onFile,
  document,
  onWorking,
  readOnly = false,
}: {
  values: Values;
  change: Dispatch<SetStateAction<Values>>;
  file: File | null;
  onFile: (file: File | null) => void;
  document?: Doc;
  onWorking: (working: boolean) => void;
  readOnly?: boolean;
}) {
  const { setDirty, notice } = useDemo();
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const [working, setWorking] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const { src, error: previewError } = usePhotoPreview(file, document);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  function update(patch: Values) {
    change((current) => ({ ...current, ...patch }));
    setDirty(true);
  }
  function busy(value: boolean) {
    setWorking(value);
    onWorking(value);
  }
  async function analyze(photo?: File) {
    const serial = ++request.current;
    busy(true);
    setError("");
    setAnalysis("");
    try {
      const source =
        photo ??
        file ??
        (document && !document.asset ? await getFile(document.id) : undefined);
      if (!source)
        throw new Error("Carga una foto original para analizar su ubicación.");
      const point = await readPhotoLocation(source);
      if (serial !== request.current) return;
      if (!point) {
        setAnalysis(
          "La foto no contiene coordenadas GPS. Busca por dirección o pega el enlace de Google Maps para completar la ubicación.",
        );
        return;
      }
      update({
        lat: String(point.lat),
        lng: String(point.lng),
        mapsUrl: pointMapsUrl(point),
        locationSource: "photo",
        locationConfirmed: "false",
      });
      setAnalysis(
        "GPS encontrado en la foto. Abre el punto en Google Maps y confirma que corresponde a la vivienda.",
      );
    } catch (e) {
      if (serial === request.current)
        setAnalysis(
          "No se pudo leer el GPS de esta foto. Puedes completar la dirección o el enlace de Maps manualmente.",
        );
    } finally {
      if (serial === request.current) busy(false);
    }
  }
  async function choosePhoto(photo?: File) {
    if (!photo) return;
    const serial = ++request.current;
    busy(true);
    setError("");
    try {
      validateHousePhoto(photo);
      const url = URL.createObjectURL(photo);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
      } finally {
        URL.revokeObjectURL(url);
      }
      if (serial !== request.current) return;
      onFile(photo);
      setDirty(true);
      update(
        values.locationSource === "photo"
          ? {
              lat: "",
              lng: "",
              mapsUrl: "",
              locationSource: "",
              locationConfirmed: "false",
            }
          : { locationConfirmed: "false" },
      );
      await analyze(photo);
    } catch (e) {
      if (serial === request.current) {
        setError(
          e instanceof Error && /^(Elige|La foto)/.test(e.message)
            ? e.message
            : "No se pudo abrir la imagen. Elige una foto JPG, PNG o WebP válida.",
        );
        busy(false);
      }
    }
  }
  const point =
    values.lat.trim() &&
    values.lng.trim() &&
    validCoordinates(Number(values.lat), Number(values.lng))
      ? { lat: Number(values.lat), lng: Number(values.lng) }
      : undefined;
  const approved = values.locationConfirmed === "true";
  let suppliedLink = "";
  try {
    suppliedLink = normalizeMapsUrl(values.mapsUrl ?? "");
  } catch {
    /* Field feedback is shown when applying or saving. */
  }
  const mapsLink = point ? pointMapsUrl(point) : suppliedLink;
  const copyLink =
    mapsLink ||
    (values.address?.trim()
      ? addressMapsUrl(values.address, values.district)
      : "");
  function applyLink() {
    setError("");
    try {
      const link = normalizeMapsUrl(values.mapsUrl);
      if (!link) throw new Error("Pega primero el enlace de Google Maps.");
      const coordinates = mapsCoordinates(link);
      update({
        mapsUrl: link,
        lat: coordinates ? String(coordinates.lat) : "",
        lng: coordinates ? String(coordinates.lng) : "",
        locationSource: "maps",
        locationConfirmed: "false",
      });
      setAnalysis(
        coordinates
          ? "Punto recuperado del enlace. Revisa la vivienda antes de confirmarlo."
          : "Enlace guardado como referencia. Ábrelo y comprueba que corresponde a la vivienda; los enlaces cortos pueden no incluir coordenadas.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="residence-fields" aria-label="Vivienda y ubicación">
      <div className="residence-heading">
        <span>
          <Camera size={20} />
          <strong>Vivienda y ubicación</strong>
        </span>
        <Badge tone={approved ? "success" : "neutral"}>
          {approved ? "Confirmada" : "Por completar"}
        </Badge>
      </div>
      <p className="residence-description">
        Foto del frontis, dirección y punto de Google Maps en el mismo
        expediente.
      </p>
      <div className="frontis-upload">
        {src ? (
          <img
            className="frontis-thumbnail"
            src={src}
            alt={
              document?.asset && !file
                ? "Referencia ilustrada de una fachada ficticia"
                : "Vista previa de la foto del frontis"
            }
          />
        ) : (
          <span className="frontis-placeholder">
            <Camera size={29} weight="light" />
          </span>
        )}
        <div className="frontis-upload-content">
          <strong>Foto del frontis de la casa</strong>
          <small>
            {file?.name ?? document?.name ?? "JPG, PNG o WebP · hasta 10 MB"}
          </small>
          {!readOnly && (
            <div className="button-row">
              <Button onClick={() => input.current?.click()} disabled={working}>
                <UploadSimple size={16} />
                {file || document ? "Cambiar foto" : "Agregar foto del frontis"}
              </Button>
              {file && (
                <Button
                  variant="ghost"
                  disabled={working}
                  onClick={() => {
                    request.current++;
                    onFile(null);
                    setAnalysis("");
                    if (values.locationSource === "photo")
                      update({
                        lat: "",
                        lng: "",
                        mapsUrl: "",
                        locationSource: "",
                        locationConfirmed: "false",
                      });
                    setDirty(true);
                  }}
                >
                  Quitar selección
                </Button>
              )}
            </div>
          )}
        </div>
        <input
          ref={input}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Foto del frontis de la casa"
          disabled={readOnly || working}
          onChange={(e) => {
            const photo = e.target.files?.[0];
            e.target.value = "";
            void choosePhoto(photo);
          }}
        />
      </div>
      {document?.asset && !file && (
        <small className="muted">
          Imagen de ejemplo ilustrada. Carga una foto para analizarla.
        </small>
      )}
      {!readOnly && (
        <Button
          className="analyze-photo"
          disabled={working || (!file && (!document || !!document.asset))}
          onClick={() => void analyze()}
        >
          {working ? (
            <SpinnerGap size={17} className="spin" />
          ) : (
            <Scan size={17} />
          )}
          {working ? "Analizando foto…" : "Analizar ubicación de la foto"}
        </Button>
      )}
      {analysis && (
        <div className="residence-analysis" role="status">
          <MapPin size={18} />
          <p>{analysis}</p>
        </div>
      )}
      <FormError message={error || previewError} />
      <Field label="Dirección">
        <input
          value={values.address ?? ""}
          placeholder="Calle, número, urbanización…"
          disabled={readOnly}
          onChange={(e) =>
            update({ address: e.target.value, locationConfirmed: "false" })
          }
        />
      </Field>
      <Field label="Distrito">
        <select
          value={values.district}
          disabled={readOnly}
          onChange={(e) =>
            update({ district: e.target.value, locationConfirmed: "false" })
          }
        >
          {[
            "Miraflores",
            "San Isidro",
            "Surco",
            "San Borja",
            "La Molina",
            "Barranco",
            "Otro",
          ].map((district) => (
            <option key={district}>{district}</option>
          ))}
        </select>
      </Field>
      <Field label="Referencia de la vivienda">
        <input
          value={values.reference ?? ""}
          placeholder="Color de fachada, esquina, piso…"
          disabled={readOnly}
          onChange={(e) => update({ reference: e.target.value })}
        />
      </Field>
      <Field
        label="Enlace de Google Maps"
        hint="Pega el enlace compartido desde Maps o usa el punto encontrado en la foto."
      >
        <input
          type="url"
          value={values.mapsUrl ?? ""}
          placeholder="https://maps.app.goo.gl/…"
          disabled={readOnly}
          onChange={(e) =>
            update({
              mapsUrl: e.target.value,
              lat: "",
              lng: "",
              locationSource: "maps",
              locationConfirmed: "false",
            })
          }
        />
      </Field>
      <div className="residence-actions">
        {!readOnly && (
          <Button
            disabled={!values.mapsUrl?.trim() || working}
            onClick={applyLink}
          >
            Usar enlace de Maps
          </Button>
        )}
        <Button
          disabled={!values.address?.trim()}
          onClick={() =>
            window.open(
              addressMapsUrl(values.address, values.district),
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          Buscar por dirección
          <ArrowUpRight size={15} />
        </Button>
        <Button
          disabled={!mapsLink}
          onClick={() => window.open(mapsLink, "_blank", "noopener,noreferrer")}
        >
          Ver punto en Google Maps
          <ArrowUpRight size={15} />
        </Button>
        <Button
          disabled={!copyLink}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copyLink);
              notice("Enlace de Google Maps copiado.");
            } catch {
              notice(
                "El navegador no permitió copiar. Puedes seleccionar el enlace o abrir Maps.",
              );
            }
          }}
        >
          <CopySimple size={15} />
          Copiar enlace
        </Button>
      </div>
      {point && (
        <div className="residence-point">
          <MapPin size={18} />
          <span>
            {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
          </span>
          <Badge tone="neutral">
            {values.locationSource === "photo"
              ? "GPS de la foto"
              : values.locationSource === "maps"
                ? "Del enlace"
                : "Punto manual"}
          </Badge>
        </div>
      )}
      <details className="residence-coordinates">
        <summary>Editar coordenadas</summary>
        <div className="form-grid">
          <Field label="Latitud">
            <input
              type="number"
              step="any"
              min={-90}
              max={90}
              value={values.lat ?? ""}
              disabled={readOnly}
              onChange={(e) =>
                update({
                  lat: e.target.value,
                  mapsUrl: "",
                  locationSource: "manual",
                  locationConfirmed: "false",
                })
              }
            />
          </Field>
          <Field label="Longitud">
            <input
              type="number"
              step="any"
              min={-180}
              max={180}
              value={values.lng ?? ""}
              disabled={readOnly}
              onChange={(e) =>
                update({
                  lng: e.target.value,
                  mapsUrl: "",
                  locationSource: "manual",
                  locationConfirmed: "false",
                })
              }
            />
          </Field>
        </div>
      </details>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={approved}
          disabled={readOnly || (!point && !suppliedLink) || working}
          onChange={(e) =>
            update({ locationConfirmed: String(e.target.checked) })
          }
        />
        <span>
          Confirmo que el punto de Google Maps corresponde a esta vivienda
        </span>
      </label>
      <p className="residence-note">
        <CheckCircle size={15} />
        El GPS indica dónde se tomó la foto. Revisa el punto antes de usarlo
        para una visita.
      </p>
    </section>
  );
}
