import { NextResponse } from "next/server";
import { signCreatorSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function getCorsHeaders(request: Request) {
  const requestOrigin = request.headers.get("origin");
  const allowedOrigin = process.env.STOREFRONT_URL || requestOrigin || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);
  const body = await request.json().catch(() => null);
  const accessToken = body?.accessToken;

  if (typeof accessToken !== "string" || accessToken.length < 20) {
    return NextResponse.json({ error: "Missing Supabase session" }, { status: 400, headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Supabase session is invalid" }, { status: 401, headers: corsHeaders });
    }

    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("creator_id, name, email, royalty_rate")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator access has not been granted" }, { status: 403, headers: corsHeaders });
    }

    const token = await signCreatorSession({
      creatorId: creator.creator_id,
      name: creator.name,
      email: creator.email,
      productIds: [],
      royaltyRate: Number(creator.royalty_rate),
    });

    const response = NextResponse.json({ ok: true }, { headers: corsHeaders });
    response.cookies.set("creator_session", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    console.error("Supabase portal handoff failed", error);
    return NextResponse.json({ error: "Portal handoff failed" }, { status: 500, headers: corsHeaders });
  }
}
