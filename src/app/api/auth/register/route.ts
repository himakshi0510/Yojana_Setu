import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fallbackUsersStore } from "@/lib/userStore";

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown> = {};

    try {
      body = await req.json();
    } catch {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON format in request body." },
          { status: 400 }
        );
      }
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const phone = String(body.phone || "").trim();
    const state = String(body.state || "").trim();
    const password = String(body.password || "");

    // 1. Validation
    if (!email || !password || !name || !state) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, state, password)" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 2. Try Prisma DB persistence first
    try {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const newUser = await db.user.create({
        data: {
          email,
          phone: phone || null,
          password,
          role: "CITIZEN",
          profile: {
            create: {
              state,
              district: "General",
              age: 30,
              gender: "Male",
              occupation: "Citizen",
              annualIncome: 150000,
              casteCategory: "GENERAL",
              landHoldingAcres: 1.0,
              isStudent: false,
              isSpeciallyAbled: false,
              isSeniorCitizen: false,
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      const userPayload = newUser || {
        id: `user-${Date.now()}`,
        name,
        email,
        role: "CITIZEN",
      };

      return NextResponse.json(
        {
          success: true,
          user: userPayload,
          message: "Account created successfully!",
        },
        { status: 201 }
      );
    } catch (dbErr) {
      console.warn("DB notice during registration, using fallback storage:", dbErr);

      // Fallback store handling if DB is offline or proxy
      const existingInMemory = fallbackUsersStore.get(email);
      if (existingInMemory) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const fallbackUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        phone: phone || undefined,
        password,
        state,
        role: "CITIZEN",
      };

      fallbackUsersStore.set(email, fallbackUser);

      return NextResponse.json(
        {
          success: true,
          user: {
            id: fallbackUser.id,
            email: fallbackUser.email,
            role: fallbackUser.role,
          },
          message: "Account created successfully!",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: `Registration error: ${errMessage}` },
      { status: 500 }
    );
  }
}
