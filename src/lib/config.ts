export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  // Add other config values here as needed
  googleServiceAccount: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  },
} 