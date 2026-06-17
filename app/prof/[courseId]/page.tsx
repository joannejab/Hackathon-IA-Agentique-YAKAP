import Link from "next/link";
import { getAudit } from "@/lib/audit-service";
import { GapReport } from "@/components/GapReport";

/** Vue Prof — dossier d'accréditation. Next 16 : params async. */
export default async function ProfPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { audit, source } = await getAudit(courseId);

  return (
    <main className="flex-1 px-6 py-12">
      <article className="mx-auto max-w-2xl">
        <Link href="/chef" className="font-mono text-xs text-ink-soft hover:text-spine">
          ← vue chef de majeure
        </Link>
        <div className="mt-3">
          <GapReport audit={audit} source={source} />
        </div>
      </article>
    </main>
  );
}
