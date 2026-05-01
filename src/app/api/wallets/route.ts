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
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
