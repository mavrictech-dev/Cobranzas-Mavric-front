"use client";
import {
  Fragment,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import * as yup from "yup";
import { SpinnerGap } from "@phosphor-icons/react";
import { useDemo } from "@/providers/demo";
import { Button, Field, FormError, PanelFooter } from "./ui";
export type Values = Record<string, string>;
export type FormField = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  wide?: boolean;
};
export function EditForm({
  defaults,
  fields,
  schema,
  onSave,
  label = "Guardar cambios",
  extra,
  extraAfter,
  submitDisabled = false,
}: {
  defaults: Values;
  fields: FormField[];
  schema?: yup.AnyObjectSchema;
  onSave: (v: Values) => void | Promise<void>;
  label?: string;
  extra?:
    | ReactNode
    | ((v: Values, change: Dispatch<SetStateAction<Values>>) => ReactNode);
  extraAfter?: string;
  submitDisabled?: boolean;
}) {
  const [values, setValues] = useState(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { close, setDirty } = useDemo();
  const extraContent =
    typeof extra === "function" ? extra(values, setValues) : extra;
  return (
    <form
      noValidate
      className="panel-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current || submitDisabled) return;
        lock.current = true;
        setBusy(true);
        setError("");
        setErrors({});
        try {
          if (schema) await schema.validate(values, { abortEarly: false });
          await onSave(values);
          setDirty(false);
        } catch (e) {
          if (e instanceof yup.ValidationError) {
            const errs: Record<string, string> = {};
            for (const err of e.inner)
              if (err.path) errs[err.path] = err.message;
            setErrors(errs);
            setError("Revisa los campos señalados.");
          } else setError((e as Error).message);
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <div className="drawer-content">
        <div className="form-grid">
          {fields.map((field) => (
            <Fragment key={field.name}>
              <div className={field.wide ? "span-two" : ""}>
                <Field
                  label={field.label}
                  required={field.required}
                  hint={errors[field.name] ?? field.hint}
                >
                  {field.type === "select" ? (
                    <select
                      aria-invalid={!!errors[field.name]}
                      name={field.name}
                      value={values[field.name] ?? ""}
                      onChange={(e) =>
                        setValues({ ...values, [field.name]: e.target.value })
                      }
                    >
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      rows={3}
                      value={values[field.name] ?? ""}
                      onChange={(e) =>
                        setValues({ ...values, [field.name]: e.target.value })
                      }
                    />
                  ) : field.type === "checkbox" ? (
                    <input
                      name={field.name}
                      type="checkbox"
                      checked={values[field.name] === "true"}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [field.name]: String(e.target.checked),
                        })
                      }
                    />
                  ) : (
                    <input
                      name={field.name}
                      aria-invalid={!!errors[field.name]}
                      type={field.type ?? "text"}
                      inputMode={
                        field.type === "number" ? "decimal" : undefined
                      }
                      min={field.min}
                      max={field.max}
                      step={field.step ?? "any"}
                      value={values[field.name] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setValues({ ...values, [field.name]: e.target.value })
                      }
                    />
                  )}
                </Field>
              </div>
              {extraAfter === field.name && (
                <div className="span-two">{extraContent}</div>
              )}
            </Fragment>
          ))}
        </div>
        {!extraAfter && extraContent}
        <FormError message={error} />
      </div>
      <PanelFooter>
        <Button onClick={close}>Cancelar</Button>
        <Button
          type="submit"
          variant="primary"
          disabled={busy || submitDisabled}
        >
          {busy && <SpinnerGap className="spin" size={17} />}{" "}
          {busy ? "Guardando..." : label}
        </Button>
      </PanelFooter>
    </form>
  );
}
export const requiredText = (label: string) =>
  yup.string().trim().required(`Completa ${label.toLowerCase()}.`);
export const positive = (label: string) =>
  yup
    .number()
    .typeError(`Escribe un ${label.toLowerCase()} válido.`)
    .positive(`${label} debe ser mayor que cero.`)
    .required();
