import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { action, name, email, currentPassword, newPassword } = await req.json();

  if (action === "updateProfile") {
    if (!name?.trim()) return NextResponse.json({ message: "El nombre es obligatorio" }, { status: 400 });

    if (email && email !== session.user.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return NextResponse.json({ message: "Ese correo ya está en uso" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim(), ...(email ? { email } : {}) },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "changePassword") {
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Todos los campos son obligatorios" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ message: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password || user.password !== currentPassword) {
      return NextResponse.json({ message: "La contraseña actual es incorrecta" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: session.user.id }, data: { password: newPassword } });
    return NextResponse.json({ message: "Contraseña actualizada correctamente" });
  }

  return NextResponse.json({ message: "Acción no reconocida" }, { status: 400 });
}
