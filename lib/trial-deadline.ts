// Calcul pur (testable) des actions à déclencher pour un devis "en attente
// de confirmation" (rencontre préalable) — utilisé par
// app/api/cron/trial-deadline/route.ts. La règle de date limite elle-même
// (deadline = MIN(paiement + 14j, événement - 7j)) est calculée côté SQL,
// dans mark_quote_paid (voir supabase/trial-confirmation-deadline.sql) :
// ce fichier ne fait que décider, une fois la deadline connue, s'il faut
// relancer ou confirmer automatiquement aujourd'hui.

function toUTCDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export type TrialQuoteActions = {
  overdue: boolean;
  needsJ3: boolean;
  needsJ1: boolean;
};

export function trialQuoteActions({
  now,
  escrowEventDate,
  deadline,
  j3SentAt,
  j1SentAt,
}: {
  now: Date;
  escrowEventDate: string | null;
  deadline: string | null;
  j3SentAt: string | null;
  j1SentAt: string | null;
}): TrialQuoteActions {
  const today = toUTCDate(now.toISOString().slice(0, 10));

  // Cas limite : l'événement est déjà passé, peu importe la deadline —
  // confirmation automatique immédiate.
  const eventPassed = escrowEventDate ? toUTCDate(escrowEventDate) < today : false;

  if (!deadline) {
    // Ne devrait pas arriver (mark_quote_paid la calcule toujours pour les
    // devis requires_trial) : par prudence, ne confirme que si l'événement
    // est passé, ne relance jamais sans deadline connue.
    return { overdue: eventPassed, needsJ3: false, needsJ1: false };
  }

  const deadlineDate = toUTCDate(deadline);
  const overdue = eventPassed || today.getTime() >= deadlineDate.getTime();
  if (overdue) {
    return { overdue: true, needsJ3: false, needsJ1: false };
  }

  const j3Threshold = new Date(deadlineDate.getTime() - 3 * 86400000);
  const j1Threshold = new Date(deadlineDate.getTime() - 1 * 86400000);
  // `>=` (pas `===`) : rattrape un passage de cron manqué plutôt que de
  // sauter silencieusement la relance.
  const needsJ3 = !j3SentAt && today.getTime() >= j3Threshold.getTime();
  const needsJ1 = !j1SentAt && today.getTime() >= j1Threshold.getTime();

  return { overdue: false, needsJ3, needsJ1 };
}
