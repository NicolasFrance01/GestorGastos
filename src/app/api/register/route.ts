import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: String(email) },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: String(name),
          email: String(email),
          password: String(password),
        },
      });

      const personalSpace = await tx.space.create({
        data: {
          name: "Personal",
          isPersonal: true,
          ownerId: newUser.id,
        },
      });

      await tx.wallet.create({
        data: {
          name: "Efectivo",
          type: "CASH",
          category: "PERSONAL",
          balance: 0,
          spaceId: personalSpace.id,
        },
      });

      await tx.spaceMember.create({
        data: {
          spaceId: personalSpace.id,
          userId: newUser.id,
          role: "OWNER",
        },
      });

      const defaultCategories = [
        { name: "Comida", type: TransactionType.EXPENSE, icon: "Utensils", color: "#ef4444" },
        { name: "Transporte", type: TransactionType.EXPENSE, icon: "Car", color: "#3b82f6" },
        { name: "Salario", type: TransactionType.INCOME, icon: "Wallet", color: "#10b981" },
        { name: "Vivienda", type: TransactionType.EXPENSE, icon: "Home", color: "#f59e0b" },
      ];

      for (const cat of defaultCategories) {
        await tx.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            spaceId: personalSpace.id,
          },
        });
      }

      return newUser;
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
