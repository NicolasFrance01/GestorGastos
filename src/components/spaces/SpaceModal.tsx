"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { X, UserPlus, Trash2, Crown, User, Link, Copy, Check } from "lucide-react";
import styles from "./SpaceModal.module.css";
import { clsx } from "clsx";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string | null };
}

type Tab = "create" | "members";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSpaceCreated: () => void;
  activeSpaceId?: string;
  currentUserId?: string;
}

export const SpaceModal = ({ isOpen, onClose, onSpaceCreated, activeSpaceId, currentUserId }: Props) => {
  const [tab, setTab] = useState<Tab>("create");
  const [spaceName, setSpaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen && tab === "members" && activeSpaceId) {
      fetchMembers();
    }
    setError("");
    setSuccess("");
  }, [isOpen, tab, activeSpaceId]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/spaces/${activeSpaceId}/members`);
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setError("Error al cargar miembros");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) { setError("El nombre es obligatorio"); return; }
    setIsCreating(true);
    setError("");
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: spaceName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Error al crear");
        return;
      }
      setSpaceName("");
      setSuccess("Espacio creado correctamente");
      onSpaceCreated();
      setTimeout(() => { setSuccess(""); onClose(); }, 1500);
    } catch {
      setError("Error de conexión");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) { setError("El correo es obligatorio"); return; }
    setIsInviting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/spaces/${activeSpaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message || "Error al invitar"); return; }
      setSuccess("Miembro añadido correctamente");
      setInviteEmail("");
      fetchMembers();
    } catch {
      setError("Error de conexión");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!activeSpaceId) return;
    setIsCopying(true);
    try {
      const res = await fetch(`/api/spaces/${activeSpaceId}/invite-link`);
      const data = await res.json();
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("No se pudo generar el enlace");
    } finally {
      setIsCopying(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await fetch(`/api/spaces/${activeSpaceId}/members/${userId}`, { method: "DELETE" });
      fetchMembers();
    } catch {
      setError("Error al eliminar miembro");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>Espacios</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={22} /></button>
        </header>

        <div className={styles.tabs}>
          <button
            className={clsx(styles.tab, tab === "create" && styles.activeTab)}
            onClick={() => setTab("create")}
          >
            Nuevo espacio
          </button>
          <button
            className={clsx(styles.tab, tab === "members" && styles.activeTab)}
            onClick={() => setTab("members")}
          >
            Miembros
          </button>
        </div>

        <div className={styles.body}>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          {tab === "create" && (
            <form onSubmit={handleCreate} className={styles.form}>
              <p className={styles.hint}>Crea un espacio compartido para gestionar gastos con otros usuarios.</p>
              <div className={styles.field}>
                <label>Nombre del espacio</label>
                <input
                  type="text"
                  placeholder="Ej: Familia, Trabajo, Viaje..."
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className={styles.input}
                  autoFocus
                />
              </div>
              <Button type="submit" className={styles.submitBtn} isLoading={isCreating}>
                Crear espacio
              </Button>
            </form>
          )}

          {tab === "members" && (
            <div className={styles.membersSection}>
              <div className={styles.linkSection}>
                <div className={styles.linkInfo}>
                  <Link size={16} />
                  <span>Invitar por enlace</span>
                </div>
                <button
                  className={clsx(styles.copyBtn, copied && styles.copiedBtn)}
                  onClick={handleCopyLink}
                  disabled={isCopying}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "¡Copiado!" : isCopying ? "..." : "Copiar enlace"}
                </button>
              </div>

              <div className={styles.dividerRow}><span>o invitar por correo</span></div>

              <form onSubmit={handleInvite} className={styles.inviteRow}>
                <input
                  type="email"
                  placeholder="Correo del usuario"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={styles.input}
                />
                <Button type="submit" size="sm" isLoading={isInviting}>
                  <UserPlus size={16} /> Invitar
                </Button>
              </form>

              <div className={styles.memberList}>
                {members.map((m) => (
                  <div key={m.id} className={styles.memberItem}>
                    <div className={styles.memberAvatar}>
                      {m.user.name?.[0]?.toUpperCase() || m.user.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className={styles.memberInfo}>
                      <p>{m.user.name || "Sin nombre"}</p>
                      <span>{m.user.email}</span>
                    </div>
                    <div className={styles.memberRole}>
                      {m.role === "OWNER"
                        ? <Crown size={16} color="#f59e0b" />
                        : <User size={16} color="var(--color-text-muted)" />
                      }
                      <span>{m.role === "OWNER" ? "Dueño" : "Miembro"}</span>
                    </div>
                    {m.role !== "OWNER" && m.user.id !== currentUserId && (
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveMember(m.user.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <p className={styles.empty}>No hay miembros en este espacio</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
