"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { X, MessageSquare, CreditCard, CalendarDays, Plus } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import styles from "./TransactionForm.module.css";
import { clsx } from "clsx";

interface Category { id: string; name: string; icon: string; color: string; }
interface Wallet { id: string; name: string; }
interface TransactionInitial {
  id: string; amount: number; type: string; description: string;
  date: string; category: { name: string; color: string; icon: string }; wallet?: { name: string };
}

function formatAmount(raw: string): { display: string; numeric: string } {
  const cleaned = raw.replace(/[^\d,]/g, "");
  const [intRaw, ...decParts] = cleaned.split(",");
  const intFormatted = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decSuffix = decParts.length > 0 ? "," + decParts[0].slice(0, 2) : "";
  const display = intFormatted + decSuffix;
  const numeric = intRaw + (decParts.length > 0 ? "." + decParts[0].slice(0, 2) : "");
  return { display, numeric };
}

const CAT_ICONS = ["Tag","Utensils","Car","Home","ShoppingBag","Heart","Briefcase","Plane","Coffee","Gamepad2","BookOpen","Music","Dumbbell","Gift","Zap","Wallet"];
const CAT_COLORS = ["#ef4444","#f97316","#eab308","#10b981","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#84cc16","#64748b"];
const WALLET_TYPES = [
  { value: "CASH", label: "Efectivo" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT", label: "Crédito" },
  { value: "SAVINGS", label: "Ahorros" },
  { value: "INVESTMENT", label: "Inversión" },
];

export const TransactionForm = ({
  isOpen, onClose, type: initialType = "EXPENSE", spaceId, initial,
}: {
  isOpen: boolean; onClose: () => void;
  type?: "EXPENSE" | "INCOME"; spaceId?: string; initial?: TransactionInitial;
}) => {
  const isEdit = !!initial?.id;
  const [type, setType] = useState<"EXPENSE" | "INCOME">(initialType);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [amountNumeric, setAmountNumeric] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Nueva categoría inline
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Tag");
  const [newCatColor, setNewCatColor] = useState("#10b981");
  const [savingCat, setSavingCat] = useState(false);

  // Nueva cuenta inline
  const [showNewWallet, setShowNewWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState("CASH");
  const [savingWallet, setSavingWallet] = useState(false);

  useEffect(() => { if (isOpen && spaceId) fetchData(); }, [isOpen, spaceId, type]);

  useEffect(() => {
    if (initial) {
      setType(initial.type as "EXPENSE" | "INCOME");
      const { display, numeric } = formatAmount(String(initial.amount).replace(".", ","));
      setAmountDisplay(display);
      setAmountNumeric(numeric);
      setDescription(initial.description || "");
      setDate(initial.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    } else {
      setAmountDisplay("");
      setAmountNumeric("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
      setCategoryId("");
    }
    setShowNewCat(false);
    setShowNewWallet(false);
  }, [initial, isOpen]);

  // Al editar, pre-seleccionar categoría por nombre cuando carguen las categorías
  useEffect(() => {
    if (isEdit && initial && categories.length > 0) {
      const match = categories.find(c => c.name === initial.category.name);
      if (match) setCategoryId(match.id);
    }
  }, [initial, categories]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { display, numeric } = formatAmount(e.target.value);
    setAmountDisplay(display);
    setAmountNumeric(numeric);
  };

  const fetchData = async () => {
    try {
      const [catsRes, walletsRes] = await Promise.all([
        fetch(`/api/categories?spaceId=${spaceId}&type=${type}`),
        fetch(`/api/wallets?spaceId=${spaceId}`),
      ]);
      const cats = await catsRes.json();
      const wData = await walletsRes.json();
      setCategories(Array.isArray(cats) ? cats : []);
      setWallets(Array.isArray(wData) ? wData : []);
      if (wData.length > 0 && !walletId) setWalletId(wData[0].id);
      if (!isEdit && cats.length > 0) setCategoryId(cats[0].id);
    } catch (error) { console.error(error); }
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__new__") {
      setShowNewWallet(true);
      setWalletId("");
    } else {
      setWalletId(e.target.value);
      setShowNewWallet(false);
    }
  };

  const createCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), type, icon: newCatIcon, color: newCatColor, spaceId }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories(prev => [...prev, cat]);
        setCategoryId(cat.id);
        setShowNewCat(false);
        setNewCatName("");
        setNewCatIcon("Tag");
        setNewCatColor("#10b981");
      }
    } catch (error) { console.error(error); }
    finally { setSavingCat(false); }
  };

  const createWallet = async () => {
    if (!newWalletName.trim()) return;
    setSavingWallet(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWalletName.trim(), type: newWalletType, category: "PERSONAL", balance: 0, spaceId }),
      });
      if (res.ok) {
        const w = await res.json();
        setWallets(prev => [...prev, w]);
        setWalletId(w.id);
        setShowNewWallet(false);
        setNewWalletName("");
        setNewWalletType("CASH");
      }
    } catch (error) { console.error(error); }
    finally { setSavingWallet(false); }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = isEdit ? `/api/transactions/${initial!.id}` : "/api/transactions";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amountNumeric), type, categoryId, walletId, description, date, spaceId }),
      });
      if (res.ok) { onClose(); setAmountDisplay(""); setAmountNumeric(""); setDescription(""); setCategoryId(""); }
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.typeSwitcher}>
            <button className={clsx(styles.typeBtn, type === "EXPENSE" && styles.activeExpense)} onClick={() => setType("EXPENSE")}>Gasto</button>
            <button className={clsx(styles.typeBtn, type === "INCOME" && styles.activeIncome)} onClick={() => setType("INCOME")}>Ingreso</button>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.amountSection}>
            <span className={styles.currency}>$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amountDisplay}
              onChange={handleAmountChange}
              className={styles.amountInput}
              autoFocus
              required
            />
          </div>

          <div className={styles.grid}>
            {/* Cuenta */}
            <div className={styles.field}>
              <label><CreditCard size={16} /> Cuenta</label>
              <select
                value={showNewWallet ? "__new__" : walletId}
                onChange={handleWalletChange}
                className={styles.select}
              >
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                <option value="__new__">+ Nueva Cuenta</option>
              </select>
              {showNewWallet && (
                <div className={styles.inlineForm}>
                  <input
                    type="text"
                    placeholder="Nombre de la cuenta"
                    value={newWalletName}
                    onChange={e => setNewWalletName(e.target.value)}
                    className={styles.inlineInput}
                  />
                  <select value={newWalletType} onChange={e => setNewWalletType(e.target.value)} className={styles.inlineSelect}>
                    {WALLET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className={styles.inlineActions}>
                    <button type="button" className={styles.inlineSave} onClick={createWallet} disabled={savingWallet}>
                      {savingWallet ? "..." : "Crear"}
                    </button>
                    <button type="button" className={styles.inlineCancel} onClick={() => { setShowNewWallet(false); setWalletId(wallets[0]?.id || ""); }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Fecha */}
            <div className={styles.field}>
              <label><CalendarDays size={16} /> Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={styles.select} />
            </div>

            {/* Categoría */}
            <div className={styles.field}>
              <div className={styles.catHeader}>
                <label>Categoría</label>
                <button type="button" className={styles.newCatBtn} onClick={() => setShowNewCat(!showNewCat)}>
                  <Plus size={14} /> Nueva
                </button>
              </div>
              <div className={styles.categoryGrid}>
                {categories.map(cat => (
                  <button key={cat.id} type="button"
                    className={clsx(styles.categoryBtn, categoryId === cat.id && styles.selectedCategory)}
                    style={{ "--cat-color": cat.color } as React.CSSProperties}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    <div className={styles.catIcon}><CategoryIcon name={cat.icon} size={16} color="#fff" /></div>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {showNewCat && (
                <div className={styles.inlineForm}>
                  <input
                    type="text"
                    placeholder="Nombre de la categoría"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className={styles.inlineInput}
                  />
                  <div className={styles.iconPicker}>
                    {CAT_ICONS.map(icon => (
                      <button key={icon} type="button"
                        className={clsx(styles.iconOption, newCatIcon === icon && styles.iconSelected)}
                        style={{ backgroundColor: newCatIcon === icon ? newCatColor : undefined }}
                        onClick={() => setNewCatIcon(icon)}
                      >
                        <CategoryIcon name={icon} size={14} color={newCatIcon === icon ? "#fff" : "#64748b"} />
                      </button>
                    ))}
                  </div>
                  <div className={styles.colorPicker}>
                    {CAT_COLORS.map(color => (
                      <button key={color} type="button"
                        className={clsx(styles.colorDot, newCatColor === color && styles.colorSelected)}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCatColor(color)}
                      />
                    ))}
                  </div>
                  <div className={styles.inlineActions}>
                    <button type="button" className={styles.inlineSave} onClick={createCategory} disabled={savingCat}>
                      {savingCat ? "..." : "Crear"}
                    </button>
                    <button type="button" className={styles.inlineCancel} onClick={() => { setShowNewCat(false); setNewCatName(""); }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <MessageSquare size={18} />
            <input type="text" placeholder="Nota o descripción..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Button type="submit" className={styles.submitBtn} isLoading={isLoading}>
            {isEdit ? "Guardar cambios" : "Añadir Transacción"}
          </Button>
        </form>
      </div>
    </div>
  );
};
