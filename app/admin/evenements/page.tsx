import { createClient } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  name: string;
  type: string | null;
  event_date: string | null;
  guest_count: number;
  budget_total: number;
  created_at: string;
};

const fdate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default async function AdminEvents() {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("id, name, type, event_date, guest_count, budget_total, created_at")
    .order("created_at", { ascending: false });
  const events = (data as EventRow[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Événements
      </h1>
      <p className="mt-1 text-sm text-slate">
        {events.length} événement{events.length > 1 ? "s" : ""} créé
        {events.length > 1 ? "s" : ""} sur la plateforme.
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3 font-medium">Événement</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Invités</th>
                <th className="px-5 py-3 font-medium">Budget</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate">
                    Aucun événement.
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-plum">{e.name}</td>
                  <td className="px-5 py-3 text-slate">{e.type ?? "—"}</td>
                  <td className="px-5 py-3 text-slate">{fdate(e.event_date)}</td>
                  <td className="px-5 py-3 text-slate">{e.guest_count}</td>
                  <td className="px-5 py-3 text-slate">
                    {Number(e.budget_total).toLocaleString("fr-FR")} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
