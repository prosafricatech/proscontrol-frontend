import axios from '@/lib/services/config';
import { getForwardedRequestHeadersFromHeaders } from '@/lib/utils/apiUtils';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          const forwardedHeaders = getForwardedRequestHeadersFromHeaders(
            req?.headers || {}
          );

          const axiosInstance = axios.create({
            withCredentials: true,
            headers: forwardedHeaders,
          });

          const { data: response } = await axiosInstance.post(
            '/auth/login',
            {
              identifier: credentials.email,
              password: credentials.password,
            },
            {
              validateStatus: (status) => status < 500,
            }
          );

          const data = response?.data;

          if (!data?.user?.id || !data?.token) {
            throw new Error('Invalid login credentials');
          }

          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            email_verified_at: data.user.email_verified_at,
            is_staff: true,
            permissions: data.permissions || data.user.permissions || [],
            token: data.token,
            organization_id: undefined,
            organization_name: undefined,
          };
        } catch (error) {
          console.error('Login failed:', error.response?.data || error.message);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        if (session.accessToken) token.accessToken = session.accessToken;
        if (session.organization_id)
          token.organization_id = session.organization_id;
        if (session.organization_name)
          token.organization_name = session.organization_name;
      }
      if (user) {
        token.accessToken = user.token;
        token.organization_id = user.organization_id;
        token.organization_name = user.organization_name;
        token.permissions = user.permissions;

        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.email_verified_at = user.email_verified_at;
        token.is_staff = user.is_staff;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        email_verified_at: token.email_verified_at | null,
        is_staff: token.is_staff === true,
      };
      session.organization_id = token.organization_id;
      session.organization_name = token.organization_name;
      session.permissions = token.permissions;

      return session;
    },
  },

  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

// Only export handlers, no other constants
export { handler as GET, handler as POST };
