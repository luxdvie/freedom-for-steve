import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  return token === process.env.STEVE_API_KEY;
}

// POST /api/upload — upload an image, returns the public URL
// Accepts multipart/form-data with a single "file" field
// or application/json with { filename, contentType, data } (base64-encoded data)
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();

  const contentType = request.headers.get("content-type") ?? "";

  let fileBuffer: Buffer;
  let filename: string;
  let mimeType: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing required field: file" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    fileBuffer = Buffer.from(await file.arrayBuffer());
    filename = file.name;
    mimeType = file.type;
  } else if (contentType.includes("application/json")) {
    const body = await request.json();
    const { filename: fn, contentType: ct, data } = body;

    if (!fn || !ct || !data) {
      return NextResponse.json(
        { error: "Missing required fields: filename, contentType, data" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(ct)) {
      return NextResponse.json(
        { error: `Unsupported content type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    fileBuffer = Buffer.from(data, "base64");

    if (fileBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    filename = fn;
    mimeType = ct;
  } else {
    return NextResponse.json(
      { error: "Unsupported content type. Use multipart/form-data or application/json." },
      { status: 415 }
    );
  }

  // Sanitize filename and namespace under images/
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobPath = `images/${Date.now()}-${safeName}`;

  const blob = await put(blobPath, fileBuffer, {
    contentType: mimeType,
    access: "public",
    allowOverwrite: false,
  });

  return NextResponse.json({
    url: blob.url,
    filename: safeName,
    contentType: mimeType,
    size: fileBuffer.byteLength,
  });
}
