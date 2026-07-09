/**
 * Logo Misstice — wordmark serif (Playfair) en violet, avec une étincelle.
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
    <a href="/" className={`group inline-flex items-center ${className}`} aria-label="Misstice — accueil">
      <span className={`relative font-display text-xl font-bold tracking-tight sm:text-2xl ${color}`}>
        {/* Étincelle au-dessus du M */}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          width={16}
          height={16}
          className="absolute -left-1 -top-2.5 h-4 w-4"
        >
          <path
            d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"
            fill="#FF8C42"
          />
        </svg>
        Misstice
      </span>
    </a>
  );
}
