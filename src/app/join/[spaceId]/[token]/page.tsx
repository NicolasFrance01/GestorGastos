"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useSpace } from "@/context/SpaceContext";

type State = "loading" | "joining" | "success" | "error" | "unauthenticated";

export default function JoinPage() {
  const { status } = useSession();
  const { refreshSpaces } = useSpace();
  const params = useParams<{ spaceId: string; token: string }>();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [spaceName, setSpaceName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { setState("unauthenticated"); return; }
    joinSpace();
  }, [status]);

  const joinSpace = async () => {
    setState("joining");
    try {
      const res = await fetch(`/api/spaces/${params.spaceId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token }),
      });
      const data = await res.json();
      setSpaceName(data.spaceName || "");
      if (res.ok || res.status === 200) {
        setMessage(data.message);
        setState("success");
        await refreshSpaces();
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setMessage(data.message || "Error al unirse");
        setState("error");
      }
    } catch {
      setMessage("Error de conexión");
      setState("error");
    }
  };

  const callbackUrl = `/join/${params.spaceId}/${params.token}`;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>💰</div>
        <h1 style={styles.title}>GestorGastos</h1>

        {state === "loading" || state === "joining" ? (
          <>
            <p style={styles.subtitle}>Procesando invitación...</p>
            <div style={styles.spinner} />
          </>
        ) : state === "unauthenticated" ? (
          <>
            <p style={styles.subtitle}>Te han invitado a unirte a un espacio compartido.</p>
            <p style={styles.hint}>Inicia sesión o crea una cuenta para aceptar la invitación.</p>
            <button style={styles.btnPrimary} onClick={() => signIn(undefined, { callbackUrl })}>
              Iniciar sesión
            </button>
            <button style={styles.btnSecondary} onClick={() => router.push(`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`)}>
              Crear cuenta
            </button>
          </>
        ) : state === "success" ? (
          <>
            <div style={styles.icon}>✅</div>
            <p style={styles.subtitle}>{message}</p>
            {spaceName && <p style={styles.hint}>Espacio: <strong>{spaceName}</strong></p>}
            <p style={styles.hint}>Redirigiendo al dashboard...</p>
          </>
        ) : (
          <>
            <div style={styles.icon}>❌</div>
            <p style={styles.subtitle}>{message}</p>
            <button style={styles.btnPrimary} onClick={() => router.push("/dashboard")}>
              Ir al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    padding: "1.5rem",
  },
  card: {
    background: "#fff",
    borderRadius: "1.5rem",
    padding: "2.5rem 2rem",
    maxWidth: "380px",
    width: "100%",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    textAlign: "center",
  },
  logo: { fontSize: "2.5rem" },
  title: { fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" },
  subtitle: { fontSize: "1rem", color: "#0f172a", fontWeight: 600 },
  hint: { fontSize: "0.875rem", color: "#64748b" },
  icon: { fontSize: "2rem" },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #10b981",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  btnPrimary: {
    width: "100%",
    padding: "0.85rem",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSecondary: {
    width: "100%",
    padding: "0.85rem",
    background: "transparent",
    color: "#10b981",
    border: "2px solid #10b981",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
