import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Confirm a payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Next.js 15 async params

) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    // Only the payee can confirm the payment
    if (payment.payeeId !== session.user.id) {
      return new NextResponse("Forbidden: Only the payee can confirm a payment.", { status: 403 });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { confirmed: true },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("PAYMENT_PUT_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Delete a payment
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    // Check if the current user is the payer (creator of the payment)
    if (payment.payerId !== session.user.id) {
      return new NextResponse("Forbidden: Only the creator can delete a payment.", { status: 403 });
    }

    // Check if createdAt is within 2 hours
    const createdAt = new Date(payment.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 2) {
      return new NextResponse("Forbidden: Payment can only be deleted within 2 hours of creation.", { status: 403 });
    }

    await prisma.payment.delete({
      where: { id },
    });

    return new NextResponse("Payment deleted successfully.", { status: 200 });
  } catch (error) {
    console.error("PAYMENT_DELETE_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
