import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get("spaceId");
  const type = searchParams.get("type");

  if (!spaceId) return NextResponse.json({ message: "Space ID required" }, { status: 400 });

  try {
    const categories = await prisma.category.findMany({
      where: { spaceId, ...(type ? { type: type as TransactionType } : {}) },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { name, type, icon, color, spaceId } = await req.json();
    if (!name || !type || !icon || !color || !spaceId) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { name, type: type as TransactionType, icon, color, spaceId },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
