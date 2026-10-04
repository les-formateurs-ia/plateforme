import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Mail, Pencil, Trash2, Send, Link2, Users, UserPlus } from "lucide-react";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { Dialog, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import {
  ItemCard, ItemList, Toolbar, Initials, Pill, HueButton, GhostButton, IconAction, EmptyState, Loading, ErrorText, DialogHero,
  type PillTone,
} from "@/app/components/entreprise/EntrepriseKit";
import { GeneratePasswordLinkButton } from "@/app/components/admin/GeneratePasswordLinkButton";
import { SetStudentPasswordButton } from "@/app/components/admin/SetStudentPasswordButton";
import {
  listCompanyEmployees, addCompanyEmployee, updateCompanyEmployee, deleteCompanyEmployee, sendCompanyInvites,
  type CompanyEmployeeRow,
} from "@/app/lib/entreprise/companyEmployees";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// profile_id est rempli dès l'envoi de l'invitation : seul
// invite_accepted_at (mot de passe défini) signifie que le compte est utilisé.
// password_set_manually_at : mot de passe fixé par le staff (icône clé).
function accessStatus(e: CompanyEmployeeRow): { label: string; tone: PillTone } {
  if (e.passwordSetManuallyAt) return { label: "Mot de passe défini manuellement", tone: "done" };
  if (e.inviteAcceptedAt) return { label: "Compte activé", tone: "done" };
  if (e.profileId) return { label: `Invitation envoyée${e.inviteSentAt ? ` le ${formatDate(e.inviteSentAt)}` : ""} — en attente`, tone: "warn" };
  return { label: "Pas encore invité", tone: "muted" };
}

export function CompanyEmployeesTab({ companyId }: { companyId: string }) {
  const { role } = useAuth();
  const admin = isAdmin(role);

  const [employees, setEmployees] = useState<CompanyEmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyEmployeeRow | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sendingAll, setSendingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setEmployees(await listCompanyEmployees(companyId));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les collaborateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [companyId]);

  const openCreate = () => {
    setEditing(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: CompanyEmployeeRow) => {
    setEditing(row);
    setFirstName(row.firstName);
    setLastName(row.lastName);
    setEmail(row.email);
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateCompanyEmployee(editing.id, firstName.trim(), lastName.trim(), email.trim());
      } else {
        await addCompanyEmployee(companyId, firstName.trim(), lastName.trim(), email.trim());
      }
      setDialogOpen(false);
      await load();
      toast.success(editing ? "Collaborateur modifié." : "Collaborateur ajouté.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: CompanyEmployeeRow) => {
    if (!confirm(`Retirer ${row.firstName} ${row.lastName} de la liste ?`)) return;
    try {
      await deleteCompanyEmployee(row.id);
      setEmployees((rows) => rows.filter((r) => r.id !== row.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de retirer ce collaborateur.");
    }
  };

  const handleSendOne = async (row: CompanyEmployeeRow) => {
    setSendingIds((prev) => new Set(prev).add(row.id));
    try {
      const result = await sendCompanyInvites([row.id]);
      if (result.sent.length) toast.success(`Accès envoyé à ${row.email}.`);
      else if (result.errors.length) toast.error(result.errors[0].message);
      else toast.info("Cet accès a déjà été envoyé.");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer l'accès.");
    } finally {
      setSendingIds((prev) => { const next = new Set(prev); next.delete(row.id); return next; });
    }
  };

  const pending = employees.filter((e) => !e.profileId);

  const handleSendAll = async () => {
    if (!pending.length || sendingAll) return;
    setSendingAll(true);
    try {
      const result = await sendCompanyInvites(pending.map((e) => e.id));
      if (result.sent.length) toast.success(`Accès envoyé à ${result.sent.length} collaborateur${result.sent.length > 1 ? "s" : ""}.`);
      // errors montre la vraie cause (ex. email déjà utilisé, limite d'envoi) —
      // sans ça un échec silencieux affichait juste "envoyé à 0 collaborateurs".
      if (result.errors.length) {
        const messages = [...new Set(result.errors.map((e) => e.message))];
        messages.forEach((m) => toast.error(m));
      }
      if (!result.sent.length && !result.errors.length) toast.info("Tous les accès ont déjà été envoyés.");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer les accès.");
    } finally {
      setSendingAll(false);
    }
  };

  return (
    <div className="space-y-5 pt-2">
      <Toolbar summary={`${employees.length} collaborateur${employees.length > 1 ? "s" : ""}`}>
        <GhostButton Icon={Send} onClick={handleSendAll} disabled={!pending.length || sendingAll}>
          {sendingAll ? "Envoi..." : `Envoyer les accès (${pending.length})`}
        </GhostButton>
        {admin && <HueButton Icon={Plus} onClick={openCreate}>Ajouter</HueButton>}
      </Toolbar>

      {loading && <Loading />}
      {!loading && !employees.length && (
        <EmptyState Icon={Users} title="Aucun collaborateur pour l'instant"
          hint={admin ? "Ajoutez les collaborateurs de l'entreprise, puis envoyez-leur leur accès." : "L'administrateur ajoute la liste des collaborateurs."}
          action={admin ? <HueButton Icon={UserPlus} onClick={openCreate}>Ajouter un collaborateur</HueButton> : undefined} />
      )}

      <ItemList>
        {employees.map((e, i) => {
          const status = accessStatus(e);
          const fullName = `${e.firstName} ${e.lastName}`;
          return (
            <ItemCard key={e.id} index={i} leading={<Initials name={fullName} />} title={fullName}
              subtitle={<span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{e.email}</span>}
              pills={<Pill tone={status.tone}>{status.label}</Pill>}
              actions={<>
                {admin && e.profileId && !e.inviteAcceptedAt && (
                  <GeneratePasswordLinkButton studentId={e.profileId} studentName={fullName}
                    renderTrigger={({ onClick, disabled }) => <IconAction Icon={Link2} onClick={onClick} disabled={disabled} title="Générer un lien d'accès à transmettre" />} />
                )}
                {e.profileId && <SetStudentPasswordButton studentId={e.profileId} studentName={fullName} email={e.email} />}
                <IconAction Icon={Send} onClick={() => void handleSendOne(e)} disabled={sendingIds.has(e.id) || !!e.profileId}
                  title={e.profileId ? "Accès déjà envoyé" : "Envoyer l'accès par email"} />
                {admin && (
                  <>
                    <IconAction Icon={Pencil} onClick={() => openEdit(e)} title="Modifier" />
                    <IconAction Icon={Trash2} tone="danger" onClick={() => void handleDelete(e)} title="Retirer de la liste" />
                  </>
                )}
              </>} />
          );
        })}
      </ItemList>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent>
          <DialogHero Icon={editing ? Pencil : UserPlus} title={editing ? "Modifier le collaborateur" : "Nouveau collaborateur"} desc="Nom, prénom et email — l'accès pourra être envoyé ensuite." />
          <div className="space-y-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus placeholder="Prénom" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@entreprise.com" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <DialogFooter>
            <HueButton onClick={handleSave} disabled={!firstName.trim() || !lastName.trim() || !email.trim() || saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </HueButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
