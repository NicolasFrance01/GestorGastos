"use client";

import { useState, useEffect, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { useSpace } from "@/context/SpaceContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileSpreadsheet, File as FilePdf } from "lucide-react";
import styles from "./Reports.module.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  tags: string;
  category: { name: string; color: string };
  wallet?: { name: string };
}

export default function ReportsPage() {
  const { activeSpace } = useSpace();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (activeSpace) fetchTransactions();
  }, [activeSpace]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/transactions/all?spaceId=${activeSpace?.id}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      if (dateFrom && new Date(t.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(t.date) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [transactions, typeFilter, dateFrom, dateTo]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(t => ({
      Fecha: new Date(t.date).toLocaleDateString(),
      Tipo: t.type === "INCOME" ? "Ingreso" : "Gasto",
      Monto: t.amount,
      Categoría: t.category.name,
      Cuenta: t.wallet?.name || "N/A",
      Descripción: t.description || "",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, `Reporte_${activeSpace?.name}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Reporte de Gastos - ${activeSpace?.name}`, 14, 15);
    (doc as any).autoTable({
      head: [["Fecha", "Tipo", "Categoría", "Monto", "Cuenta"]],
      body: filtered.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type === "INCOME" ? "Ingreso" : "Gasto",
        t.category.name,
        `$${t.amount.toLocaleString()}`,
        t.wallet?.name || "N/A",
      ]),
      startY: 20,
    });
    doc.save(`Reporte_${activeSpace?.name}.pdf`);
  };

  return (
    <Shell>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Informes</h1>
          <p>Exporta y analiza tus movimientos detalladamente</p>
        </header>

        <section className={styles.exportOptions}>
          <Card className={styles.exportCard} onClick={exportToExcel}>
            <div className={styles.iconBox} style={{ backgroundColor: "#dcfce7", color: "#10b981" }}>
              <FileSpreadsheet size={32} />
            </div>
            <h3>Excel / CSV</h3>
            <p>Ideal para análisis profundo en hojas de cálculo</p>
            <Button variant="outline" size="sm">Descargar</Button>
          </Card>

          <Card className={styles.exportCard} onClick={exportToPDF}>
            <div className={styles.iconBox} style={{ backgroundColor: "#fee2e2", color: "#ef4444" }}>
              <FilePdf size={32} />
            </div>
            <h3>PDF</h3>
            <p>Documento formal listo para imprimir o compartir</p>
            <Button variant="outline" size="sm">Descargar</Button>
          </Card>
        </section>

        <section className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h2>Vista Previa</h2>
            <div className={styles.count}>{filtered.length} movimientos</div>
          </div>

          <div className={styles.filters}>
            <div className={styles.typeToggle}>
              {(["ALL", "INCOME", "EXPENSE"] as const).map(t => (
                <button
                  key={t}
                  className={`${styles.toggleBtn} ${typeFilter === t ? styles.toggleActive : ""}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "ALL" ? "Todos" : t === "INCOME" ? "Ingresos" : "Gastos"}
                </button>
              ))}
            </div>
            <div className={styles.dateRange}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={styles.dateInput} placeholder="Desde" />
              <span className={styles.dateSep}>—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={styles.dateInput} placeholder="Hasta" />
              {(dateFrom || dateTo) && (
                <button className={styles.clearBtn} onClick={() => { setDateFrom(""); setDateTo(""); }}>✕</button>
              )}
            </div>
          </div>

          <Card className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString("es-AR")}</td>
                    <td>{t.category.name}</td>
                    <td>${t.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                    <td className={t.type === "INCOME" ? styles.income : styles.expense}>
                      {t.type === "INCOME" ? "Ingreso" : "Gasto"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>Sin movimientos</td></tr>
                )}
              </tbody>
            </table>
            {filtered.length > 50 && (
              <div className={styles.moreInfo}>Y {filtered.length - 50} movimientos más...</div>
            )}
          </Card>
        </section>
      </div>
    </Shell>
  );
}
