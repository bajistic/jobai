import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/services/openai.service'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: true,
        profile: true,
        assistants: {
          where: {
            assistantName: {
              in: [`Composer_${userId}`, `JobRanker_${userId}`]
            }
          }
        },
      },
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get default job ranker prompt if no profile exists
    const defaultJobRankerPrompt = `Analysiere die folgende Stellenanzeige und berechne Punkte basierend auf den folgenden Kriterien.

Pluspunkte:
(+4) Einstiegsstelle in jedem Bereich (Einsteiger, Quereinsteiger)
(+4) Kaufmännische Lehre (Kaufmann EFZ, KV), oder lediglich Berufslehre/Grundbildung erfordert
(+4) Kassenwesen und Kundendienst
(+3) Software-/Webentwicklungsrolle
(+3) IT-Support
(+3) Grafikdesignrolle
(+3) Logistik

Pluspunkte für jedes Tool:
(+1) Entwicklung: HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express, Git
(+1) Betriebssysteme: Linux
(+0.5) Design-Tools: Photoshop, Illustrator, Figma
(+0.5) Datenbank: MongoDB, PostgreSQL
(+0.5) Sonstiges: MS Office, Python

Minuspunkte:
(-3) Fachspezifische Rolle in einem anderen Bereich als den oben genannten
(-2) Ein Hochschulabschluss, Studium ist erforderlich
(-2) Ein Zertifikat ist erforderlich
(-1) Punkt für jedes Jahr Berufserfahrung in einem Bereich, der nicht oben genannt ist (z.B. (-4) wenn 4 Jahre Erfahrung erfordert) oder (-3) wenn "mehrjährige" Erfahrung`;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      documents: user.documents,
      systemPrompt: user.assistants[0]?.systemPrompt || '',
      assistants: user.assistants,
      jobRankerPrompt: user.profile?.jobRankerPrompt || defaultJobRankerPrompt,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const userJobRanker = await prisma.userAssistant.findFirst({ where: { userId, assistantName: `JobRanker_${userId}` } })
    const userComposer = await prisma.userAssistant.findFirst({ where: { userId, assistantName: `Composer_${userId}` } })
    const data = await request.json()
    
    console.log('Received data for update:', data);

    // First update the user's name and image
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        image: data.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        assistants: true,
      }
    });

    // Then update job ranker prompt if changed
    if (data.jobRankerPrompt) {
      const openAIService = OpenAIService.getInstance();
      await openAIService.updateJobRankingPrompt(userId, data.jobRankerPrompt);
    }

    if (data.composerPrompt) {
      const openAIService = OpenAIService.getInstance();
      await openAIService.updateComposerAssistant(userId, userComposer?.assistantId ?? "", data.composerPrompt);
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Delete all files associated with the user
    await prisma.userDocument.deleteMany({
      where: { userId: userId }
    });

    // Delete all vector stores associated with the user
    await prisma.userVectorStore.deleteMany({
      where: { userId: userId }
    });

    // Delete all assistants associated with the user
    const userAssistants = await prisma.userAssistant.findMany({
      where: { userId: userId }
    });

    // Delete the assistants from OpenAI
    const openAIService = OpenAIService.getInstance();
    for (const assistant of userAssistants) {
      if (assistant.assistantId) {
        await openAIService.deleteAssistant(assistant.assistantId);
      }
    }

    // Delete the assistants from the database
    await prisma.userAssistant.deleteMany({
      where: { userId: userId }
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Profile deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
} 