import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TransactionType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount, type, categoryId, walletId, description, tags, spaceId } = body;

    if (!amount || !type || !categoryId || !spaceId) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // Using any for transaction context to resolve persistent IDE type detection issues
    const transaction = await (prisma as any).$transaction(async (tx: any) => {
      const newTx = await tx.transaction.create({
        data: {
          amount: Number(amount),
          type: type as TransactionType,
          categoryId: String(categoryId),
          walletId: walletId ? String(walletId) : null,
          description: description ? String(description) : null,
          tags: tags ? String(tags) : null,
          spaceId: String(spaceId),
        },
      });

      if (walletId) {
        const multiplier = type === "INCOME" ? 1 : -1;
        await tx.wallet.update({
          where: { id: String(walletId) },
          data: {
            balance: {
              increment: Number(amount) * multiplier,
            },
          },
        });
      }

      return newTx;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("Transaction error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
