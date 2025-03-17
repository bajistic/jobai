import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { User, UserAssistant, UserDocument, job_preferences } from '@prisma/client'
import { OpenAIService } from '@/services/openai.service'

type UserWithRelations = User & {
  documents: UserDocument[],
  assistants: UserAssistant[],
  job_preferences: job_preferences[]
}

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
        assistants: {
          where: {
            assistantName: {
              in: [`Composer_${userId}`, `JobRanker_${userId}`]
            }
          }
        },
        job_preferences: false
      },
    }) as UserWithRelations | null
    console.log(user)

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

    // Initialize OpenAI service
    const openaiService = OpenAIService.getInstance();

    // Sync instructions from OpenAI with local database (if we have assistants)
    const composerAssistant = user.assistants.find((a: UserAssistant) => a.assistantName === `Composer_${userId}`);
    const jobRankerAssistant = user.assistants.find((a: UserAssistant) => a.assistantName === `JobRanker_${userId}`);
    
    let jobRankerPrompt = defaultJobRankerPrompt;
    let composerPrompt = '';
    
    // For Composer assistant: sync with OpenAI and get latest instructions
    if (composerAssistant && composerAssistant.assistantId) {
      try {
        await openaiService.syncAssistantInstructions(
          userId, 
          composerAssistant.assistantId, 
          composerAssistant.assistantName
        );
        
        // Get the latest instructions from OpenAI
        composerPrompt = await openaiService.getAssistantInstructions(composerAssistant.assistantId);
        
        // If it's empty or unavailable, fall back to database
        if (!composerPrompt) {
          composerPrompt = composerAssistant.systemPrompt || '';
        }
      } catch (error) {
        console.error('Error syncing Composer instructions:', error);
        // Fall back to database if OpenAI retrieval fails
        composerPrompt = composerAssistant.systemPrompt || '';
      }
    }
    
    // For JobRanker assistant: sync with OpenAI and get latest instructions
    if (jobRankerAssistant && jobRankerAssistant.assistantId) {
      try {
        await openaiService.syncAssistantInstructions(
          userId, 
          jobRankerAssistant.assistantId, 
          jobRankerAssistant.assistantName
        );
        
        // Get the latest instructions from OpenAI
        const openaiInstructions = await openaiService.getAssistantInstructions(jobRankerAssistant.assistantId);
        
        // If we get valid instructions, use them
        if (openaiInstructions) {
          jobRankerPrompt = openaiInstructions;
        } else {
          // Otherwise, try getting from database
          const dbPrompt = await getJobRankerPrompt(userId);
          if (dbPrompt) {
            jobRankerPrompt = dbPrompt;
          }
        }
      } catch (error) {
        console.error('Error syncing JobRanker instructions:', error);
        // Try getting from database if OpenAI fails
        const dbPrompt = await getJobRankerPrompt(userId);
        if (dbPrompt) {
          jobRankerPrompt = dbPrompt;
        }
      }
    } else {
      // If no JobRanker assistant, try database
      const dbPrompt = await getJobRankerPrompt(userId);
      if (dbPrompt) {
        jobRankerPrompt = dbPrompt;
      }
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      documents: user.documents,
      assistants: user.assistants,
      jobRankerPrompt,
      composerPrompt,
      job_preferences: user.job_preferences || []
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// Helper function to get job ranker prompt
async function getJobRankerPrompt(userId: string): Promise<string | null> {
  try {
    // First try to get from UserProfile
    const profile = await prisma.$queryRaw`
      SELECT "jobRankerPrompt" FROM "UserProfile" WHERE "userId" = ${userId} LIMIT 1
    `;

    if (profile && Array.isArray(profile) && profile.length > 0 && profile[0].jobRankerPrompt) {
      return profile[0].jobRankerPrompt;
    }

    // If not found, try to get from JobRanker assistant
    const jobRanker = await prisma.userAssistant.findFirst({
      where: {
        userId,
        assistantName: `JobRanker_${userId}`
      }
    });

    return jobRanker?.systemPrompt || null;
  } catch (error) {
    console.error('Error getting job ranker prompt:', error);
    return null;
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Initialize OpenAI service
    const openaiService = OpenAIService.getInstance();

    // Fetch user assistants
    const userComposer = await prisma.userAssistant.findFirst({
      where: {
        userId,
        assistantName: `Composer_${userId}`
      }
    });

    const userJobRanker = await prisma.userAssistant.findFirst({
      where: {
        userId,
        assistantName: `JobRanker_${userId}`
      }
    });

    if (!userComposer) {
      console.warn(`No composer assistant found for user ${userId}`);
    }

    const data = await request.json()
    console.log('Received data for update:', data);

    // First update the user's name
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
      }
    })

    // Update composer assistant if it exists
    if (userComposer && data.composerPrompt) {
      try {
        // Update the OpenAI assistant first (source of truth)
        await openaiService.updateComposerAssistant(userId, userComposer.assistantId, data.composerPrompt);
        
        // Then update local DB
        await prisma.userAssistant.update({
          where: { id: userComposer.id },
          data: { systemPrompt: data.composerPrompt }
        });
      } catch (error) {
        console.error('Error updating composer assistant in OpenAI:', error);
        
        // Fall back to just updating local database
        await prisma.userAssistant.update({
          where: { id: userComposer.id },
          data: { systemPrompt: data.composerPrompt }
        });
      }
    }

    // Update job ranker prompt
    if (data.jobRankerPrompt) {
      try {
        // If we have a job ranker assistant, update it in OpenAI first
        if (userJobRanker) {
          // Update the OpenAI JobRanker assistant
          await openaiService.openai.beta.assistants.update(
            userJobRanker.assistantId,
            { instructions: data.jobRankerPrompt }
          );
        }
        
        // Then update in local database
        await updateJobRankerPrompt(userId, data.jobRankerPrompt);
      } catch (error) {
        console.error('Error updating job ranker in OpenAI:', error);
        
        // Fall back to just updating local database
        await updateJobRankerPrompt(userId, data.jobRankerPrompt);
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

// Helper function to update job ranker prompt
async function updateJobRankerPrompt(userId: string, prompt: string): Promise<void> {
  try {
    // First try to update UserProfile if it exists
    const profile = await prisma.$queryRaw`
      SELECT id FROM "UserProfile" WHERE "userId" = ${userId} LIMIT 1
    `;

    if (profile && Array.isArray(profile) && profile.length > 0) {
      // Update existing profile
      await prisma.$executeRaw`
        UPDATE "UserProfile" SET "jobRankerPrompt" = ${prompt} WHERE id = ${profile[0].id}
      `;
    } else {
      // Create new profile
      await prisma.$executeRaw`
        INSERT INTO "UserProfile" (id, "userId", "jobRankerPrompt", "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), ${userId}, ${prompt}, NOW(), NOW())
      `;
    }

    // Also update or create JobRanker assistant
    const jobRanker = await prisma.userAssistant.findFirst({
      where: {
        userId,
        assistantName: `JobRanker_${userId}`
      }
    });

    if (jobRanker) {
      await prisma.userAssistant.update({
        where: { id: jobRanker.id },
        data: { systemPrompt: prompt }
      });
    } else {
      // Create job ranker assistant if it doesn't exist
      await prisma.userAssistant.create({
        data: {
          userId,
          assistantId: '', // Required field but will be populated later
          assistantName: `JobRanker_${userId}`,
          systemPrompt: prompt
        }
      });
    }
  } catch (error) {
    console.error('Error updating job ranker prompt:', error);
    throw error;
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Check if the document belongs to the user
    const document = await prisma.userDocument.findUnique({
      where: {
        id: documentId,
        userId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete the document
    await prisma.userDocument.delete({
      where: {
        id: documentId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
