import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId");
  const type = searchParams.get("type");

  if (!session || !spaceId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { 
        spaceId,
        ...(type ? { type: type as TransactionType } : {})
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
