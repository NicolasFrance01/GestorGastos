"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { X, MessageSquare, CreditCard, CalendarDays } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
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

interface TransactionInitial {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  category: { name: string; color: string; icon: string };
  wallet?: { name: string };
}

export const TransactionForm = ({
  isOpen,
  onClose,
  type: initialType = "EXPENSE",
  spaceId,
  initial,
}: {
  isOpen: boolean;
  onClose: () => void;
  type?: "EXPENSE" | "INCOME";
  spaceId?: string;
  initial?: TransactionInitial;
}) => {
  const isEdit = !!initial?.id;
  const [type, setType] = useState<"EXPENSE" | "INCOME">(initialType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && spaceId) {
      fetchData();
    }
  }, [isOpen, spaceId, type]);

  useEffect(() => {
    if (initial) {
      setType(initial.type as "EXPENSE" | "INCOME");
      setAmount(String(initial.amount));
      setDescription(initial.description || "");
      setDate(initial.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    } else {
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
      setCategoryId("");
    }
  }, [initial, isOpen]);

  const fetchData = async () => {
    try {
      const [catsRes, walletsRes] = await Promise.all([
        fetch(`/api/categories?spaceId=${spaceId}&type=${type}`),
        fetch(`/api/wallets?spaceId=${spaceId}`)
      ]);
      const cats = await catsRes.json();
      const wData = await walletsRes.json();
      setCategories(Array.isArray(cats) ? cats : []);
      setWallets(Array.isArray(wData) ? wData : []);
      if (wData.length > 0 && !walletId) setWalletId(wData[0].id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEdit ? `/api/transactions/${initial!.id}` : "/api/transactions";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          categoryId,
          walletId,
          description,
          date,
          spaceId,
        }),
      });
      if (res.ok) {
        onClose();
        setAmount("");
        setDescription("");
        setCategoryId("");
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
              step="0.01"
              min="0"
            />
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label><CreditCard size={16} /> Cuenta</label>
              <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className={styles.select}>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label><CalendarDays size={16} /> Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.select}
              />
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
                    <div className={styles.catIcon}>
                      <CategoryIcon name={cat.icon} size={16} color="#fff" />
                    </div>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <MessageSquare size={18} />
            <input
              type="text"
              placeholder="Nota o descripción..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" className={styles.submitBtn} isLoading={isLoading}>
            {isEdit ? "Guardar cambios" : "Añadir Transacción"}
          </Button>
        </form>
      </div>
    </div>
  );
};
