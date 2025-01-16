import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions = {
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
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 