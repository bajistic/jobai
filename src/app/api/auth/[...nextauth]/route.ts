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
  debug: true,
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

      // 1) Create job ranker assistant on OpenAI
      const rankerAssistant = await openAIService.createJobRankerAssistant(user.id);
      // 2) Create job composer assistant on OpenAI
      const composerAssistant = await openAIService.createComposerAssistant(user.id, /* no fileIds yet */ []);
      // 3) Create vector store on OpenAI
      const vectorStore = await openAIService.createUserVectorStore(user.id);

      // Then store them in Prisma
      await prisma.userAssistant.create({
        data: {
          userId: user.id,
          assistantName: 'job-ranker',
          assistantId: rankerAssistant.id, 
          systemPrompt: 'System prompt for ranking jobs',
        },
      });

      await prisma.userAssistant.create({
        data: {
          userId: user.id,
          assistantName: 'job-composer',
          assistantId: composerAssistant.id,
          systemPrompt: 'System prompt for composing job applications',
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