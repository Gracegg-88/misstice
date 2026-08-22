const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "m4v", "avi", "mkv"];

/** Détecte une vidéo à partir de l'extension d'une URL (bucket vendor-photos,
 * pas de colonne "type" en base : images et vidéos y cohabitent). */
export function isVideoUrl(url: string): boolean {
  const clean = url.split("?")[0].split("#")[0];
  const ext = clean.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.includes(ext);
}

export const BOOK_VIDEO_MAX_SECONDS = 180; // 3 minutes
export const BOOK_VIDEO_MAX_SHORT_SIDE = 700; // "700p" : plus petite dimension

/** Lit durée + résolution d'un fichier vidéo côté client, sans l'uploader. */
export function readVideoMeta(
  file: File
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire les informations de la vidéo."));
    };
    video.src = url;
  });
}
