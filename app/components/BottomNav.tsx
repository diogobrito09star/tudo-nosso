"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-bottom">
      <Link
        href="/registar"
        className={pathname === "/registar" ? "active" : ""}
      >
        Registar
      </Link>
      <Link
        href="/historico"
        className={pathname === "/historico" ? "active" : ""}
      >
        Histórico
      </Link>
    </nav>
  );
}
