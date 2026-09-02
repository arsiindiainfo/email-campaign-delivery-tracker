// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import logoIcon from '../assets/logo-icon.png';

/** Persistent branding surface on every page (§31.2). */
export function BrandFooter() {
  return (
    <footer className="flex items-center justify-center gap-2 border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-400">
      <img src={logoIcon} alt="" className="h-4 w-4" />
      © {new Date().getFullYear()} Arsi India Info. All rights reserved.
    </footer>
  );
}
