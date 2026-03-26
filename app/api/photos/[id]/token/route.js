import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const { id } = params;

  return NextResponse.json(
    { error: `Not implemented: generate signed token for photo ${id}` },
    { status: 501 }
  );
}
