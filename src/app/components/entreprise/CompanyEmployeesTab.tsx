import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Mail, Pencil, Trash2, Send } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { GCard } from "@/app/components/common/GCard";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import {
  listCompanyEmployees, addCompanyEmployee, updateCompanyEmployee, deleteCompanyEmployee, sendCompanyInvites,
  type CompanyEmployeeRow,
} from "@/app/lib/entreprise/companyEmployees";

export function CompanyEmployeesTab({ companyId }: { companyId: string }) {
  const th = useTh();
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
      toast.success(`Accès envoyé à ${result.sent.length} collaborateur${result.sent.length > 1 ? "s" : ""}.`);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer les accès.");
    } finally {
      setSendingAll(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: th.fg3 }}>{employees.length} collaborateur{employees.length > 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <VBtn onClick={handleSendAll} disabled={!pending.length || sendingAll}>
            <span className="flex items-center gap-2"><Send className="w-3.5 h-3.5" />{sendingAll ? "Envoi..." : `Envoyer les accès aux élèves (${pending.length})`}</span>
          </VBtn>
          {admin && (
            <ShimBtn sm onClick={openCreate}>
              <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" />Ajouter</span>
            </ShimBtn>
          )}
        </div>
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && !employees.length && (
        <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucun collaborateur pour l'instant.</div></GCard>
      )}

      {!!employees.length && (
        <GCard>
          <div className="divide-y" style={{ borderColor: th.sep }}>
            {employees.map((e) => (
              <div key={e.id} className="p-4 flex items-center justify-between gap-3" style={{ borderColor: th.sep }}>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{e.firstName} {e.lastName}</div>
                  <div className="text-xs truncate flex items-center gap-1.5 mt-0.5" style={{ color: th.fg3 }}><Mail className="w-3 h-3" />{e.email}</div>
                  <div className="text-[11px] mt-1" style={{ color: e.profileId ? "#6adeb1" : th.fg3 }}>
                    {e.profileId ? "Compte actif" : e.inviteSentAt ? "Invitation envoyée" : "Pas encore invité"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <VBtn sm onClick={() => void handleSendOne(e)} disabled={sendingIds.has(e.id) || !!e.profileId}>
                    <Send className="w-3.5 h-3.5" />
                  </VBtn>
                  {admin && (
                    <>
                      <VBtn sm onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></VBtn>
                      <button onClick={() => void handleDelete(e)} className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70" style={{ color: "#fbc2ad" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GCard>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le collaborateur" : "Nouveau collaborateur"}</DialogTitle>
            <DialogDescription>Nom, prénom et email — l'accès pourra être envoyé ensuite.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus placeholder="Prénom" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@entreprise.com" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
          </div>
          {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
          <DialogFooter>
            <ShimBtn onClick={handleSave} disabled={!firstName.trim() || !lastName.trim() || !email.trim() || saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </ShimBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
