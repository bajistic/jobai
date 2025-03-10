export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  // Analytics
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
  // Google Service Account for Google Docs integration
  googleServiceAccount: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    userEmail: process.env.GOOGLE_USER_EMAIL!,
  },
} 
