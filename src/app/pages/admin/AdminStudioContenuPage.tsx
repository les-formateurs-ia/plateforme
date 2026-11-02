import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTh } from "@/app/theme/theme";
import { supabase } from "@/app/lib/supabase/client";

// Studio de contenu (site, SEO, Instagram) : une application à part, sur son
// propre domaine (dépôt site, dossier studio/). On lui passe le jeton Supabase
// de l'admin dans le fragment de l'adresse, jamais envoyé à un serveur : le
// studio vérifie lui-même la signature et is_admin(), puis ouvre sa propre
// session. ?retour=/… : la page du studio à rouvrir (quand sa session expire,
// le studio renvoie ici).
const STUDIO_URL = "https://studio.les-formateurs-ia.fr";

export function AdminStudioContenuPage() {
  const th = useTh();
  const [params] = useSearchParams();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const retour = params.get("retour") ?? "/";
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setFailed(true); return; }
      const fragment = new URLSearchParams({ token: session.access_token, retour });
      window.location.replace(`${STUDIO_URL}/connexion/#${fragment}`);
    });
  }, [params]);

  return (
    <div className="p-8 text-sm" style={{ color: th.fg3 }}>
      {failed ? "Session expirée : reconnectez-vous à la plateforme." : "Ouverture du studio de contenu…"}
    </div>
  );
}
