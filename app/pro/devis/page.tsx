import { redirect } from "next/navigation";

// Fusionné avec « Demandes » : deux onglets sur une seule page.
export default function ProDevisPage() {
  redirect("/pro/demandes?tab=devis");
}
