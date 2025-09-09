import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Create a new worker request
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { toUserId } = body;

    if (!toUserId) {
      return new NextResponse("Missing toUserId", { status: 400 });
    }

    const fromUserId = session.user.id;

    // Check if a request already exists
    const existingRequest = await prisma.workerRequest.findFirst({
      where: {
        fromUserId,
        toUserId,
      }
    });

    if (existingRequest) {
      return new NextResponse("A worker request to this user already exists.", { status: 400 });
    }


    const workerRequest = await prisma.workerRequest.create({
      data: {
        fromUserId,
        toUserId,
      },
    });

    return NextResponse.json(workerRequest);
  } catch (error) {
    console.error("WORKER_REQUEST_POST_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Get all worker requests for the current user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const receivedRequests = await prisma.workerRequest.findMany({
      where: {
        toUserId: session.user.id,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });

    const sentRequests = await prisma.workerRequest.findMany({
      where: {
        fromUserId: session.user.id,
      },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });
    


    return NextResponse.json({ receivedRequests , sentRequests });
  } catch (error) {
    console.error("WORKER_REQUEST_GET_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
