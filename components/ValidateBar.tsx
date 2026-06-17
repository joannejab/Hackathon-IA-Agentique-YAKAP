"use client";

import { useState } from "react";

/** Barre d'action de la vue Prof : Valider / Demander révision → toast (boucle de validation mockée). */
export function ValidateBar({ courseTitle }: { courseTitle: string }) {
  const [toast, setToast] = useState<string | null>(null);

  function act(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
      <button
        onClick={() => act(`Révision validée pour « ${courseTitle} ».`)}
        className="rounded-md bg-spine px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spine"
      >
        Valider
      </button>
      <button
        onClick={() => act("Demande de révision envoyée à l'équipe pédagogique.")}
        className="rounded-md border border-rule px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-spine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spine"
      >
        Demander révision
      </button>
      {toast && (
        <span
          role="status"
          className="rounded-md bg-verified/10 px-3 py-2 text-sm text-verified"
        >
          {toast}
        </span>
      )}
    </div>
  );
}
