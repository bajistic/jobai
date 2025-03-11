import NextAuth, { AuthOptions, User, Session } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { JWT } from "next-auth/jwt"
import { OpenAIService } from '@/services/openai.service'

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('Attempting authorization with:', credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          console.log('Found user:', user ? 'yes' : 'no')

          if (!user || !user.password) {
            console.log('User not found or no password')
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          console.log('Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('Invalid password')
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            group: user.group,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }: { token: JWT, user: User }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const openAIService = OpenAIService.getInstance();

      // This code is not actually used - user creation happens in the /api/auth/signup route
      // This is only kept as a fallback for external auth providers which we don't use
      
      // 1) Create vector store first
      const vectorStore = await openAIService.createUserVectorStore(user.id);
      
      // 2) Create job ranker assistant on OpenAI (creates its own DB record)
      await openAIService.createJobRankingAssistant(user.id);
      
      // 3) Create job composer assistant on OpenAI
      const composerAssistant = await openAIService.createComposerAssistant(user.id, vectorStore.id);

      await prisma.userAssistant.create({
        data: {
          userId: user.id,
          assistantName: `Composer_${user.id}`,
          assistantId: composerAssistant.id,
          systemPrompt: composerAssistant.instructions || '',
        },
      });

      await prisma.userVectorStore.create({
        data: {
          userId: user.id,
          vectorStoreId: vectorStore.id,
          fileIds: [],
        },
      });
    },
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 