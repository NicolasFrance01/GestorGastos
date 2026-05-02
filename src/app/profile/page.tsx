"use client";

import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSession, signOut } from "next-auth/react";
import { User, Mail, Lock, LogOut, Check, AlertCircle } from "lucide-react";
import styles from "./Profile.module.css";

interface UserProfile { id: string; name: string; email: string; createdAt: string; }

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      setProfile(data);
      setName(data.name || "");
      setEmail(data.email || "");
    });
  }, []);

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProfile", name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, name: data.name, email: data.email } : null);
        setProfileMsg({ ok: true, text: "Perfil actualizado correctamente" });
      } else {
        setProfileMsg({ ok: false, text: data.message });
      }
    } catch { setProfileMsg({ ok: false, text: "Error de conexión" }); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: "Las contraseñas no coinciden" }); return; }
    setSavingPw(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePassword", currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setPwMsg({ ok: true, text: data.message });
      } else { setPwMsg({ ok: false, text: data.message }); }
    } catch { setPwMsg({ ok: false, text: "Error de conexión" }); }
    finally { setSavingPw(false); }
  };

  const initials = (name || session?.user?.name || "?").slice(0, 2).toUpperCase();

  return (
    <Shell>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Mi Perfil</h1>
          <p>Gestiona tu cuenta y preferencias</p>
        </header>

        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <p className={styles.avatarName}>{profile?.name || "..."}</p>
            <p className={styles.avatarEmail}>{profile?.email || "..."}</p>
          </div>
        </div>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}><User size={18} /> Datos personales</h2>
          <form onSubmit={handleProfileSave} className={styles.form}>
            <div className={styles.field}>
              <label>Nombre</label>
              <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" required />
            </div>
            <div className={styles.field}>
              <label><Mail size={14} /> Correo electrónico</label>
              <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required />
            </div>
            {profileMsg && (
              <div className={profileMsg.ok ? styles.msgOk : styles.msgError}>
                {profileMsg.ok ? <Check size={15} /> : <AlertCircle size={15} />}
                {profileMsg.text}
              </div>
            )}
            <Button type="submit" isLoading={savingProfile} className={styles.saveBtn}>Guardar cambios</Button>
          </form>
        </Card>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}><Lock size={18} /> Cambiar contraseña</h2>
          <form onSubmit={handlePasswordSave} className={styles.form}>
            <div className={styles.field}>
              <label>Contraseña actual</label>
              <input className={styles.input} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className={styles.field}>
              <label>Nueva contraseña</label>
              <input className={styles.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div className={styles.field}>
              <label>Confirmar nueva contraseña</label>
              <input className={styles.input} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repetir contraseña" required />
            </div>
            {pwMsg && (
              <div className={pwMsg.ok ? styles.msgOk : styles.msgError}>
                {pwMsg.ok ? <Check size={15} /> : <AlertCircle size={15} />}
                {pwMsg.text}
              </div>
            )}
            <Button type="submit" isLoading={savingPw} className={styles.saveBtn}>Cambiar contraseña</Button>
          </form>
        </Card>

        <Card className={styles.dangerSection}>
          <h2 className={styles.sectionTitle}><LogOut size={18} /> Sesión</h2>
          <p className={styles.dangerHint}>Cerrar sesión en este dispositivo.</p>
          <Button variant="outline" className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut size={16} /> Cerrar sesión
          </Button>
        </Card>
      </div>
    </Shell>
  );
}
