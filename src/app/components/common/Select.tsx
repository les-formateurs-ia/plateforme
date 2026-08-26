import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

export interface VSelectOption {
  value: string;
  label: string;
}

interface VSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: VSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  sm?: boolean;
}

// Select stylisé maison (Radix nu, pas le wrapper shadcn de ui/select.tsx qui
// dépend de variables CSS --popover/--accent non branchées sur useTh) : liste
// déroulante custom au lieu du <select> natif, dont le menu ouvert ne peut de
// toute façon jamais être stylé cross-browser.
export function VSelect({ value, onValueChange, options, placeholder, disabled, sm }: VSelectProps) {
  const th = useTh();
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cx(
          "w-full flex items-center justify-between gap-2 rounded-xl outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed data-[placeholder]:opacity-60",
          sm ? "px-3.5 py-2 text-sm" : "px-4 py-3 text-sm",
        )}
        style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="v-select-content z-50 overflow-hidden rounded-xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
          style={{ background: th.card, border: `1px solid ${th.sep}`, width: "var(--radix-select-trigger-width)" }}
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1" style={{ color: th.fg3 }}>
            <ChevronDown className="w-3.5 h-3.5 rotate-180" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1.5" style={{ maxHeight: 280 }}>
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="v-select-item relative flex items-center gap-2 rounded-lg pl-8 pr-3 py-2 text-sm cursor-pointer select-none outline-none transition-colors"
                style={{ color: th.fg }}
              >
                <span className="absolute left-2.5 flex items-center justify-center w-4 h-4">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="w-3.5 h-3.5" style={{ color: th.navAC }} />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1" style={{ color: th.fg3 }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
