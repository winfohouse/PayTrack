import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Create a new payment
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, discription, jobId } = body;

    if (!amount || !jobId) {
      return new NextResponse("Missing amount or jobId", { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    const userId = session.user.id;
    let payerId, payeeId, confirmed;

    if (userId === job.companyId) {
      // Company is creating the payment
      payerId = userId;
      payeeId = job.assignedToId;
      confirmed = false;
    } else if (userId === job.assignedToId) {
      // Worker is creating the payment
      payerId = job.companyId;
      payeeId = userId;
      confirmed = true;
    } else {
      return new NextResponse("Forbidden: You are not part of this job.", { status: 403 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        discription,
        jobId,
        payerId,
        payeeId,
        confirmed,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("PAYMENT_POST_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
