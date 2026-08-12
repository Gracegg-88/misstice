/**
 * Logo Misstice — symbole M-papillon validé + wordmark serif.
 * `variant="light"` pour fonds clairs (défaut), `variant="dark"` pour fonds sombres.
 */
export default function Logo({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const color = variant === "dark" ? "text-white" : "text-violet";
  return (
    <a href="/" className={`group inline-flex items-center ${className}`} aria-label="Misstice, accueil">
      <img
        src="/brand/misstice-mark.png"
        alt=""
        aria-hidden="true"
        width={34}
        height={34}
        className="mr-2 h-8 w-8 object-contain sm:h-9 sm:w-9"
      />
      <span className={`font-display text-xl font-bold tracking-tight sm:text-2xl ${color}`}>
        Misstice
      </span>
    </a>
  );
}
