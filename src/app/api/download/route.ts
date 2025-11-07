import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  const response = await fetch(url);
  const blob = await response.blob();

  return new NextResponse(blob, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Content-Disposition": `attachment; filename="${url.split("/").pop()}"`,
    },
  });
}