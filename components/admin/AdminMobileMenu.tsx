"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import AdminNav from "./AdminNav";

export default function AdminMobileMenu({
  canManageAdmins = false,
}: {
  canManageAdmins?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-plum lg:hidden"
      >
        <Menu size={22} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 lg:hidden">
            <div
              className="absolute inset-0 bg-plum/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative flex max-h-[85vh] w-full max-w-sm flex-col overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-plum">Menu</span>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-plum"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Un clic sur un lien ferme la modale */}
              <div onClick={() => setOpen(false)}>
                <AdminNav canManageAdmins={canManageAdmins} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
