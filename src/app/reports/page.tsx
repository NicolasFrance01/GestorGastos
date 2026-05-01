"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useSpace } from "@/context/SpaceContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download, FileSpreadsheet, File as FilePdf } from "lucide-react";
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

  useEffect(() => {
    if (activeSpace) {
      fetchTransactions();
    }
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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
      Fecha: new Date(t.date).toLocaleDateString(),
      Tipo: t.type,
      Monto: t.amount,
      Categoría: t.category.name,
      Cuenta: t.wallet?.name || "N/A",
      Descripción: t.description || "",
      Etiquetas: t.tags || ""
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, `Reporte_${activeSpace?.name}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Reporte de Gastos - ${activeSpace?.name}`, 14, 15);
    (doc as any).autoTable({
      head: [['Fecha', 'Tipo', 'Categoría', 'Monto', 'Cuenta']],
      body: transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.category.name,
        `$${t.amount}`,
        t.wallet?.name || "N/A"
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
            <div className={styles.count}>{transactions.length} movimientos</div>
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
                {transactions.slice(0, 10).map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td>{t.category.name}</td>
                    <td>${t.amount.toLocaleString()}</td>
                    <td className={t.type === "INCOME" ? styles.income : styles.expense}>
                      {t.type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length > 10 && (
              <div className={styles.moreInfo}>Y {transactions.length - 10} movimientos más...</div>
            )}
          </Card>
        </section>
      </div>
    </Shell>
  );
}
