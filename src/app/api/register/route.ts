import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // Create user and their default space in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password, // In production, hash this!
        },
      });

      const personalSpace = await tx.space.create({
        data: {
          name: "Personal",
          isPersonal: true,
          ownerId: newUser.id,
        },
      });

      // Create default wallet
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

      // Add default categories
      const defaultCategories = [
        { name: "Comida", type: TransactionType.EXPENSE, icon: "Utensils", color: "#ef4444" },
        { name: "Transporte", type: TransactionType.EXPENSE, icon: "Car", color: "#3b82f6" },
        { name: "Salario", type: TransactionType.INCOME, icon: "Wallet", color: "#10b981" },
        { name: "Vivienda", type: TransactionType.EXPENSE, icon: "Home", color: "#f59e0b" },
      ];

      for (const cat of defaultCategories) {
        await tx.category.create({
          data: {
            ...cat,
            spaceId: personalSpace.id,
          } as any, // Using any here to bypass complex type check for demo
        });
      }

      return newUser;
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
