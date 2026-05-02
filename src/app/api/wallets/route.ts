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
    const wallets = await prisma.wallet.findMany({
      where: { spaceId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(wallets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name, type, category, balance, spaceId } = await req.json();
    if (!name || !type || !category || !spaceId) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    const wallet = await prisma.wallet.create({
      data: {
        name,
        type,
        category,
        balance: Number(balance) || 0,
        spaceId,
      },
    });
    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
