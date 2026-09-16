import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "dev-creator-portal-local-secret";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export const SessionSchema = z.object({
  creatorId: z.string(),
  name: z.string(),
  email: z.string(),
  productIds: z.array(z.string()).default([]),
  royaltyRate: z.number().default(0.1),
});

export type CreatorSession = z.infer<typeof SessionSchema>;

export async function signCreatorSession(session: CreatorSession) {
  return new SignJWT({
    creatorId: session.creatorId,
    name: session.name,
    email: session.email,
    productIds: session.productIds,
    royaltyRate: session.royaltyRate,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyCreatorSession(token: string) {
  const { payload } = await jwtVerify(token, secretKey);
  return SessionSchema.parse(payload);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("creator_session")?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyCreatorSession(token);
  } catch {
    return null;
  }
}

export async function requireCreatorSession() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return session;
}
