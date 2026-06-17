import OpenAI from "openai";
import type { ZodType } from "zod";

/**
 * Client LLM (API OpenAI-compatible, vLLM auto-hébergé fourni par l'enseignant).
 * Modèle par défaut : qwen3.6-35b-a3b (texte+image, raisonnement).
 *
 * `callAgentJSON` : prompt système + contenu → JSON strict, validé par Zod (lib/schemas.ts),
 * avec AUTO-RÉPARATION en cas de JSON non conforme (l'erreur est renvoyée au modèle).
 *
 * NB : Qwen3 est un modèle à raisonnement → on désactive le "thinking"
 * (chat_template_kwargs.enable_thinking=false) pour obtenir le JSON directement dans `content`.
 */

export const MODEL = process.env.LLM_MODEL ?? "qwen3.6-35b-a3b";

let _client: OpenAI | null = null;
export function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.LLM_API_KEY || !process.env.LLM_BASE_URL) {
      throw new Error(
        "LLM_API_KEY / LLM_BASE_URL manquantes — copier .env.example vers .env.local",
      );
    }
    _client = new OpenAI({
      baseURL: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
    });
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

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function complete(messages: Msg[]): Promise<string> {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0,
    max_tokens: 4000,
    // vLLM/Qwen3 : désactive le raisonnement pour une sortie directe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chat_template_kwargs: { enable_thinking: false },
  } as any);
  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("Réponse sans contenu (content vide).");
  return content;
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
    "pas de texte autour, pas de commentaires.";

  const messages: Msg[] = [
    { role: "system", content: fullSystem },
    { role: "user", content: user },
  ];
  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    const text = await complete(messages);
    try {
      const parsed = JSON.parse(extractJson(text));
      return schema.parse(parsed);
    } catch (err) {
      lastErr = err;
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: `Ta réponse n'est pas un JSON valide pour le schéma. Erreur : ${
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
