import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { logger } from "@/lib/logger";

import type { UserRole } from "@/generated/prisma/enums";
import { userRepository } from "@/repositories";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        logger.info(
          { email: credentials?.email },
          "Credentials login attempt"
        );

        if (!credentials?.email || !credentials?.password) {
          logger.warn("Missing email or password");
          return null;
        }

        const user = await userRepository.findByEmail(credentials.email);

        if (!user) {
          logger.warn(
            { email: credentials.email },
            "User not found"
          );
          return null;
        }

        if (!user.passwordHash) {
          logger.error(
            {
              userId: user.id,
              email: user.email,
            },
            "User has no password hash"
          );
          return null;
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordValid) {
          logger.warn(
            { email: credentials.email },
            "Invalid password"
          );
          return null;
        }

        logger.info(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          "User authenticated successfully"
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
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
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};