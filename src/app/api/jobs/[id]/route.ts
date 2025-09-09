import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, JobStatus } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Get a single job by ID
export async function GET(
  request: NextRequest
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const id = request.nextUrl.pathname.match(/\/jobs\/([^/]+)/)?.[1];

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    // Ensure the user is part of the job
    if (job.companyId !== session.user.id && job.assignedToId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("JOB_GET_SINGLE_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Update a job
export async function PUT(
  request: NextRequest,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const id = request.nextUrl.pathname.match(/\/jobs\/([^/]+)/)?.[1];
    const { status } = (await request.json()) as { status: JobStatus };

    if (!status) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    // Only the company or the worker can update the job status
    if (job.companyId !== session.user.id && job.assignedToId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("JOB_PUT_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Delete a job
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = params;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    // Only the company can delete the job
    if (job.companyId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.job.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("JOB_DELETE_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
