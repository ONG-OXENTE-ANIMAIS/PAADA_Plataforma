"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, type ReactNode } from "react";

/**
 * Link que resolve âncoras (#id) tanto na navegação entre rotas
 * quanto quando já estamos na página de destino.
 */
export default function HashLink({
  href,
  children,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const pathname = usePathname();

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    document.body.classList.remove("nav-open");
    const [path, hash] = href.split("#");
    const target = path || "/";
    if (pathname === target && hash) {
      e.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      history.pushState(null, "", href);
    }
  }

  return (
    <Link href={href} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
