import { NextRequest, NextResponse } from "next/server";
import { processWebhookNotification } from "@/lib/mercadopago";

export async function GET(request: NextRequest) {
  // MP sends validation via GET
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");
  const id = searchParams.get("id") || searchParams.get("data.id");

  if (id) {
    // Process async — don't block the response
    processWebhookNotification(topic, id).catch((err) => {
      console.error("[MP Webhook GET] Error:", err);
    });
  }

  return NextResponse.json({ status: "ok" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MP IPN notification
    const topic = body.type || body.topic || null;
    const id = body.data?.id || body.id || null;

    if (id) {
      // Process async — don't block the response
      processWebhookNotification(topic, id).catch((err) => {
        console.error("[MP Webhook POST] Error:", err);
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[MP Webhook POST] Parse error:", err);
    return NextResponse.json({ status: "error" }, { status: 400 });
  }
}
