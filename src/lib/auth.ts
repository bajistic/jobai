import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      group?: string | null
    }
  }
}

export const auth = async (): Promise<Session | null> => {
  const session = await getServerSession(authOptions)
  return session
} 