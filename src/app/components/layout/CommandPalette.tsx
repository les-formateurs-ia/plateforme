import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, CheckCircle2, Lock, Moon, Search, Sun, PlayCircle, MessageSquarePlus, CalendarPlus } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { useCourseProgress } from "@/app/state/useCourseProgress";
import { NAV_ITEMS, NAV_GROUP_LABELS } from "@/app/data/mock";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/app/components/ui/command";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const SHORTCUT_LABEL = isMac ? "⌘K" : "Ctrl K";

// Ouverture depuis n'importe où (bouton de la barre latérale, accueil…).
export const openCommandPalette = () => window.dispatchEvent(new Event("lfia:open-command"));

// Recherche rapide (⌘K / Ctrl K) : pages, leçons de la formation en cours et
// actions courantes, au clavier. Réservée au parcours apprenant CPF : le staff
// et les collaborateurs entreprise ont des espaces plus courts.
export function CommandPalette() {
  const th = useTh();
  const navigate = useNavigate();
  const { role, companyId } = useAuth();
  const enabled = !isStaff(role) && !companyId;
  const [open, setOpen] = useState(false);
  const course = useCourseProgress();

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((v) => !v); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("lfia:open-command", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("lfia:open-command", onOpen); };
  }, [enabled]);

  const next = course.lessonStates.find((s) => s.state === "available");
  const groups = useMemo(() => {
    const byGroup = new Map<string, typeof NAV_ITEMS>();
    for (const item of NAV_ITEMS) {
      const key = item.group ? NAV_GROUP_LABELS[item.group] : "Compte";
      byGroup.set(key, [...(byGroup.get(key) ?? []), item]);
    }
    return [...byGroup.entries()];
  }, []);

  if (!enabled) return null;
  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Recherche rapide" description="Aller à une page, une leçon ou lancer une action">
      <CommandInput placeholder="Rechercher une page, une leçon, une action…" />
      <CommandList className="max-h-[min(60vh,440px)]">
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        {next && (
          <CommandGroup heading="Reprendre">
            <CommandItem value={`reprendre ${next.lesson.title}`} onSelect={() => go(`/lesson/${next.lesson.id}`)}>
              <PlayCircle />{next.lesson.title}<CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup heading="Actions">
          <CommandItem value="nouvelle conversation agent" onSelect={() => go("/agent")}><MessageSquarePlus />Poser une question à mon agent IA</CommandItem>
          <CommandItem value="réserver rendez-vous formateur" onSelect={() => go("/calendar")}><CalendarPlus />Réserver un échange avec mon formateur</CommandItem>
          <CommandItem value="changer thème sombre clair" onSelect={() => { th.setThemeMode(th.isDark ? "light" : "dark"); setOpen(false); }}>
            {th.isDark ? <Sun /> : <Moon />}Passer en thème {th.isDark ? "clair" : "sombre"}
          </CommandItem>
        </CommandGroup>
        {groups.map(([heading, items]) => (
          <CommandGroup key={heading} heading={heading}>
            {items.map(({ id, Icon, label, path }) => (
              <CommandItem key={id} value={`${heading} ${label}`} onSelect={() => go(path)}><Icon />{label}</CommandItem>
            ))}
          </CommandGroup>
        ))}
        {course.outline && (
          <CommandGroup heading="Leçons">
            {course.lessonStates.map(({ lesson, state }) => (
              <CommandItem key={lesson.id} value={`leçon ${lesson.title}`} disabled={state === "locked"} onSelect={() => go(`/lesson/${lesson.id}`)}>
                {state === "completed" ? <CheckCircle2 /> : state === "locked" ? <Lock /> : <BookOpen />}
                <span className="truncate">{lesson.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Champ factice de la barre latérale qui ouvre la recherche rapide.
export function CommandTrigger() {
  const th = useTh();
  return (
    <button type="button" onClick={openCommandPalette}
      className="w-full flex items-center gap-2.5 px-3 h-9 rounded-[4px] text-[13px] transition-colors hover-fine:[border-color:var(--ink)]!"
      style={{ border: `1px solid ${th.inputB}`, color: th.fg3 }}>
      <Search className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 text-left">Rechercher…</span>
      <kbd className="text-[11px] font-semibold tracking-wide" style={{ color: th.fg3 }}>{SHORTCUT_LABEL}</kbd>
    </button>
  );
}
