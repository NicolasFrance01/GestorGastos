"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, Plus, Calendar, Clock, MoreVertical } from "lucide-react";
import styles from "./Alerts.module.css";

export default function AlertsPage() {
  const [reminders, setReminders] = useState([
    { id: 1, title: "Suscripción Netflix", amount: 15.99, nextDate: "2026-05-15", frequency: "Mensual" },
    { id: 2, title: "Alquiler", amount: 1200, nextDate: "2026-06-01", frequency: "Mensual" },
  ]);

  return (
    <Shell>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Recordatorios</h1>
            <p>Gestiona tus gastos fijos y facturas</p>
          </div>
          <Button size="sm">
            <Plus size={18} /> Nuevo
          </Button>
        </header>

        <div className={styles.list}>
          {reminders.map((reminder) => (
            <Card key={reminder.id} className={styles.alertCard}>
              <div className={styles.iconBox}>
                <Bell size={24} />
              </div>
              <div className={styles.info}>
                <h3>{reminder.title}</h3>
                <div className={styles.meta}>
                  <span><Calendar size={14} /> {reminder.nextDate}</span>
                  <span><Clock size={14} /> {reminder.frequency}</span>
                </div>
              </div>
              <div className={styles.amount}>
                <p>${reminder.amount}</p>
                <button className={styles.more}><MoreVertical size={20} /></button>
              </div>
            </Card>
          ))}

          {reminders.length === 0 && (
            <div className={styles.empty}>
              <Bell size={48} />
              <p>No tienes recordatorios configurados</p>
              <Button variant="outline">Crear el primero</Button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
