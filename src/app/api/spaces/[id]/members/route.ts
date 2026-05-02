import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id: spaceId } = await context.params;
  try {
    const members = await prisma.spaceMember.findMany({
      where: { spaceId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id: spaceId } = await context.params;
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });

    // Verify requester is OWNER of the space
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id, role: "OWNER" },
    });
    if (!membership) return NextResponse.json({ message: "Only owners can invite members" }, { status: 403 });

    // Find user by email
    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      return NextResponse.json({ message: "No se encontró un usuario con ese correo" }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: invitedUser.id },
    });
    if (existing) {
      return NextResponse.json({ message: "El usuario ya es miembro de este espacio" }, { status: 409 });
    }

    const member = await prisma.spaceMember.create({
      data: { spaceId, userId: invitedUser.id, role: "MEMBER" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
