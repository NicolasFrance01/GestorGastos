import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, type, categoryId, walletId, description, tags, spaceId } = await req.json();

    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction
      const newTx = await tx.transaction.create({
        data: {
          amount,
          type: type as TransactionType,
          categoryId,
          walletId,
          description,
          tags,
          spaceId,
        },
      });

      // Update wallet balance
      if (walletId) {
        const multiplier = type === "INCOME" ? 1 : -1;
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            balance: {
              increment: amount * multiplier,
            },
          },
        });
      }

      return newTx;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
