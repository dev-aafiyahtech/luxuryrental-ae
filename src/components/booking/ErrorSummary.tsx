"use client";

import { useId, type Ref } from "react";
import { CircleAlert } from "lucide-react";
import { useReducedMotion } from "./hooks";

export interface FormError {
  id: string; // the field (or fieldset) to focus
  message: string;
}

/** Error summary: shown on submit, takes focus, links to each field (GOV.UK pattern). */
export function ErrorSummary({ errors, title, ref }: { errors: FormError[]; title: string; ref?: Ref<HTMLDivElement> }) {
  const id = useId();
  const reduced = useReducedMotion();
  if (!errors.length) return null;
  return (
    <div ref={ref} tabIndex={-1} aria-labelledby={id} className="notice notice-danger outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
      <CircleAlert className="mt-0.5 h-5 w-5 flex-none text-danger" aria-hidden="true" />
      <div role="alert" className="grid gap-2">
        <h2 id={id} className="font-semibold text-fg">{title}</h2>
        <ul className="m-0 grid list-none gap-1 p-0">
          {errors.map((e) => (
            <li key={e.id + e.message}>
              <a
                href={`#${e.id}`}
                className="text-danger underline underline-offset-2"
                onClick={(ev) => {
                  ev.preventDefault();
                  const el = document.getElementById(e.id);
                  if (!el) return;
                  el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
                  el.focus({ preventScroll: true });
                }}
              >
                {e.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
