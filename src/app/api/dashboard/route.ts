import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId");

  if (!session || !spaceId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { spaceId },
      include: { category: true, wallet: true },
      orderBy: { date: "desc" },
    });

    const stats = transactions.reduce(
      (acc, tx) => {
        if (tx.type === "INCOME") acc.income += tx.amount;
        else acc.expenses += tx.amount;
        acc.balance = acc.income - acc.expenses;
        return acc;
      },
      { income: 0, expenses: 0, balance: 0 }
    );

    // Group by category for chart
    const categoryTotals = transactions
      .filter(tx => tx.type === "EXPENSE")
      .reduce((acc: any, tx) => {
        const catName = tx.category.name;
        if (!acc[catName]) {
          acc[catName] = { name: catName, value: 0, color: tx.category.color };
        }
        acc[catName].value += tx.amount;
        return acc;
      }, {});

    const chartData = Object.values(categoryTotals);

    return NextResponse.json({
      stats,
      chartData,
      recentTransactions: transactions.slice(0, 5),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
