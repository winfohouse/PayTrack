import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Fetch approved workers assigned to this user (as company)
    const approvedWorkers = await prisma.workerRequest.findMany({
      where: {
        fromUserId: userId,
        status: "APPROVED",
      },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            jobsAsWorker: {
              where: {
                status: {
                  in: ["PENDING", "IN_PROGRESS"], // Only active jobs
                },
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

    // Format response: array of workers with their jobs
    const workers = approvedWorkers.map((w) => w.toUser);

    return NextResponse.json({ workers });
  } catch (error) {
    console.error("MY_WORKER_GET_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
