import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const auth = async (): Promise<Session | null> => {
  const session = await getServerSession(authOptions)
  return session
} 