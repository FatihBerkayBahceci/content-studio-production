import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByEmail, verifyPassword, updateLastLogin, getAccessibleClients } from '@/lib/db/users';

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'client' | 'team';
    accessibleClients: number[];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'client' | 'team';
      accessibleClients: number[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'client' | 'team';
    accessibleClients: number[];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gerekli');
        }

        const user = await findUserByEmail(credentials.email);

        if (!user) {
          throw new Error('Kullanıcı bulunamadı');
        }

        if (!user.is_active) {
          throw new Error('Hesabınız devre dışı bırakılmış');
        }

        const isValidPassword = await verifyPassword(credentials.password, user.password_hash);

        if (!isValidPassword) {
          throw new Error('Geçersiz şifre');
        }

        // Update last login
        await updateLastLogin(user.id);

        // Get accessible clients
        const accessibleClients = await getAccessibleClients(user.id, user.role);

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          accessibleClients,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accessibleClients = user.accessibleClients;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.accessibleClients = token.accessibleClients;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
