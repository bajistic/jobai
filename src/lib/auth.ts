import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const auth = async () => {
  const session = await getServerSession(authOptions)
  console.log('Current session data:', JSON.stringify(session, null, 2))
  return {
    userId: session?.user?.id
  }
} 