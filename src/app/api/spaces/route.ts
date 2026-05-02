import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const spaces = await prisma.space.findMany({
      where: { members: { some: { userId: session.user.id } } },
      select: { id: true, name: true, isPersonal: true },
    });
    return NextResponse.json(spaces);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ message: "Name required" }, { status: 400 });

    const defaultCategories = [
      { name: "Comida", type: "EXPENSE" as const, icon: "Utensils", color: "#ef4444" },
      { name: "Transporte", type: "EXPENSE" as const, icon: "Car", color: "#3b82f6" },
      { name: "Salario", type: "INCOME" as const, icon: "Wallet", color: "#10b981" },
      { name: "Vivienda", type: "EXPENSE" as const, icon: "Home", color: "#f59e0b" },
      { name: "Ocio", type: "EXPENSE" as const, icon: "Music", color: "#8b5cf6" },
    ];

    const space = await (prisma as any).$transaction(async (tx: any) => {
      const newSpace = await tx.space.create({
        data: { name, ownerId: session.user!.id, isPersonal: false },
      });
      await tx.spaceMember.create({
        data: { spaceId: newSpace.id, userId: session.user!.id, role: "OWNER" },
      });
      await tx.wallet.create({
        data: { name: "Efectivo", type: "CASH", category: "PERSONAL", balance: 0, spaceId: newSpace.id },
      });
      for (const cat of defaultCategories) {
        await tx.category.create({ data: { ...cat, spaceId: newSpace.id } });
      }
      return newSpace;
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
