import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const { token } = params;

  return NextResponse.json(
    { error: `Not implemented: serve download link for token ${token}` },
    { status: 501 }
  );
}
