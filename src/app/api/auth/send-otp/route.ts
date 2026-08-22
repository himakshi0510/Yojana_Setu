import { NextRequest, NextResponse } from "next/server";

// ── Singleton OTP store shared across hot-reloads in dev ──────────────────────
type OtpEntry = { otp: string; expiresAt: number; attempts: number };
const OTP_STORE: Map<string, OtpEntry> =
  (global as Record<string, unknown>).__yojanasetu_otp_store__ as Map<string, OtpEntry> ||
  (() => {
    const m = new Map<string, OtpEntry>();
    (global as Record<string, unknown>).__yojanasetu_otp_store__ = m;
    return m;
  })();

function cleanExpired() {
  const now = Date.now();
  for (const [key, val] of OTP_STORE.entries()) {
    if (val.expiresAt < now) OTP_STORE.delete(key);
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send real SMS via Fast2SMS (Indian SMS Gateway) or Twilio if API keys exist
 */
async function sendRealSMS(phone: string, otp: string): Promise<boolean> {
  const cleanPhone = phone.replace(/\D/g, "");

  // 1. Try Fast2SMS (Primary Indian SMS Gateway)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    const targetMobile = cleanPhone.slice(-10);
    
    // Method 1A: Fast2SMS OTP Route
    try {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2smsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variables_values: otp,
          route: "otp",
          numbers: targetMobile,
        }),
      });
      const data = await res.json();
      if (data.return) {
        console.log(`[Fast2SMS OTP Delivered] -> +91 ${targetMobile}`);
        return true;
      }
    } catch (e) {
      console.warn("[Fast2SMS OTP Route Failed, trying Quick SMS route]", String(e));
    }

    // Method 1B: Fast2SMS Quick SMS Route (Fallback if OTP route isn't enabled on account)
    try {
      const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=q&message=Your%20Yojana%20Setu%20OTP%20is%20${otp}.%20Valid%20for%205%20minutes.&language=english&flash=0&numbers=${targetMobile}`);
      const data = await res.json();
      if (data.return) {
        console.log(`[Fast2SMS Quick SMS Delivered] -> +91 ${targetMobile}`);
        return true;
      }
    } catch (e) {
      console.error("[Fast2SMS Quick SMS Error]", String(e));
    }
  }

  // 2. Try Twilio
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const formattedPhone = cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone.slice(-10)}`;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        To: formattedPhone,
        From: twilioFrom,
        Body: `Your Yojana Setu (योजना सेतु) OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      if (res.ok) {
        console.log(`[SMS Sent via Twilio] -> ${formattedPhone}`);
        return true;
      }
    } catch (e) {
      console.error("[Twilio SMS Error]", String(e));
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    cleanExpired();
    const { identifier } = await req.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Phone number or email is required." }, { status: 400 });
    }

    const key = identifier.toLowerCase().trim();
    const isMobile = /^[6-9]\d{9}$/.test(key.replace(/\s/g, ""));

    // Rate limit: 60s cooldown between sends
    const existing = OTP_STORE.get(key);
    if (existing && existing.expiresAt - 4 * 60 * 1000 > Date.now()) {
      return NextResponse.json(
        { error: "OTP already sent. Please wait 60 seconds before requesting again." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    OTP_STORE.set(key, { otp, expiresAt, attempts: 0 });

    // Attempt real SMS if mobile number
    let realSmsSent = false;
    if (isMobile) {
      realSmsSent = await sendRealSMS(key, otp);
    }

    console.log(
      `\n📲 [OTP DEBUG] → ${key} | OTP: ${otp} | Real SMS Sent: ${realSmsSent} | Valid for 5 minutes\n`
    );

    const smsMessage = `[SMS Notification] To +91 ${key.slice(-10)}: Your Yojana Setu (योजना सेतु) login OTP is ${otp}. Valid for 5 minutes.`;

    return NextResponse.json({
      success: true,
      message: realSmsSent
        ? `OTP sent directly to mobile number +91 ${key.slice(-10)} via SMS.`
        : `OTP generated for ${identifier}.`,
      isMobile,
      realSmsSent,
      // Dev mode SMS preview (simulates phone SMS popup)
      smsPreview: !realSmsSent ? smsMessage : undefined,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      expiresIn: 300,
    });
  } catch (err) {
    console.error("[send-otp error]", String(err));
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
