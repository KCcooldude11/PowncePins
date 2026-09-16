import { NextResponse } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";
import { signCreatorSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Portal database is not configured" }, { status: 503 });
  }

  const { data: creator, error } = await supabase
    .from("creators")
    .select("id, creator_id, name, email, password_hash, royalty_rate")
    .ilike("email", email.trim())
    .maybeSingle();

  console.info("[auth] creator lookup", {
    email: email.trim().toLowerCase(),
    found: Boolean(creator),
    queryError: error?.message || null,
  });

  if (error) {
    console.error("Creator lookup failed", error);
    return NextResponse.json({ error: "Creator database lookup failed" }, { status: 500 });
  }

  if (!creator) {
    return authFailure("Creator email was not found");
  }

  let passwordMatches = false;
  try {
    passwordMatches = await compare(password, creator.password_hash);
  } catch (error) {
    console.error("Creator password hash is invalid", error);
  }

  console.info("[auth] password check", {
    hashLength: typeof creator.password_hash === "string" ? creator.password_hash.length : null,
    hashPrefix: typeof creator.password_hash === "string" ? creator.password_hash.slice(0, 4) : null,
    passwordMatches,
  });

  if (!passwordMatches) {
    return authFailure("Password does not match the stored hash");
  }

  const token = await signCreatorSession({
    creatorId: creator.creator_id,
    name: creator.name,
    email: creator.email,
    productIds: [],
    royaltyRate: Number(creator.royalty_rate),
  });

  const response = NextResponse.json({
    ok: true,
    creator: {
      creatorId: creator.creator_id,
      name: creator.name,
      email: creator.email,
      royaltyRate: Number(creator.royalty_rate),
    },
  });
  response.cookies.set("creator_session", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

function authFailure(debugMessage: string) {
  return NextResponse.json(
    { error: process.env.NODE_ENV === "production" ? "Invalid credentials" : debugMessage },
    { status: 401 },
  );
}
