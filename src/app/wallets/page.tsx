"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useSpace } from "@/context/SpaceContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreditCard, Wallet as WalletIcon, Banknote, Plus, MoreVertical } from "lucide-react";
import styles from "./Wallets.module.css";
import { clsx } from "clsx";

export default function WalletsPage() {
  const { activeSpace } = useSpace();
  const [wallets, setWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeSpace) {
      fetchWallets();
    }
  }, [activeSpace]);

  const fetchWallets = async () => {
    try {
      const res = await fetch(`/api/wallets?spaceId=${activeSpace?.id}`);
      const data = await res.json();
      setWallets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "DEBIT": return <CreditCard size={24} />;
      case "CREDIT": return <CreditCard size={24} color="#ef4444" />;
      case "CASH": return <Banknote size={24} />;
      default: return <WalletIcon size={24} />;
    }
  };

  return (
    <Shell>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Mis Cuentas</h1>
            <p>Gestiona tus billeteras y tarjetas</p>
          </div>
          <Button size="sm">
            <Plus size={18} /> Añadir
          </Button>
        </header>

        <div className={styles.walletGrid}>
          {wallets.map((wallet: any) => (
            <Card key={wallet.id} className={styles.walletCard}>
              <div className={styles.walletHeader}>
                <div className={clsx(styles.iconWrapper, styles[wallet.type.toLowerCase()])}>
                  {getIcon(wallet.type)}
                </div>
                <button className={styles.moreBtn}><MoreVertical size={20} /></button>
              </div>
              <div className={styles.walletInfo}>
                <span className={styles.walletCategory}>{wallet.category}</span>
                <h3>{wallet.name}</h3>
                <p className={styles.balance}>${wallet.balance.toLocaleString()}</p>
              </div>
              <div className={styles.walletFooter}>
                <span className={styles.walletType}>{wallet.type}</span>
              </div>
            </Card>
          ))}
          
          <button className={styles.addCardPlaceholder}>
            <Plus size={32} />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>
    </Shell>
  );
}
