import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: session.user.id },
      orderBy: { nextDate: "asc" },
    });
    return NextResponse.json(reminders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { title, amount, frequency, nextDate } = await req.json();
    if (!title || !amount || !frequency || !nextDate) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    const reminder = await prisma.reminder.create({
      data: {
        title,
        amount: Number(amount),
        frequency,
        nextDate: new Date(nextDate),
        userId: session.user.id,
      },
    });
    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
