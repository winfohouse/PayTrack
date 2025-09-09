import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const workerId = session.user.id;

    // Find all approved worker requests where the current user is the worker
    const approvedRequests = await prisma.workerRequest.findMany({
      where: {
        toUserId: workerId,
        status: "APPROVED",
      },
      include: {
        fromUser: {   // the company
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            jobsAsCompany: {
              where: {
                assignedToId: workerId,
                status: { in: ["PENDING", "IN_PROGRESS"] },
              },
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
                agreedPrice: true,
              },
            },
          },
        },
      },
    });

    // Map results into clean structure
    const result = approvedRequests.map((req) => ({
      requestId: req.id,
      company: {
        id: req.fromUser.id,
        name: req.fromUser.name,
        email: req.fromUser.email,
        image: req.fromUser.image,
      },
      jobs: req.fromUser.jobsAsCompany,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("MY_COMPANIES_GET_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
