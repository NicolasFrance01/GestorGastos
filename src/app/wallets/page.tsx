"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useSpace } from "@/context/SpaceContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WalletForm } from "@/components/wallets/WalletForm";
import { CreditCard, Wallet as WalletIcon, Banknote, Plus, Pencil, Trash2, PiggyBank, TrendingUp } from "lucide-react";
import styles from "./Wallets.module.css";
import { clsx } from "clsx";

interface Wallet {
  id: string;
  name: string;
  type: string;
  category: string;
  balance: number;
}

export default function WalletsPage() {
  const { activeSpace } = useSpace();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Wallet | undefined>();

  useEffect(() => {
    if (activeSpace) fetchWallets();
  }, [activeSpace]);

  const fetchWallets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wallets?spaceId=${activeSpace?.id}`);
      const data = await res.json();
      setWallets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    try {
      await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      fetchWallets();
    } catch (error) {
      console.error(error);
    }
  };

  const openEdit = (wallet: Wallet) => {
    setEditing(wallet);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditing(undefined);
    setIsFormOpen(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "DEBIT": return <CreditCard size={24} />;
      case "CREDIT": return <CreditCard size={24} />;
      case "CASH": return <Banknote size={24} />;
      case "SAVINGS": return <PiggyBank size={24} />;
      case "INVESTMENT": return <TrendingUp size={24} />;
      default: return <WalletIcon size={24} />;
    }
  };

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Shell>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Mis Cuentas</h1>
            <p>Gestiona tus billeteras y tarjetas</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus size={18} /> Añadir
          </Button>
        </header>

        {isLoading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : (
          <div className={styles.walletGrid}>
            {wallets.map((wallet) => (
              <Card key={wallet.id} className={styles.walletCard}>
                <div className={styles.walletHeader}>
                  <div className={clsx(styles.iconWrapper, styles[wallet.type.toLowerCase()])}>
                    {getIcon(wallet.type)}
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.actionBtn} onClick={() => openEdit(wallet)}>
                      <Pencil size={15} />
                    </button>
                    <button className={clsx(styles.actionBtn, styles.deleteBtn)} onClick={() => handleDelete(wallet.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className={styles.walletInfo}>
                  <span className={styles.walletCategory}>{wallet.category}</span>
                  <h3>{wallet.name}</h3>
                  <p className={styles.balance}>${fmt(wallet.balance)}</p>
                </div>
                <div className={styles.walletFooter}>
                  <span className={styles.walletType}>{wallet.type}</span>
                </div>
              </Card>
            ))}

            <button className={styles.addCardPlaceholder} onClick={openCreate}>
              <Plus size={32} />
              <span>Nueva Cuenta</span>
            </button>
          </div>
        )}
      </div>

      <WalletForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={fetchWallets}
        spaceId={activeSpace?.id || ""}
        initial={editing}
      />
    </Shell>
  );
}
