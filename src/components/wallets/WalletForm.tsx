"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import styles from "./WalletForm.module.css";
import { clsx } from "clsx";

const WALLET_TYPES = [
  { value: "CASH", label: "Efectivo" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT", label: "Crédito" },
  { value: "SAVINGS", label: "Ahorros" },
  { value: "INVESTMENT", label: "Inversión" },
];

const WALLET_CATEGORIES = [
  { value: "PERSONAL", label: "Personal" },
  { value: "BUSINESS", label: "Negocio" },
  { value: "HOME", label: "Hogar" },
];

interface Wallet {
  id?: string;
  name: string;
  type: string;
  category: string;
  balance: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  spaceId: string;
  initial?: Wallet;
}

export const WalletForm = ({ isOpen, onClose, onSave, spaceId, initial }: Props) => {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState(initial?.type || "CASH");
  const [category, setCategory] = useState(initial?.category || "PERSONAL");
  const [balance, setBalance] = useState(String(initial?.balance ?? "0"));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setCategory(initial.category);
      setBalance(String(initial.balance));
    } else {
      setName("");
      setType("CASH");
      setCategory("PERSONAL");
      setBalance("0");
    }
    setError("");
  }, [initial, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setIsLoading(true);
    try {
      const url = initial?.id ? `/api/wallets/${initial.id}` : "/api/wallets";
      const method = initial?.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, category, balance: parseFloat(balance) || 0, spaceId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Error al guardar");
        return;
      }
      onSave();
      onClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>{initial?.id ? "Editar cuenta" : "Nueva cuenta"}</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={22} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Ej: Cuenta corriente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label>Saldo inicial</label>
            <input
              type="number"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className={styles.input}
              step="0.01"
            />
          </div>

          <div className={styles.field}>
            <label>Tipo</label>
            <div className={styles.optionGrid}>
              {WALLET_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={clsx(styles.optionBtn, type === t.value && styles.selectedOption)}
                  onClick={() => setType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Categoría</label>
            <div className={styles.optionGrid}>
              {WALLET_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={clsx(styles.optionBtn, category === c.value && styles.selectedOption)}
                  onClick={() => setCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" className={styles.submitBtn} isLoading={isLoading}>
            {initial?.id ? "Guardar cambios" : "Crear cuenta"}
          </Button>
        </form>
      </div>
    </div>
  );
};
