"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import styles from "./ReminderForm.module.css";
import { clsx } from "clsx";
import { format } from "date-fns";

const FREQUENCIES = [
  { value: "DAILY", label: "Diario" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "YEARLY", label: "Anual" },
];

interface Reminder {
  id?: string;
  title: string;
  amount: number;
  frequency: string;
  nextDate: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initial?: Reminder;
}

export const ReminderForm = ({ isOpen, onClose, onSave, initial }: Props) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [amount, setAmount] = useState(String(initial?.amount || ""));
  const [frequency, setFrequency] = useState(initial?.frequency || "MONTHLY");
  const [nextDate, setNextDate] = useState(
    initial?.nextDate ? format(new Date(initial.nextDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setAmount(String(initial.amount));
      setFrequency(initial.frequency);
      setNextDate(format(new Date(initial.nextDate), "yyyy-MM-dd"));
    } else {
      setTitle("");
      setAmount("");
      setFrequency("MONTHLY");
      setNextDate(format(new Date(), "yyyy-MM-dd"));
    }
    setError("");
  }, [initial, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("El título es obligatorio"); return; }
    if (!amount || isNaN(parseFloat(amount))) { setError("El monto es obligatorio"); return; }
    setIsLoading(true);
    try {
      const url = initial?.id ? `/api/reminders/${initial.id}` : "/api/reminders";
      const method = initial?.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), amount: parseFloat(amount), frequency, nextDate }),
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
          <h2>{initial?.id ? "Editar recordatorio" : "Nuevo recordatorio"}</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={22} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Título</label>
            <input
              type="text"
              placeholder="Ej: Suscripción Netflix"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label>Monto ($)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.input}
              step="0.01"
              min="0"
            />
          </div>

          <div className={styles.field}>
            <label>Frecuencia</label>
            <div className={styles.optionGrid}>
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={clsx(styles.optionBtn, frequency === f.value && styles.selectedOption)}
                  onClick={() => setFrequency(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Próxima fecha</label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className={styles.input}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" className={styles.submitBtn} isLoading={isLoading}>
            {initial?.id ? "Guardar cambios" : "Crear recordatorio"}
          </Button>
        </form>
      </div>
    </div>
  );
};
