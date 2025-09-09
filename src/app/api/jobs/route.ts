import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Create a new job
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, agreedPrice, dueDate, assignedToId } = body;

    if (!title || !assignedToId) {
      return new NextResponse("Missing title or assignedToId", { status: 400 });
    }

    const companyId = session.user.id;

    // Verify that the assigned user is an approved worker
    const workerConnection = await prisma.workerRequest.findFirst({
      where: {
        fromUserId: companyId,
        toUserId: assignedToId,
        status: "APPROVED",
      },
    });

    const companyConnection = await prisma.workerRequest.findFirst({
      where: {
        fromUserId: assignedToId,
        toUserId: companyId,
        status: "APPROVED",
      }
    })

    if (!workerConnection && !companyConnection) {
      return new NextResponse("The assigned user is not an approved worker for you.", { status: 403 });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null, agreedPrice: parseFloat(agreedPrice),
        assignedToId,
        companyId,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("JOB_POST_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Get jobs for the current user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userId = session.user.id;

    const jobsAsCompany = await prisma.job.findMany({
      where: { companyId: userId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const jobsAsWorker = await prisma.job.findMany({
      where: { assignedToId: userId },
      include: {
        company: { select: { id: true, name: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ jobsAsCompany, jobsAsWorker });
  } catch (error) {
    console.error("JOB_GET_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
