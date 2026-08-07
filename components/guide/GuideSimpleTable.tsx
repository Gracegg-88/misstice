export type SimpleRow = { poste: string; fourchette: string };

export default function GuideSimpleTable({ rows }: { rows: SimpleRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
      <table className="w-full min-w-[360px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 bg-violet-soft/50 text-xs uppercase tracking-wide text-plum">
            <th className="px-4 py-3 font-semibold">Poste</th>
            <th className="px-4 py-3 font-semibold">Fourchette</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.poste} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-3 font-medium text-plum">{r.poste}</td>
              <td className="px-4 py-3 text-slate">{r.fourchette}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
