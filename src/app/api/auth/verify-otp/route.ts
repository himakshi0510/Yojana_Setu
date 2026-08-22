import { NextRequest, NextResponse } from "next/server";

// Shared in-memory OTP store (same module-level Map reused across requests in dev)
// In production, use Redis/DB. The Map is imported indirectly via a singleton module.
const OTP_STORE: Map<string, { otp: string; expiresAt: number; attempts: number }> =
  (global as Record<string, unknown>).__yojanasetu_otp_store__ as Map<string, { otp: string; expiresAt: number; attempts: number }> ||
  (() => {
    const m = new Map<string, { otp: string; expiresAt: number; attempts: number }>();
    (global as Record<string, unknown>).__yojanasetu_otp_store__ = m;
    return m;
  })();

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { identifier, otp } = await req.json();

    if (!identifier || !otp) {
      return NextResponse.json({ error: "Identifier and OTP are required." }, { status: 400 });
    }

    const key = (identifier as string).toLowerCase().trim();
    const entry = OTP_STORE.get(key);

    if (!entry) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (Date.now() > entry.expiresAt) {
      OTP_STORE.delete(key);
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    entry.attempts += 1;
    if (entry.attempts > MAX_ATTEMPTS) {
      OTP_STORE.delete(key);
      return NextResponse.json(
        { error: "Too many incorrect attempts. Request a new OTP." },
        { status: 429 }
      );
    }

    if (entry.otp !== otp.toString().trim()) {
      return NextResponse.json(
        { error: `Invalid OTP. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` },
        { status: 400 }
      );
    }

    // ✅ OTP verified — delete from store to prevent replay
    OTP_STORE.delete(key);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully.",
      identifier: key,
    });
  } catch (err) {
    console.error("[verify-otp error]", String(err));
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
