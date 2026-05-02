"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/icons";
import { X } from "lucide-react";
import styles from "./CategoryForm.module.css";
import { clsx } from "clsx";

interface Category {
  id?: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  icon: string;
  color: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  spaceId: string;
  initial?: Category;
}

export const CategoryForm = ({ isOpen, onClose, onSave, spaceId, initial }: Props) => {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<"EXPENSE" | "INCOME">(initial?.type || "EXPENSE");
  const [icon, setIcon] = useState(initial?.icon || CATEGORY_ICONS[0]);
  const [color, setColor] = useState(initial?.color || CATEGORY_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setIcon(initial.icon);
      setColor(initial.color);
    } else {
      setName("");
      setType("EXPENSE");
      setIcon(CATEGORY_ICONS[0]);
      setColor(CATEGORY_COLORS[0]);
    }
    setError("");
  }, [initial, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setIsLoading(true);
    try {
      const url = initial?.id ? `/api/categories/${initial.id}` : "/api/categories";
      const method = initial?.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, icon, color, spaceId }),
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
          <h2>{initial?.id ? "Editar categoría" : "Nueva categoría"}</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={22} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name */}
          <div className={styles.field}>
            <div className={styles.nameRow}>
              <div className={styles.iconPreview} style={{ backgroundColor: color }}>
                <CategoryIcon name={icon} size={22} color="#fff" />
              </div>
              <input
                type="text"
                placeholder="Nombre de categoría"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.nameInput}
                autoFocus
              />
            </div>
          </div>

          {/* Type */}
          <div className={styles.typeRow}>
            <label className={clsx(styles.typeOption, type === "EXPENSE" && styles.activeExpense)}>
              <input type="radio" value="EXPENSE" checked={type === "EXPENSE"} onChange={() => setType("EXPENSE")} />
              Gastos
            </label>
            <label className={clsx(styles.typeOption, type === "INCOME" && styles.activeIncome)}>
              <input type="radio" value="INCOME" checked={type === "INCOME"} onChange={() => setType("INCOME")} />
              Ingresos
            </label>
          </div>

          {/* Icon Grid */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Símbolo</p>
            <div className={styles.iconGrid}>
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={clsx(styles.iconBtn, icon === ic && styles.selectedIcon)}
                  style={icon === ic ? { backgroundColor: color } : {}}
                  onClick={() => setIcon(ic)}
                >
                  <CategoryIcon name={ic} size={20} color={icon === ic ? "#fff" : undefined} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Color</p>
            <div className={styles.colorRow}>
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={clsx(styles.colorBtn, color === c && styles.selectedColor)}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <label className={styles.customColorBtn} title="Color personalizado">
                +
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className={styles.colorInput}
                />
              </label>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" className={styles.submitBtn} isLoading={isLoading}>
            {initial?.id ? "Guardar cambios" : "Añadir"}
          </Button>
        </form>
      </div>
    </div>
  );
};
