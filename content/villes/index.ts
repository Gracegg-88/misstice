import type { CityEventContentFile } from "@/lib/city-content";
import grenobleBabyShower from "./grenoble/baby-shower.json";

// Registre explicite (import statique) : les fichiers JSON sont ainsi
// embarqués au build, sans lecture disque à l'exécution. Ajouter ici chaque
// nouveau fichier content/villes/<ville>/<evenement>.json.
export const CITY_EVENT_CONTENT_FILES: CityEventContentFile[] = [
  grenobleBabyShower,
];
