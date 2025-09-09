import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, RequestStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const id = request.nextUrl.pathname.match(/\/jobs\/([^/]+)/)?.[1];
    const { status } = (await request.json()) as { status: RequestStatus };

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const workerRequest = await prisma.workerRequest.findUnique({
      where: { id },
    });

    if (!workerRequest) {
      return new NextResponse("Worker request not found", { status: 404 });
    }

    // Only the recipient can approve/reject the request
    if (workerRequest.toUserId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedRequest = await prisma.workerRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("WORKER_REQUEST_PUT_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
