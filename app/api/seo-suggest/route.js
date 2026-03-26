import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented: SEO suggestion via Claude" },
    { status: 501 }
  );
}
