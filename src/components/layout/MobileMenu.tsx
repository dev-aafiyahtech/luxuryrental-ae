"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

interface LinkItem { label: string; href: string }

export function MobileMenu({ nav, groups, labels, reserveHref }: { nav: LinkItem[]; groups: { label: string; links: LinkItem[] }[]; labels: { menu: string; close: string; reserve: string }; reserveHref: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Close when the route changes (the dialog stays mounted across navigations).
  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  return (
    <>
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fg lg:hidden" aria-label={labels.menu} aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <dialog ref={ref} className="m-0 h-dvh max-h-none w-full max-w-none bg-bg/95 p-0 text-fg backdrop:bg-bg/60 [&:not([open])]:hidden" aria-label={labels.menu} onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="container-site flex h-full flex-col gap-8 overflow-y-auto pb-10 pt-4">
          <div className="flex justify-end">
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line" aria-label={labels.close} onClick={() => ref.current?.close()} autoFocus>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav className="grid gap-1" aria-label={labels.menu}>
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="display-sm py-3 no-underline" onClick={() => ref.current?.close()}>
                {item.label}
              </Link>
            ))}
          </nav>
          {groups.map((g) => (
            <div key={g.label} className="grid gap-2">
              <p className="label">{g.label}</p>
              <ul className="flex flex-wrap gap-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm no-underline hover:border-accent" onClick={() => ref.current?.close()}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link href={reserveHref} className="btn btn-primary btn-block" onClick={() => ref.current?.close()}>
            {labels.reserve}
          </Link>
        </div>
      </dialog>
    </>
  );
}
