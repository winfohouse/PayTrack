import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> } // <- Promise wrapper
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Await the params - this is the key change for Next.js 15
    const { email } = await params;
    
    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Decode the email in case it's URL encoded
    const decodedEmail = decodeURIComponent(email);

    const user = await prisma.user.findUnique({
      where: { email: decodedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("USER_FIND_BY_EMAIL_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
