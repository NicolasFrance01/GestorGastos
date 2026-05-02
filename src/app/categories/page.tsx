"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useSpace } from "@/context/SpaceContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Plus, Pencil, Trash2 } from "lucide-react";
import styles from "./Categories.module.css";
import { clsx } from "clsx";

interface Category {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  icon: string;
  color: string;
}

export default function CategoriesPage() {
  const { activeSpace } = useSpace();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeSpace) fetchCategories();
  }, [activeSpace]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/categories?spaceId=${activeSpace?.id}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditing(undefined);
    setIsFormOpen(true);
  };

  const filtered = categories.filter((c) => filter === "ALL" || c.type === filter);

  return (
    <Shell>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Categorías</h1>
            <p>Organiza tus movimientos</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus size={18} /> Nueva
          </Button>
        </header>

        <div className={styles.filters}>
          {(["ALL", "EXPENSE", "INCOME"] as const).map((f) => (
            <button
              key={f}
              className={clsx(styles.filterBtn, filter === f && styles.activeFilter)}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? "Todas" : f === "EXPENSE" ? "Gastos" : "Ingresos"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((cat) => (
              <Card key={cat.id} className={styles.catCard}>
                <div className={styles.catIcon} style={{ backgroundColor: cat.color }}>
                  <CategoryIcon name={cat.icon} size={22} color="#fff" />
                </div>
                <div className={styles.catInfo}>
                  <h3>{cat.name}</h3>
                  <span className={clsx(
                    styles.catType,
                    cat.type === "EXPENSE" ? styles.expense : styles.income
                  )}>
                    {cat.type === "EXPENSE" ? "Gasto" : "Ingreso"}
                  </span>
                </div>
                <div className={styles.catActions}>
                  <button className={styles.actionBtn} onClick={() => openEdit(cat)}>
                    <Pencil size={16} />
                  </button>
                  <button className={clsx(styles.actionBtn, styles.deleteBtn)} onClick={() => handleDelete(cat.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}

            <button className={styles.addCard} onClick={openCreate}>
              <Plus size={28} />
              <span>Nueva categoría</span>
            </button>
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className={styles.empty}>
            <p>No hay categorías de {filter === "EXPENSE" ? "gastos" : "ingresos"}</p>
            <Button variant="outline" onClick={openCreate}>Crear la primera</Button>
          </div>
        )}
      </div>

      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={fetchCategories}
        spaceId={activeSpace?.id || ""}
        initial={editing}
      />
    </Shell>
  );
}
