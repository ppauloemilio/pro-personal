import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.env.DATA_DIR || "/data", "chat-uploads");

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filename = req.nextUrl.searchParams.get("f");
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
      ".pdf": "application/pdf", ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
      ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
      ".txt": "text/plain", ".zip": "application/zip",
    };
    const contentType = mimeMap[ext] || "application/octet-stream";
    const isInline = contentType.startsWith("image/") || contentType.startsWith("video/") || contentType.startsWith("audio/");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
