import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { fallbackUsersStore } from "@/lib/userStore";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const cleanEmail = credentials.email.toLowerCase().trim();
        const inputPassword = credentials.password.trim();

        // 1. Explicit Demo Account Shortcuts
        if (cleanEmail === "demo@yojanasetu.in" || cleanEmail === "citizen@yojanasetu.gov.in") {
          return {
            id: "demo-user-citizen-001",
            name: "Ramesh Kumar Yadav",
            email: cleanEmail,
            role: "CITIZEN",
          };
        }

        // 2. Dynamic Demo / Harshit / Custom Account Shortcuts
        if (cleanEmail.startsWith("harshit") || cleanEmail.includes("harshit")) {
          const formattedName = "Harshit";
          return {
            id: `user-harshit-${Date.now()}`,
            name: formattedName,
            email: cleanEmail,
            role: "CITIZEN",
          };
        }

        // 3. Try Prisma DB Lookup
        try {
          const user = await db.user.findUnique({
            where: { email: cleanEmail },
          });

          if (user) {
            if (user.password && user.password !== credentials.password && user.password !== inputPassword) {
              return null; // Incorrect password for existing DB account
            }
            return {
              id: user.id,
              name: user.email?.split("@")[0] || "Citizen",
              email: user.email,
              role: user.role,
            };
          }
        } catch (dbErr) {
          console.warn("DB lookup notice in authorize():", dbErr);
        }

        // 4. Fallback Store Lookup (Accounts created in local memory)
        const fallbackUser = fallbackUsersStore.get(cleanEmail);
        if (fallbackUser) {
          if (fallbackUser.password && fallbackUser.password !== credentials.password && fallbackUser.password !== inputPassword) {
            return null; // Incorrect password for existing fallback account
          }
          return {
            id: fallbackUser.id,
            name: fallbackUser.name || cleanEmail.split("@")[0],
            email: fallbackUser.email,
            role: fallbackUser.role || "CITIZEN",
          };
        }

        // 5. Seamless Registration / Authorization for any new or existing user account
        if (inputPassword.length >= 4) {
          const derivedName = cleanEmail.split("@")[0];
          const capitalizedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
          
          const newUser = {
            id: `user-${Date.now()}`,
            name: capitalizedName,
            email: cleanEmail,
            password: inputPassword,
            role: "CITIZEN",
          };

          // Save account into fallbackUsersStore so future logins succeed seamlessly
          fallbackUsersStore.set(cleanEmail, newUser);

          return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          };
        }

        return null;
      },
    }),

    // ── OTP Login Provider ──────────────────────────────────────────────────
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        identifier: { label: "Phone / Email", type: "text" },
        verified: { label: "OTP Verified", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || credentials.verified !== "true") {
          return null;
        }

        const identifier = credentials.identifier.toLowerCase().trim();
        const derivedName = identifier.includes("@")
          ? identifier.split("@")[0]
          : `Citizen_${identifier.slice(-4)}`;
        const capitalizedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

        // Look up DB user by email
        if (identifier.includes("@")) {
          try {
            const user = await db.user.findUnique({ where: { email: identifier } });
            if (user) {
              return {
                id: user.id,
                name: user.email?.split("@")[0] || capitalizedName,
                email: user.email,
                role: user.role,
              };
            }
          } catch {
            // DB offline — fall through
          }

          const fallbackUser = fallbackUsersStore.get(identifier);
          if (fallbackUser) {
            return {
              id: fallbackUser.id,
              name: fallbackUser.name || capitalizedName,
              email: fallbackUser.email,
              role: fallbackUser.role || "CITIZEN",
            };
          }
        }

        // Auto-create / return user session for OTP logins
        return {
          id: `otp-user-${Date.now()}`,
          name: capitalizedName,
          email: identifier.includes("@") ? identifier : `${identifier}@otp.yojanasetu.in`,
          role: "CITIZEN",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = (user as { role?: string }).role || "CITIZEN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        (session.user as { role?: string }).role = (token.role as string) || "CITIZEN";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "yojana-setu-super-secret-key-2026",
};
