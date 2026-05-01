import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId");
  const type = searchParams.get("type");

  if (!spaceId) {
    return NextResponse.json({ message: "Space ID is required" }, { status: 400 });
  }

  try {
    const whereClause: any = { 
      spaceId: spaceId 
    };

    if (type) {
      whereClause.type = type as TransactionType;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Categories error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}
