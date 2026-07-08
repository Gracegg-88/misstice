"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import AdminNav from "./AdminNav";

export default function AdminMobileMenu() {
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

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-plum/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-plum"
              >
                <X size={18} />
              </button>
            </div>
            {/* Un clic sur un lien ferme le tiroir */}
            <div onClick={() => setOpen(false)}>
              <AdminNav />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
