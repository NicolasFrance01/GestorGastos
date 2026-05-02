import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    const { amount, type, categoryId, walletId, description, tags, date } = await req.json();

    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Get original transaction to reverse its wallet effect
      const original = await tx.transaction.findUnique({ where: { id } });
      if (!original) throw new Error("Transaction not found");

      // Reverse original wallet balance change
      if (original.walletId) {
        const reverseMultiplier = original.type === "INCOME" ? -1 : 1;
        await tx.wallet.update({
          where: { id: original.walletId },
          data: { balance: { increment: original.amount * reverseMultiplier } },
        });
      }

      // Apply new wallet balance change
      const newWalletId = walletId || null;
      if (newWalletId) {
        const multiplier = type === "INCOME" ? 1 : -1;
        await tx.wallet.update({
          where: { id: newWalletId },
          data: { balance: { increment: Number(amount) * multiplier } },
        });
      }

      return tx.transaction.update({
        where: { id },
        data: {
          amount: Number(amount),
          type: type as TransactionType,
          categoryId,
          walletId: newWalletId,
          description: description || null,
          tags: tags || null,
          date: date ? new Date(date) : undefined,
        },
        include: { category: true, wallet: true },
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    await (prisma as any).$transaction(async (tx: any) => {
      const transaction = await tx.transaction.findUnique({ where: { id } });
      if (!transaction) throw new Error("Transaction not found");

      // Reverse wallet balance
      if (transaction.walletId) {
        const reverseMultiplier = transaction.type === "INCOME" ? -1 : 1;
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount * reverseMultiplier } },
        });
      }

      await tx.transaction.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
