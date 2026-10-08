import logoSvg from "@/imports/logo-les-formateurs-ia.svg?raw";
import { useTh } from "@/app/theme/theme";

// Logotype vectoriel du site public, peint à l'encre du thème (noir en
// clair, blanc en sombre) plutôt qu'un PNG blanc recoloré par filtre CSS.
export function Logo({ h = 28 }: { h?: number }) {
  const th = useTh();
  return (
    <span
      role="img"
      aria-label="Les Formateurs IA"
      className="block [&>svg]:h-full [&>svg]:w-auto [&_path]:fill-current"
      style={{ height: h * 0.86, color: th.fg }}
      dangerouslySetInnerHTML={{ __html: logoSvg }}
    />
  );
}
