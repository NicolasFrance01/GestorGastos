"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useSpace } from "@/context/SpaceContext";
import { SummaryChart } from "@/components/dashboard/SummaryChart";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TransactionForm } from "@/components/dashboard/TransactionForm";
import { Plus, TrendingUp, TrendingDown, FileText, Download } from "lucide-react";
import styles from "./Dashboard.module.css";
import { clsx } from "clsx";

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  category: { name: string; color: string };
  wallet?: { name: string };
}

export default function DashboardPage() {
  const { activeSpace } = useSpace();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    if (activeSpace) {
      fetchDashboardData();
    }
  }, [activeSpace]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`/api/dashboard?spaceId=${activeSpace?.id}`);
      const data = await res.json();
      setStats(data.stats || { income: 0, expenses: 0, balance: 0 });
      setChartData(data.chartData || []);
      setRecentTransactions(data.recentTransactions || []);
    } catch (error) {
      console.error(error);
    }
  };

  const openForm = (type: "EXPENSE" | "INCOME") => {
    setFormType(type);
    setIsFormOpen(true);
  };

  return (
    <Shell>
      <div className={styles.container}>
        <section className={styles.balanceSection}>
          <div className={styles.balanceInfo}>
            <h1>Balance Total</h1>
            <p className={styles.mainBalance}>${stats.balance.toLocaleString()}</p>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={clsx(styles.statIcon, styles.income)}>
                <TrendingUp size={20} />
              </div>
              <div className={styles.statInfo}>
                <span>Ingresos</span>
                <p>${stats.income.toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={clsx(styles.statIcon, styles.expense)}>
                <TrendingDown size={20} />
              </div>
              <div className={styles.statInfo}>
                <span>Gastos</span>
                <p>${stats.expenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.chartSection}>
          <Card className={styles.chartCard} glass>
            <div className={styles.cardHeader}>
              <h2>Resumen por Categoría</h2>
              <div className={styles.periodTabs}>
                <button className={styles.activeTab}>Mes</button>
                <button>Semana</button>
                <button>Año</button>
              </div>
            </div>
            <SummaryChart data={chartData} total={stats.expenses} />
          </Card>
        </section>

        <section className={styles.actions}>
          <Button 
            className={clsx(styles.actionBtn, styles.incomeBtn)} 
            onClick={() => openForm("INCOME")}
          >
            <Plus size={24} /> Ingreso
          </Button>
          <Button 
            className={clsx(styles.actionBtn, styles.expenseBtn)} 
            onClick={() => openForm("EXPENSE")}
          >
            <Plus size={24} /> Gasto
          </Button>
        </section>

        <section className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2>Transacciones Recientes</h2>
            <button className={styles.viewAll}>Ver todo</button>
          </div>
          <div className={styles.transactionList}>
            {recentTransactions.map((tx) => (
              <div key={tx.id} className={styles.transactionItem}>
                <div className={styles.txIcon} style={{ backgroundColor: tx.category.color }}>
                  {tx.category.name[0]}
                </div>
                <div className={styles.txMain}>
                  <p className={styles.txTitle}>{tx.description || tx.category.name}</p>
                  <span className={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</span>
                </div>
                <div className={styles.txAmount}>
                  <p className={tx.type === "INCOME" ? styles.positive : styles.negative}>
                    {tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString()}
                  </p>
                  <span className={styles.txWallet}>{tx.wallet?.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.exportSection}>
           <Card className={styles.exportCard}>
              <div className={styles.exportInfo}>
                <FileText size={24} />
                <div>
                  <h3>Exportar Informe</h3>
                  <p>Obtén un resumen en PDF, Excel o CSV</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download size={18} /> Exportar
              </Button>
           </Card>
        </section>
      </div>

      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          fetchDashboardData();
        }}
        type={formType}
        spaceId={activeSpace?.id}
      />
    </Shell>
  );
}
