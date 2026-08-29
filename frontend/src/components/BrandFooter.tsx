// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
/** Persistent branding surface on every page (§31.2). */
export function BrandFooter() {
  return (
    <footer className="border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-400">
      © {new Date().getFullYear()} Arsi India Info. All rights reserved.
    </footer>
  );
}
