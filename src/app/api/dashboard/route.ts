import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getPeriodFilter(period: string | null) {
  if (!period || period === "all") return undefined;

  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case "day":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week": {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      return undefined;
  }

  return { gte: start, lte: end };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId");
  const period = searchParams.get("period") || "month";

  if (!session || !spaceId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateFilter = getPeriodFilter(period);
    const whereClause: any = { spaceId };
    if (dateFilter) whereClause.date = dateFilter;

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
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

    const categoryTotals = transactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((acc: any, tx) => {
        const catName = tx.category.name;
        if (!acc[catName]) {
          acc[catName] = { name: catName, value: 0, color: tx.category.color };
        }
        acc[catName].value += tx.amount;
        return acc;
      }, {});

    return NextResponse.json({
      stats,
      chartData: Object.values(categoryTotals),
      recentTransactions: transactions.slice(0, 50),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
