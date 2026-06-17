import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";

/**
 * Client Claude partagé + helper d'appel d'agent (pour Perso B).
 *
 * `callAgentJSON` : envoie un prompt système + contenu, demande du JSON strict,
 * puis valide la réponse contre un schéma Zod (lib/schemas.ts).
 * Robuste cross-version : on parse le JSON du texte plutôt que de dépendre
 * du helper structured-outputs. B peut upgrader vers output_config.format plus tard.
 */

export const MODEL = "claude-opus-4-8";

// adaptive thinking on ; effort "medium" = bon compromis latence/qualité pour la démo.
// Passer à "high" si la qualité prime, "low" pour accélérer.
export const EFFORT: "low" | "medium" | "high" = "medium";

let _client: Anthropic | null = null;
export function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY manquante — copier .env.example vers .env.local",
      );
    }
    _client = new Anthropic();
  }
  return _client;
}

/** Extrait le premier bloc JSON d'une réponse (gère les ```json … ``` éventuels). */
function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Aucun objet JSON trouvé dans la réponse du modèle.");
  }
  return raw.slice(start, end + 1);
}

/**
 * Appelle un agent et renvoie une sortie typée + validée.
 * @param system  Prompt système (rôle de l'agent)
 * @param user    Contenu utilisateur (données d'entrée sérialisées)
 * @param schema  Schéma Zod de la sortie attendue
 */
export async function callAgentJSON<T>(
  system: string,
  user: string,
  schema: ZodType<T>,
): Promise<T> {
  const client = getClient();
  // `thinking.adaptive` et `output_config.effort` sont des features API récentes :
  // on contourne le typage du SDK (cast `any`) ; le corps est transmis tel quel à l'API.
  const params = {
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT },
    system:
      system +
      "\n\nRéponds UNIQUEMENT avec un objet JSON valide correspondant au schéma demandé, sans texte autour.",
    messages: [{ role: "user", content: user }],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = (await client.messages.create(params as any)) as Anthropic.Message;

  const textBlock = res.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse sans bloc texte.");
  }
  const parsed = JSON.parse(extractJson(textBlock.text));
  return schema.parse(parsed);
}
