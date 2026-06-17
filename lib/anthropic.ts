import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";

/**
 * Client Claude partagé + helper d'appel d'agent.
 *
 * `callAgentJSON` : envoie un prompt système + contenu, demande du JSON strict,
 * valide contre un schéma Zod (lib/schemas.ts), et AUTO-RÉPARE en cas de JSON
 * non conforme (jusqu'à `attempts` essais, en renvoyant l'erreur au modèle).
 * Robuste cross-version : on parse le JSON du texte plutôt que de dépendre
 * du helper structured-outputs.
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

/** Extrait le bloc JSON d'une réponse (gère ```json … ``` et le texte autour). */
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

type Msg = { role: "user" | "assistant"; content: string };

async function complete(system: string, messages: Msg[]): Promise<string> {
  const client = getClient();
  // `thinking.adaptive` et `output_config.effort` sont des features API récentes :
  // on contourne le typage du SDK (cast `any`) ; le corps est transmis tel quel à l'API.
  const params = {
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT },
    system,
    messages,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = (await client.messages.create(params as any)) as Anthropic.Message;
  const textBlock = res.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Réponse sans bloc texte.");
  }
  return textBlock.text;
}

/**
 * Appelle un agent et renvoie une sortie typée + validée, avec auto-réparation.
 * @param system   Prompt système (rôle de l'agent)
 * @param user     Contenu utilisateur (données d'entrée sérialisées)
 * @param schema   Schéma Zod de la sortie attendue
 * @param attempts Nombre d'essais (défaut 2 : 1 appel + 1 réparation)
 */
export async function callAgentJSON<T>(
  system: string,
  user: string,
  schema: ZodType<T>,
  attempts = 2,
): Promise<T> {
  const fullSystem =
    system +
    "\n\nRéponds UNIQUEMENT avec un objet JSON valide correspondant au schéma demandé : " +
    "pas de texte autour, pas de balises ```, pas de commentaires.";

  const messages: Msg[] = [{ role: "user", content: user }];
  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    const text = await complete(fullSystem, messages);
    try {
      const parsed = JSON.parse(extractJson(text));
      return schema.parse(parsed);
    } catch (err) {
      lastErr = err;
      // Tour de réparation : on renvoie la sortie fautive + l'erreur au modèle.
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content:
          `Ta réponse n'est pas un JSON valide pour le schéma. Erreur : ${
            err instanceof Error ? err.message : String(err)
          }. Renvoie UNIQUEMENT le JSON corrigé, sans texte ni balises.`,
      });
    }
  }

  throw new Error(
    `callAgentJSON: JSON invalide après ${attempts} essais — ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  );
}
