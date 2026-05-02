import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

function makeToken(spaceId: string) {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET || "fallback")
    .update(spaceId)
    .digest("hex")
    .slice(0, 24);
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  const space = await prisma.space.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!space) return NextResponse.json({ message: "Space not found" }, { status: 404 });

  const token = makeToken(id);
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${baseUrl}/join/${id}/${token}`;

  return NextResponse.json({ url, spaceName: space.name });
}
