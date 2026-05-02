import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

function makeToken(spaceId: string) {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET || "fallback")
    .update(spaceId)
    .digest("hex")
    .slice(0, 24);
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id: spaceId } = await context.params;
  const { token } = await req.json();

  if (token !== makeToken(spaceId)) {
    return NextResponse.json({ message: "Enlace de invitación inválido" }, { status: 403 });
  }

  const space = await prisma.space.findUnique({ where: { id: spaceId }, select: { id: true, name: true } });
  if (!space) return NextResponse.json({ message: "Espacio no encontrado" }, { status: 404 });

  const existing = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ message: "Ya eres miembro de este espacio", spaceName: space.name });

  await prisma.spaceMember.create({
    data: { spaceId, userId: session.user.id, role: "MEMBER" },
  });

  return NextResponse.json({ message: "Te uniste correctamente", spaceName: space.name });
}
