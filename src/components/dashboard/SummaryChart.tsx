"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./SummaryChart.module.css";

interface SummaryChartProps {
  data: { name: string; value: number; color: string }[];
  total: number;
}

export const SummaryChart = ({ data, total }: SummaryChartProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.centerText}>
          <span className={styles.totalValue}>${total.toLocaleString()}</span>
          <span className={styles.totalLabel}>Total</span>
        </div>
      </div>
    </div>
  );
};
