// Admin : définit à la main le mot de passe d'un élève (cf.
// supabase/functions/set-student-password), à lui transmettre ensuite.
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Eye, EyeOff, KeyRound, Wand2, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Dialog, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { DialogHero, HueButton, GhostButton, IconAction, ErrorText, SUCCESS } from "@/app/components/entreprise/EntrepriseKit";
import { PASSWORD_RULES, passwordProblem } from "@/app/lib/passwordPolicy";
import { setStudentPassword } from "@/app/lib/students";

// 12 caractères sans ambiguïté de lecture (pas de 0/O, 1/l/I), avec au moins
// une minuscule, une majuscule et un chiffre — conforme à PASSWORD_RULES.
function generatePassword(): string {
  const sets = ["abcdefghjkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789"];
  const all = sets.join("");
  const pick = (chars: string) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
  const chars = [...sets.map(pick), ...Array.from({ length: 9 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function SetStudentPasswordButton({ studentId, studentName, email }: { studentId: string; studentName: string; email: string }) {
  const th = useTh();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const openDialog = () => {
    setPassword("");
    setVisible(false);
    setError(null);
    setSaved(false);
    setOpen(true);
  };

  const handleSave = async () => {
    const problem = passwordProblem(password, email);
    if (problem) { setError(problem); return; }
    setSaving(true);
    setError(null);
    try {
      await setStudentPassword(studentId, password);
      setSaved(true);
      toast.success("Mot de passe modifié.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de modifier le mot de passe.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Email : ${email}\nMot de passe : ${password}`);
      toast.success("Identifiants copiés.");
    } catch {
      toast.error("Copie impossible : sélectionne le texte et copie-le à la main.");
    }
  };

  return (
    <>
      <IconAction Icon={KeyRound} onClick={openDialog} title="Modifier le mot de passe" />

      <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHero Icon={KeyRound} title="Modifier le mot de passe" desc={`${studentName} · ${email}`} />

          {saved ? (
            <div className="space-y-3 text-sm min-w-0" style={{ color: th.fg2 }}>
              <p>Le nouveau mot de passe est actif. Transmets-le à {studentName} : il ou elle pourra se connecter tout de suite avec son email.</p>
              <div className="rounded-xl px-3.5 py-2.5 font-mono text-xs break-all" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}>
                {email}<br />{password}
              </div>
              <p className="text-xs" style={{ color: th.fg3 }}>Ce mot de passe ne sera plus affiché après fermeture.</p>
              <DialogFooter>
                <HueButton Icon={Copy} onClick={copy}>Copier les identifiants</HueButton>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3 min-w-0">
              <div className="flex gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <input
                    type={visible ? "text" : "password"} autoComplete="new-password" autoFocus
                    value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && void handleSave()}
                    placeholder="Nouveau mot de passe" aria-label="Nouveau mot de passe"
                    className="w-full rounded-xl pl-4 pr-10 py-2.5 text-sm g-input"
                  />
                  <button type="button" onClick={() => setVisible((v) => !v)} title={visible ? "Masquer" : "Afficher"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70" style={{ color: th.fg3 }}>
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <GhostButton sm Icon={Wand2} onClick={() => { setPassword(generatePassword()); setVisible(true); setError(null); }}>Générer</GhostButton>
              </div>
              <ul className="space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <li key={rule.label} className="flex items-center gap-2 text-xs" style={{ color: ok ? SUCCESS : th.fg3 }}>
                      {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}{rule.label}
                    </li>
                  );
                })}
              </ul>
              {error && <ErrorText>{error}</ErrorText>}
              <DialogFooter>
                <HueButton Icon={KeyRound} onClick={handleSave} disabled={!password || saving}>{saving ? "Enregistrement..." : "Enregistrer le mot de passe"}</HueButton>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
