"use client";

import { useSpace } from "@/context/SpaceContext";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Wallet, PieChart, Bell, Tag, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Shell.module.css";
import { useState } from "react";
import { clsx } from "clsx";
import { SpaceModal } from "@/components/spaces/SpaceModal";

export const Shell = ({ children }: { children: React.ReactNode }) => {
  const { activeSpace, spaces, setActiveSpace, refreshSpaces } = useSpace();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);

  const navItems = [
    { name: "Resumen", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Cuentas", icon: Wallet, href: "/wallets" },
    { name: "Informes", icon: PieChart, href: "/reports" },
    { name: "Categorías", icon: Tag, href: "/categories" },
    { name: "Alertas", icon: Bell, href: "/alerts" },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.spaceSwitcher}>
            <button
              className={styles.activeSpaceBtn}
              onClick={() => setIsSpaceMenuOpen(!isSpaceMenuOpen)}
            >
              <div className={styles.spaceAvatar}>
                {activeSpace?.name[0].toUpperCase() || "P"}
              </div>
              <div className={styles.spaceInfo}>
                <span className={styles.spaceLabel}>Espacio</span>
                <span className={styles.spaceName}>{activeSpace?.name || "Personal"}</span>
              </div>
              <ChevronDown size={16} />
            </button>

            {isSpaceMenuOpen && (
              <div className={styles.spaceDropdown}>
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    className={clsx(styles.dropdownItem, activeSpace?.id === space.id && styles.active)}
                    onClick={() => {
                      setActiveSpace(space);
                      setIsSpaceMenuOpen(false);
                    }}
                  >
                    {space.name}
                  </button>
                ))}
                <div className={styles.divider} />
                <button
                  className={styles.addSpaceBtn}
                  onClick={() => {
                    setIsSpaceMenuOpen(false);
                    setIsSpaceModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Nuevo Espacio
                </button>
                {activeSpace && (
                  <button
                    className={styles.addSpaceBtn}
                    onClick={() => {
                      setIsSpaceMenuOpen(false);
                      setIsSpaceModalOpen(true);
                    }}
                  >
                    Gestionar miembros
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={styles.userProfile}>
            <Link href="/profile" className={styles.profileAvatar}>
              {(session?.user?.name || session?.user?.email || "?")[0].toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      <nav className={styles.bottomNav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(styles.navItem, pathname === item.href && styles.activeNav)}
          >
            <item.icon size={22} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <SpaceModal
        isOpen={isSpaceModalOpen}
        onClose={() => setIsSpaceModalOpen(false)}
        onSpaceCreated={refreshSpaces}
        activeSpaceId={activeSpace?.id}
        currentUserId={session?.user?.id}
      />
    </div>
  );
};
