"use client";

import { useState, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/Shell";
import { useSpace } from "@/context/SpaceContext";
import { SummaryChart } from "@/components/dashboard/SummaryChart";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TransactionForm } from "@/components/dashboard/TransactionForm";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Plus, TrendingUp, TrendingDown, Trash2, Pencil } from "lucide-react";
import styles from "./Dashboard.module.css";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

type Period = "day" | "week" | "month" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
  year: "Año",
};

interface ChartDataItem { name: string; value: number; color: string; }
interface TransactionItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  currency: string;
  category: { name: string; color: string; icon: string };
  wallet?: { name: string };
}

export default function DashboardPage() {
  const { activeSpace } = useSpace();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("month");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [editingTx, setEditingTx] = useState<TransactionItem | undefined>();
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!activeSpace) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard?spaceId=${activeSpace.id}&period=${period}`);
      const data = await res.json();
      setStats(data.stats || { income: 0, expenses: 0, balance: 0 });
      setChartData(data.chartData || []);
      setRecentTransactions(data.recentTransactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeSpace, period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const openForm = (type: "EXPENSE" | "INCOME") => {
    setEditingTx(undefined);
    setFormType(type);
    setIsFormOpen(true);
  };

  const openEdit = (tx: TransactionItem) => {
    setEditingTx(tx);
    setFormType(tx.type as "EXPENSE" | "INCOME");
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta transacción?")) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Shell>
      <div className={styles.container}>
        {/* Balance */}
        <section className={styles.balanceSection}>
          <div className={styles.balanceInfo}>
            <h1>Balance</h1>
            <p className={styles.mainBalance}>${fmt(stats.balance)}</p>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={clsx(styles.statIcon, styles.income)}><TrendingUp size={20} /></div>
              <div className={styles.statInfo}>
                <span>Ingresos</span>
                <p>${fmt(stats.income)}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={clsx(styles.statIcon, styles.expense)}><TrendingDown size={20} /></div>
              <div className={styles.statInfo}>
                <span>Gastos</span>
                <p>${fmt(stats.expenses)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Period tabs + chart */}
        <section className={styles.chartSection}>
          <Card className={styles.chartCard} glass>
            <div className={styles.periodTabs}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  className={clsx(styles.periodTab, period === p && styles.activeTab)}
                  onClick={() => setPeriod(p)}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            {isLoading ? (
              <div className={styles.chartLoading}>Cargando...</div>
            ) : chartData.length > 0 ? (
              <SummaryChart data={chartData} total={stats.expenses} />
            ) : (
              <div className={styles.chartEmpty}>Sin gastos en este período</div>
            )}
          </Card>
        </section>

        {/* Quick actions */}
        <section className={styles.actions}>
          <Button
            className={clsx(styles.actionBtn, styles.incomeBtn)}
            onClick={() => openForm("INCOME")}
          >
            <Plus size={22} /> Ingreso
          </Button>
          <Button
            className={clsx(styles.actionBtn, styles.expenseBtn)}
            onClick={() => openForm("EXPENSE")}
          >
            <Plus size={22} /> Gasto
          </Button>
        </section>

        {/* Recent transactions */}
        <section className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2>Recientes</h2>
            <button className={styles.viewAll} onClick={() => router.push("/reports")}>Ver todo</button>
          </div>
          <div className={styles.transactionList}>
            {recentTransactions.length === 0 && (
              <p className={styles.emptyTx}>Sin transacciones en este período</p>
            )}
            {recentTransactions.map((tx) => (
              <div key={tx.id} className={styles.transactionItem}>
                <div className={styles.txIcon} style={{ backgroundColor: tx.category.color }}>
                  <CategoryIcon name={tx.category.icon} size={18} color="#fff" />
                </div>
                <div className={styles.txMain}>
                  <p className={styles.txTitle}>{tx.description || tx.category.name}</p>
                  <span className={styles.txDate}>
                    {new Date(tx.date).toLocaleDateString("es-AR")}
                    {tx.wallet ? ` · ${tx.wallet.name}` : ""}
                  </span>
                </div>
                <div className={styles.txRight}>
                  <p className={tx.type === "INCOME" ? styles.positive : styles.negative}>
                    {tx.type === "INCOME" ? "+" : "-"}${fmt(tx.amount)}
                  </p>
                  <div className={styles.txActions}>
                    <button className={styles.txBtn} onClick={() => openEdit(tx)}><Pencil size={14} /></button>
                    <button className={clsx(styles.txBtn, styles.txDelete)} onClick={() => handleDelete(tx.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); fetchDashboardData(); }}
        type={formType}
        spaceId={activeSpace?.id}
        initial={editingTx}
      />
    </Shell>
  );
}
