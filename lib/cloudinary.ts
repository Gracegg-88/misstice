// Upload d'images / vidéos vers Cloudinary en mode SIGNÉ.
// Le secret reste côté serveur (/api/cloudinary-sign) ; le client n'a que le
// cloud name et l'API key (publics).
//
// .env.local :
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud name>
//   NEXT_PUBLIC_CLOUDINARY_API_KEY=<api key ayant le droit d'upload>
//   CLOUDINARY_API_SECRET=<api secret>   (serveur uniquement, jamais NEXT_PUBLIC)

export function cloudinaryConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    !!process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  );
}

export type UploadedMedia = { url: string; type: "image" | "video" };

/**
 * Envoie un fichier OU une URL distante à Cloudinary (endpoint `auto/upload`,
 * qui gère indifféremment images et vidéos) et renvoie l'URL hébergée + le type.
 * La signature est calculée côté serveur.
 */
export async function uploadToCloudinary(
  source: File | string
): Promise<UploadedMedia> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  if (!cloud || !apiKey) {
    throw new Error("Cloudinary n'est pas configuré.");
  }

  // 1. Signature serveur.
  const signRes = await fetch("/api/cloudinary-sign", { method: "POST" });
  if (!signRes.ok) {
    throw new Error("Signature Cloudinary indisponible (secret manquant ?).");
  }
  const { signature, timestamp, folder } = await signRes.json();

  // 2. Envoi à Cloudinary.
  const form = new FormData();
  form.append("file", source);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/auto/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    let msg = "Échec de l'envoi vers Cloudinary.";
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }

  const json = await res.json();
  return {
    url: json.secure_url as string,
    type: json.resource_type === "video" ? "video" : "image",
  };
}
