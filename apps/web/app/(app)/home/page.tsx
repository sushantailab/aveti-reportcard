import { getAccessibleCentres } from "@/lib/centres";

/**
 * Deliberately minimal: this page's job right now is only to prove the
 * Next.js + Supabase stack reads the same centres/centre_memberships data the
 * live app does, under the same RLS policies. The real home screen (today's
 * tests, quick actions — assets/js/features/home-students.js in the current
 * app) is ported once marks/students/reports themselves move over.
 */
export default async function HomePage() {
  const centres = await getAccessibleCentres();

  if (centres.length === 0) {
    return (
      <p className="text-[var(--muted)]">
        This login has not been assigned to a centre yet. Ask the Master Admin to create access.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Your centres</h1>
      <ul className="mt-4 space-y-3">
        {centres.map((centre) => (
          <li key={centre.id} className="rounded-lg border border-black/10 bg-white p-4">
            <p className="font-medium">{centre.name}</p>
            <p className="text-sm text-[var(--muted)]">Role: {centre.role}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
