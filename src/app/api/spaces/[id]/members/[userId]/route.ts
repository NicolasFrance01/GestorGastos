import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id: spaceId, userId } = await context.params;
  try {
    // Only the space owner can remove members (or member can remove themselves)
    const requester = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id },
    });
    if (!requester || (requester.role !== "OWNER" && session.user.id !== userId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    // Can't remove the owner
    const target = await prisma.spaceMember.findFirst({ where: { spaceId, userId } });
    if (target?.role === "OWNER") {
      return NextResponse.json({ message: "No puedes eliminar al propietario" }, { status: 400 });
    }

    await prisma.spaceMember.deleteMany({ where: { spaceId, userId } });
    return NextResponse.json({ message: "Removed" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
