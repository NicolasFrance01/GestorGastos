"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { Bell, Plus, Calendar, Clock, Pencil, Trash2 } from "lucide-react";
import styles from "./Alerts.module.css";
import { clsx } from "clsx";

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

interface Reminder {
  id: string;
  title: string;
  amount: number;
  frequency: string;
  nextDate: string;
}

export default function AlertsPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | undefined>();

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este recordatorio?")) return;
    try {
      await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (reminder: Reminder) => {
    setEditing(reminder);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditing(undefined);
    setIsFormOpen(true);
  };

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Shell>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Recordatorios</h1>
            <p>Gestiona tus gastos fijos y facturas</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus size={18} /> Nuevo
          </Button>
        </header>

        {isLoading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : (
          <div className={styles.list}>
            {reminders.map((reminder) => (
              <Card key={reminder.id} className={styles.alertCard}>
                <div className={styles.iconBox}>
                  <Bell size={22} />
                </div>
                <div className={styles.info}>
                  <h3>{reminder.title}</h3>
                  <div className={styles.meta}>
                    <span><Calendar size={13} /> {new Date(reminder.nextDate).toLocaleDateString("es-AR")}</span>
                    <span><Clock size={13} /> {FREQUENCY_LABELS[reminder.frequency] || reminder.frequency}</span>
                  </div>
                </div>
                <div className={styles.right}>
                  <p className={styles.amount}>${fmt(reminder.amount)}</p>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => openEdit(reminder)}>
                      <Pencil size={14} />
                    </button>
                    <button className={clsx(styles.actionBtn, styles.deleteBtn)} onClick={() => handleDelete(reminder.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {reminders.length === 0 && (
              <div className={styles.empty}>
                <Bell size={48} />
                <p>No tienes recordatorios configurados</p>
                <Button variant="outline" onClick={openCreate}>Crear el primero</Button>
              </div>
            )}

            <button className={styles.addCard} onClick={openCreate}>
              <Plus size={24} />
              <span>Nuevo recordatorio</span>
            </button>
          </div>
        )}
      </div>

      <ReminderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={fetchReminders}
        initial={editing}
      />
    </Shell>
  );
}
