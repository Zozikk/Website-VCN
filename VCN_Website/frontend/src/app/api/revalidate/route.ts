import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const secret = body?.secret;
    const path = body?.path;

    if (!secret || secret !== process.env.NEXT_REVALIDATE_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    if (!path || typeof path !== "string") {
      return NextResponse.json({ message: "Missing path" }, { status: 400 });
    }

    try {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true });
    } catch (err: any) {
      return NextResponse.json({ revalidated: false, error: String(err) }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
