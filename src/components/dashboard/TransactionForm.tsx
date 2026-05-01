"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { X, Camera, Tag, MessageSquare, CreditCard } from "lucide-react";
import styles from "./TransactionForm.module.css";
import { clsx } from "clsx";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Wallet {
  id: string;
  name: string;
}

export const TransactionForm = ({ 
  isOpen, 
  onClose, 
  type: initialType = "EXPENSE",
  spaceId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  type?: "EXPENSE" | "INCOME";
  spaceId?: string;
}) => {
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && spaceId) {
      fetchData();
    }
  }, [isOpen, spaceId]);

  const fetchData = async () => {
    try {
      const [catsRes, walletsRes] = await Promise.all([
        fetch(`/api/categories?spaceId=${spaceId}&type=${type}`),
        fetch(`/api/wallets?spaceId=${spaceId}`)
      ]);
      setCategories(await catsRes.json());
      const wData = await walletsRes.json();
      setWallets(wData);
      if (wData.length > 0) setWalletId(wData[0].id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          categoryId,
          walletId,
          description,
          tags,
          spaceId
        })
      });
      if (res.ok) {
        onClose();
        // Reset form
        setAmount("");
        setDescription("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.typeSwitcher}>
            <button 
              className={clsx(styles.typeBtn, type === "EXPENSE" && styles.activeExpense)}
              onClick={() => setType("EXPENSE")}
            >
              Gasto
            </button>
            <button 
              className={clsx(styles.typeBtn, type === "INCOME" && styles.activeIncome)}
              onClick={() => setType("INCOME")}
            >
              Ingreso
            </button>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.amountSection}>
            <span className={styles.currency}>$</span>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.amountInput}
              autoFocus
              required
            />
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label><CreditCard size={18} /> Cuenta</label>
              <select value={walletId} onChange={(e) => setWalletId(e.target.value)} required>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label>Categoría</label>
              <div className={styles.categoryGrid}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={clsx(styles.categoryBtn, categoryId === cat.id && styles.selectedCategory)}
                    style={{ "--cat-color": cat.color } as any}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    <div className={styles.catIcon}>{cat.name[0]}</div>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <Tag size={18} />
            <input 
              type="text" 
              placeholder="Etiquetas (separadas por coma)" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <MessageSquare size={18} />
            <textarea 
              placeholder="Nota o comentario..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.photoSection}>
            <Button type="button" variant="outline" className={styles.photoBtn}>
              <Camera size={20} /> Adjuntar Foto
            </Button>
          </div>

          <Button type="submit" className={styles.submitBtn} isLoading={isLoading}>
            Añadir Transacción
          </Button>
        </form>
      </div>
    </div>
  );
};
