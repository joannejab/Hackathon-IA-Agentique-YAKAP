import type { SuggestedModule } from "./schemas";

/**
 * Catalogue de compétences CANONIQUES.
 *
 * Le dataset emploie des libellés variés selon la source (offres, syllabus, trends,
 * papiers). Ce catalogue réconcilie ces libellés vers un identifiant unique, ce qui
 * permet de relier une conclusion à TOUTES ses sources, peu importe leur formulation.
 *
 * Chaque entrée porte aussi le module pédagogique à proposer pour combler le gap —
 * de sorte que la suggestion soit, elle aussi, traçable à la compétence manquante.
 */

export interface CanonicalSkill {
  id: string;
  label: string;
  /** Mots-clés (minuscules) cherchés en sous-chaîne dans les libellés sources. */
  keywords: string[];
  /** Module proposé pour combler le gap (objectifs + volume horaire indicatif). */
  module: Omit<SuggestedModule, "rationale">;
}

export const CANONICAL_SKILLS: CanonicalSkill[] = [
  {
    id: "rag",
    label: "RAG (Retrieval-Augmented Generation)",
    keywords: ["rag", "retrieval-augmented", "retrieval augmented", "augmentée par récupération"],
    module: {
      title: "Retrieval-Augmented Generation",
      hours: 12,
      objectives: [
        "Architecturer un pipeline retrieval → génération",
        "Chunking, embeddings et indexation dans une base vectorielle",
        "Évaluer la pertinence et limiter les hallucinations (Ragas)",
      ],
    },
  },
  {
    id: "vector-db",
    label: "Bases de données vectorielles",
    keywords: ["vector database", "vectorielle", "vectorielles", "pinecone", "weaviate", "chroma", "qdrant"],
    module: {
      title: "Bases vectorielles & recherche sémantique",
      hours: 8,
      objectives: [
        "Indexation ANN (HNSW, IVF) et métriques de similarité",
        "Pinecone / Weaviate / Chroma en pratique",
        "Hybrid search et filtrage par métadonnées",
      ],
    },
  },
  {
    id: "fine-tuning",
    label: "Fine-tuning LLM (LoRA / QLoRA / RLHF)",
    keywords: ["fine-tuning", "fine tuning", "lora", "qlora", "rlhf", "dpo", "peft", "preference optimization"],
    module: {
      title: "Fine-tuning de LLM en pratique",
      hours: 12,
      objectives: [
        "Adaptation efficace : LoRA, QLoRA, PEFT",
        "Alignement par préférences : RLHF, DPO",
        "Préparer des jeux de données d'instruction",
      ],
    },
  },
  {
    id: "llm-agents",
    label: "Agents IA & orchestration",
    keywords: ["agent", "langgraph", "crewai", "autogen", "langchain", "model context protocol", "mcp"],
    module: {
      title: "Agents LLM & orchestration",
      hours: 14,
      objectives: [
        "Boucle ReAct : raisonnement + appel d'outils",
        "Graphes d'états (LangGraph) et multi-agents (CrewAI)",
        "Mémoire, reprise et human-in-the-loop",
      ],
    },
  },
  {
    id: "prompt-eng",
    label: "Prompt engineering & sorties structurées",
    keywords: ["prompt engineering", "structured output", "sorties structurées", "chain-of-thought", "chain of thought"],
    module: {
      title: "Prompt engineering & structured outputs",
      hours: 6,
      objectives: [
        "Patterns de prompting (few-shot, CoT, self-consistency)",
        "Sorties structurées et validation par schéma",
        "Robustesse et garde-fous",
      ],
    },
  },
  {
    id: "llm-obs",
    label: "Observabilité & évaluation LLM",
    keywords: ["observability", "observabilité", "langsmith", "ragas", "langfuse", "phoenix", "trulens", "llmops", "évaluation llm", "evaluation llm", "hallucination"],
    module: {
      title: "LLMOps : observabilité & évaluation",
      hours: 8,
      objectives: [
        "Tracing de chaînes LLM (LangSmith, Phoenix)",
        "Évaluation de pipelines RAG (Ragas, TruLens)",
        "Monitoring : hallucination, coût, latence",
      ],
    },
  },
  {
    id: "quantization",
    label: "Quantification & inférence efficace",
    keywords: ["quantification", "quantization", "vllm", "gptq", "awq", "int4", "ollama", "tgi", "inférence efficace", "serving de grands modèles", "flashattention", "flash attention"],
    module: {
      title: "Inférence efficace & quantification",
      hours: 8,
      objectives: [
        "Quantification GPTQ / AWQ / int4",
        "Serving haute performance : vLLM, TGI, Ollama",
        "Compromis latence / mémoire / qualité",
      ],
    },
  },
  {
    id: "llm-generative",
    label: "LLM génératifs & modèles de fondation",
    keywords: ["llm génératif", "llm génératifs", "modèles de fondation", "foundation model", "in-context learning", "mixture of experts", "moe", "gpt", "llama", "mistral", "mixtral"],
    module: {
      title: "LLM génératifs & in-context learning",
      hours: 10,
      objectives: [
        "Architectures décodeur et lois d'échelle",
        "In-context learning et few-shot",
        "Mixture of Experts (MoE)",
      ],
    },
  },
  {
    id: "diffusion",
    label: "Modèles de diffusion",
    keywords: ["diffusion", "stable diffusion", "dall-e", "dall·e", "sdxl", "latent diffusion"],
    module: {
      title: "Modèles génératifs d'images (diffusion)",
      hours: 8,
      objectives: [
        "Processus de diffusion latente (LDM)",
        "Conditionnement texte→image",
        "Fine-tuning et contrôle (LoRA, ControlNet)",
      ],
    },
  },
  {
    id: "multimodal",
    label: "Multimodal & foundation vision",
    keywords: ["multimodal", "clip", "llava", "flamingo", "blip", "segment anything", "sam", "foundation models vision", "vision à grande échelle"],
    module: {
      title: "Modèles multimodaux & foundation vision",
      hours: 8,
      objectives: [
        "Alignement image-texte (CLIP)",
        "Segmentation générique (SAM)",
        "VLMs : LLaVA, BLIP-2",
      ],
    },
  },
];

const NORM = (s: string) => s.toLowerCase().normalize("NFC");

/**
 * Matching tolérant mais précis :
 *  - mot-clé multi-mots ou avec tiret → recherche en sous-chaîne (assez long pour être sûr) ;
 *  - mot-clé d'un seul token → match sur token exact, pluriel FR (+s/+es),
 *    ou préfixe pour les mots longs (≥6) — évite "rag" ⊂ "ragas" ou "lora" ⊂ "exploration".
 */
function keywordHits(norm: string, tokens: Set<string>, kw: string): boolean {
  if (kw.includes(" ") || kw.includes("-")) return norm.includes(kw);
  if (tokens.has(kw) || tokens.has(kw + "s") || tokens.has(kw + "es")) return true;
  if (kw.length >= 6) {
    for (const tok of tokens) if (tok.startsWith(kw)) return true;
  }
  return false;
}

/** Renvoie les ids canoniques dont un mot-clé apparaît dans le texte. */
export function matchCanonical(text: string): string[] {
  const norm = NORM(text);
  const tokens = new Set(norm.split(/[^a-z0-9+]+/i).filter(Boolean));
  const ids: string[] = [];
  for (const skill of CANONICAL_SKILLS) {
    if (skill.keywords.some((k) => keywordHits(norm, tokens, k))) ids.push(skill.id);
  }
  return ids;
}

export function getCanonical(id: string): CanonicalSkill | undefined {
  return CANONICAL_SKILLS.find((s) => s.id === id);
}
