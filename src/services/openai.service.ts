import OpenAI from 'openai';
import fs from "fs";
import { config } from '@/lib/config';
import { Job } from '@/lib/types/shared';
import { z } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";
import { GoogleDocsService } from './google-docs.service';
import { prisma } from '@/lib/prisma';

interface Assistant {
  id: string;
  name: string;
  description: string;
}

interface JobRanking {
  ranking: "bingo" | "good" | "okay" | "bad";
  canton: string;
}

const jobRankingSchema = z.object({
  ranking: z.string(),
  canton: z.string(),
});

const MAX_COMPLETION_ATTEMPTS = 30;
const COMPLETION_CHECK_INTERVAL = 1000; // 1 second

interface ProgressUpdate {
  progress: number;
  status: string;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });

  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  public async uploadDocuments(userId: string, files: File[], vectorStoreId?: string): Promise<string[]> {
    try {
      const uploadedFiles = [];

      // Upload files sequentially for safety
      for (const file of files) {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), file.name);
        formData.append('purpose', 'assistants');

        const response = await fetch('https://api.openai.com/v1/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openai.apiKey}`,
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload file: ${file.name}`);
        }

        const result = await response.json();
        uploadedFiles.push(result);
      }

      // Store their OpenAI file IDs
      const fileIds = uploadedFiles.map(file => file.id);

      // Update or create our vector store record in the database
      if (vectorStoreId) {
        await prisma.userVectorStore.upsert({
          where: { id: vectorStoreId },
          create: {
            userId,
            vectorStoreId,
            fileIds,
          },
          update: {
            fileIds: {
              push: fileIds
            },
          },
        });
      }

      // Check if the user already has a "job-composer" assistant
      const userAssistant = await prisma.userAssistant.findUnique({
        where: {
          userId_assistantName: {
            userId,
            assistantName: `Composer_${userId}`
          }
        }
      });

      // If not found, create it; else update the same assistant
      if (!userAssistant) {
        const newAssistant = await this.createComposerAssistant(userId, fileIds);
        await prisma.userAssistant.create({
          data: {
            userId,
            assistantId: newAssistant.id,
            assistantName: `Composer_${userId}`,
            systemPrompt: 'System prompt for composing job applications',
          },
        });
      } else {
        // Update existing assistant with new files
        await this.openai.beta.assistants.update(userAssistant.assistantId, {
          tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
        });
        await this.openai.beta.vectorStores.fileBatches.create(vectorStoreId, {
          file_ids: fileIds,
        });
      }

      // Store each document in your DB
      for (let i = 0; i < files.length; i++) {
        await prisma.userDocument.create({
          data: {
            userId,
            name: files[i].name,
            fileId: fileIds[i],
          },
        });
      }

      return fileIds;
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  public async createComposerAssistant(userId: string, vectorStoreId: string, fileIds?: string[]): Promise<Assistant> {
    // 1) Retrieve or create the user's vector store
    // const vectorStore = await prisma.userVectorStore.findFirst({ where: { userId } });

    // 2) Create a new assistant pointing to that vector store
    const assistant = await this.openai.beta.assistants.create({
      name: `Composer_${userId}`,
      description: "Personalized assistant for cover letter generation",
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
      instructions: `Erstelle ein prägnantes Bewerbungsschreiben auf Deutsch oder in der Sprache des Stelleninserats basierend auf den bereitgestellten Dokumenten. 
      Betone wichtige Punkte der Aufgaben und Anforderungen der Position und begründe deine Aussagen stilvoll und wahrheitsgetreu unter Verwendung meiner Referenzen und Erfahrungen. 
      Die Anforderungen im Inserat sind nach Wichtigkeit für die Position geordnet. Generiere nur den Hauptteil des Schreibens. Wichtig: Verwende "ss" anstatt ß.`,
    });

    console.log("Created assistant", assistant);

    return {
      id: assistant.id,
      name: assistant.name,
      description: assistant.description ?? "",
      instructions: assistant.instructions ?? "",
    };
  }

  public async createJobRankingAssistant(userId: string): Promise<string> {
    try {
      // Create ranker assistant on OpenAI
      const assistant = await this.openai.beta.assistants.create({
        name: `JobRanker_${userId}`,
        description: 'Assistant for ranking jobs',
        model: 'gpt-4o-mini',
        instructions: `Analysiere die folgende Stellenanzeige und berechne Punkte basierend auf den folgenden Kriterien.

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
(-1) Punkt für jedes Jahr Berufserfahrung in einem Bereich, der nicht oben genannt ist (z.B. (-4) wenn 4 Jahre Erfahrung erfordert) oder (-3) wenn "mehrjährige" Erfahrung

Antworte NUR mit einem JSON-Objekt ohne Markdown-Formatierung wie:
{"ranking": "bingo", "canton": "ZH"}

Wobei:
- ranking: einer von "bingo", "good", "okay" oder "bad" ist, abhängig von der Punktezahl
- canton: der Schweizer Kanton, in dem der Job angeboten wird (z.B. ZH, BE, usw.)

Bemerkung: Keine Jobs von Stellenvermittler und Temporärbüros. Keine Praktikum oder Lehrstellen`,
      });
      
      console.log(`Created new job ranking assistant: ${assistant.id}`);
      
      // Store in database
      await prisma.userAssistant.upsert({
        where: {
          userId_assistantName: {
            userId,
            assistantName: `JobRanker_${userId}`
          }
        },
        create: {
          userId,
          assistantId: assistant.id,
          assistantName: `JobRanker_${userId}`,
          systemPrompt: assistant.instructions || '',
        },
        update: {
          assistantId: assistant.id,
          systemPrompt: assistant.instructions || '',
        },
      });
      
      // Return just the ID
      return assistant.id;
    } catch (error) {
      console.error("Error creating job ranker assistant:", error);
      throw error;
    }
  }

  public async createUserVectorStore(userId: string): Promise<{ id: string }> {
    // Example: create a vector store on OpenAI
    const vectorStore = await this.openai.beta.vectorStores.create({
      name: `VectorStore_${userId}`,
      // Possibly specify other configs
    });
    console.log("Created vector store", vectorStore);
    return { id: vectorStore.id };
  }

  public async updateJobRankingAssistant(userId: string, assistantId: string, jobRankerPrompt: string): Promise<void> {
    try {
      // Create or update the job ranking assistant
      const assistant = await this.openai.beta.assistants.update(
        assistantId,
        {
          instructions: jobRankerPrompt,
        }
      );

      // Store in database
      await prisma.userAssistant.upsert({
        where: {
          userId_assistantName: {
            userId,
            assistantName: `JobRanker_${userId}`
          }
        },
        create: {
          userId,
          assistantId: assistant.id,
          assistantName: `JobRanker_${userId}`,
          systemPrompt: jobRankerPrompt,
        },
        update: {
          assistantId: assistant.id,
          systemPrompt: jobRankerPrompt,
        },
      });
    } catch (error) {
      console.error('Error updating job ranking assistant:', error);
      throw error;
    }
  }

  public async updateComposerAssistant(userId: string, assistantId: string, composerPrompt: string): Promise<void> {
    try {
      // Create or update the job composer assistant
      const assistant = await this.openai.beta.assistants.update(
        assistantId,
        {
          instructions: composerPrompt,
        }
      );

      // Store in database
      await prisma.userAssistant.upsert({
        where: {
          userId_assistantName: {
            userId,
            assistantName: `Composer_${userId}`
          }
        },
        create: {
          userId,
          assistantId: assistant.id,
          assistantName: `Composer_${userId}`,
          systemPrompt: composerPrompt,
        },
        update: {
          assistantId: assistant.id,
          systemPrompt: composerPrompt,
        },
      });
    } catch (error) {
      console.error('Error updating job composer assistant:', error);
      throw error;
    }
  }

  public async generateCoverLetter(
    userId: string,
    job: Job,
    onProgress?: (update: ProgressUpdate) => void,
    notes?: string
  ): Promise<{ content: string; docs_url: string }> {
    try {
      // Get user's assistant
      const assistant = await prisma.userAssistant.findFirst({
        where: {
          userId,
          assistantName: `Composer_${userId}`
        }
      });

      if (!assistant) {
        throw new Error('No cover letter assistant found for user');
      }

      onProgress?.({ progress: 20, status: 'Creating thread...' });
      const thread = await this.openai.beta.threads.create();

      onProgress?.({ progress: 40, status: 'Adding message to thread...' });
      await this.openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Inserat: ${job.description}\nWichtige Anmerkungen: ${notes}`
      });

      onProgress?.({ progress: 50, status: 'Starting assistant run...' });
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.assistantId,
      });

      onProgress?.({ progress: 60, status: 'Waiting for completion...' });
      const runStatus = await this.waitForCompletion(thread.id, run.id);

      if (runStatus.status !== 'completed') {
        throw new Error('Generation timeout or failed');
      }

      onProgress?.({ progress: 70, status: 'Retrieving response...' });
      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const content = messages.data[0].content[0];

      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Clean the text by removing file reference indicators
      const cleanedText = content.text.value
        .replace(/【.*?】/g, '') // Remove file reference indicators
        .replace(/ß/g, 'ss');   // Replace 'ß' with 'ss'

      onProgress?.({ progress: 90, status: 'Creating Google Doc...' });
      const googleDocsService = GoogleDocsService.getInstance();
      const docs_url = await googleDocsService.createCoverLetterDoc(cleanedText, job);

      onProgress?.({ progress: 100, status: 'Cover letter generation completed successfully' });
      return { content: cleanedText, docs_url };
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      throw error;
    }
  }

  public async rankJob(job: Job, userId: string): Promise<JobRanking> {
    try {
      const assistant = await prisma.userAssistant.findFirst({
        where: {
          userId,
          assistantName: `JobRanker_${userId}`
        }
      });

      if (!assistant) {
        throw new Error('No job ranking assistant found for user');
      }

      console.log(`Using assistant: ${assistant.assistantName} with ID: ${assistant.assistantId}`);
      
      // Verify that the assistant exists
      try {
        await this.openai.beta.assistants.retrieve(assistant.assistantId);
      } catch (error) {
        console.error(`Failed to retrieve assistant: ${assistant.assistantId}`, error);
        // Fall back to creating a new assistant
        const newAssistant = await this.createJobRankingAssistant(userId);
        console.log(`Created new assistant with ID: ${newAssistant}`);
        
        // Update the assistant ID in the database
        await prisma.userAssistant.update({
          where: { id: assistant.id },
          data: { assistantId: newAssistant }
        });
        
        assistant.assistantId = newAssistant;
      }

      // Format the job information
      const jobInfo = `
Titel: ${job.title || 'Keine Angabe'}
Firma: ${job.company || 'Keine Angabe'}
Ort: ${job.location || 'Keine Angabe'}
Arbeitspensum: ${job.workload || 'Keine Angabe'}
Veröffentlicht: ${job.published ? new Date(job.published).toLocaleDateString() : 'Keine Angabe'}

Beschreibung: 
${job.description || 'Keine Beschreibung verfügbar'}
`;

      console.log(`Creating thread for job: ${job.title}`);
      const thread = await this.openai.beta.threads.create();
      await this.openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: jobInfo
      });

      console.log(`Starting run with assistant ID: ${assistant.assistantId}`);
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.assistantId,
      });
      console.log(`Run created with ID: ${run.id}, status: ${run.status}`);

      console.log(`Waiting for completion of run ${run.id}...`);
      const runStatus = await this.waitForCompletion(thread.id, run.id);
      console.log(`Run completed with status: ${runStatus.status}`);

      if (runStatus.status !== "completed") throw new Error("Job ranking not completed");
      
      console.log(`Retrieving messages from thread ${thread.id}...`);
      const messages = await this.openai.beta.threads.messages.list(thread.id);
      console.log(`Retrieved ${messages.data.length} messages`);
      
      if (messages.data.length === 0) {
        console.error("No messages found in thread");
        throw new Error("No response received from assistant");
      }
      
      const message = messages.data[0];
      console.log(`Message role: ${message.role}, created at: ${message.created_at}`);
      
      if (message.content.length === 0) {
        console.error("Message has no content");
        throw new Error("Empty response from assistant");
      }
      
      const content = message.content[0];
      console.log(`Content type: ${content.type}`);
      
      if (content.type !== "text") throw new Error("Unexpected response type");

      try {
        // Log the raw response
        console.log(`Raw assistant response: ${content.text.value}`);
        
        // First try to clean the response by removing any markdown code blocks
        let responseText = content.text.value;
        responseText = responseText.replace(/```json\s*|\s*```/g, '');
        responseText = responseText.trim();
        
        console.log(`Cleaned response text: ${responseText}`);
        
        // Then parse it as JSON
        let json;
        try {
          json = JSON.parse(responseText);
          console.log(`Parsed JSON:`, json);
        } catch (parseError) {
          console.error(`JSON parse error:`, parseError);
          
          // Try to extract JSON using regex if parsing fails
          const jsonRegex = /\{.*\}/s;
          const match = responseText.match(jsonRegex);
          if (match) {
            console.log(`Trying to parse extracted JSON: ${match[0]}`);
            json = JSON.parse(match[0]);
            console.log(`Parsed extracted JSON:`, json);
          } else {
            throw parseError;
          }
        }
        
        // Validate the JSON structure
        const result = jobRankingSchema.parse(json) as JobRanking;
        console.log(`Final validated result:`, result);
        return result;
      } catch (error) {
        console.error("Failed to parse ranking response:", error);
        console.error("Original response:", content.text.value);
        
        // Try to extract ranking and canton directly with regex as last resort
        try {
          const rankingMatch = content.text.value.match(/ranking["']?\s*:\s*["']?(bingo|good|okay|bad)["']?/i);
          const cantonMatch = content.text.value.match(/canton["']?\s*:\s*["']?([A-Z]{2}|N\/A)["']?/i);
          
          if (rankingMatch && cantonMatch) {
            console.log(`Extracted with regex - Ranking: ${rankingMatch[1]}, Canton: ${cantonMatch[1]}`);
            return {
              ranking: rankingMatch[1].toLowerCase() as "bingo" | "good" | "okay" | "bad",
              canton: cantonMatch[1]
            };
          }
        } catch (regexError) {
          console.error("Regex extraction failed:", regexError);
        }
        
        // Return a default ranking when all parsing methods fail
        return { ranking: "okay", canton: "N/A" };
      }
    } catch (error) {
      console.error("Error in rankJob:", error);
      // Provide a fallback ranking rather than crashing
      return { ranking: "okay", canton: "N/A" };
    }
  }

  private async waitForCompletion(threadId: string, runId: string) {
    let attempts = 0;
    let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);

    while (runStatus.status !== 'completed' && attempts < MAX_COMPLETION_ATTEMPTS) {
      console.log(`Status: ${runStatus.status}, attempt ${attempts + 1}/${MAX_COMPLETION_ATTEMPTS}`);
      
      // Check for failed or cancelled status
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error(`Run failed with status: ${runStatus.status}`);
        console.error('Error details:', runStatus.last_error);
        throw new Error(`Generation ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`);
      }
      
      // Check for requiring action (function calling)
      if (runStatus.status === 'requires_action') {
        console.log('Run requires action:', runStatus.required_action);
        // We don't have function calls implemented, so we'll cancel the run
        await this.openai.beta.threads.runs.cancel(threadId, runId);
        throw new Error('Function calling not implemented');
      }
      
      await new Promise(resolve => setTimeout(resolve, COMPLETION_CHECK_INTERVAL));
      runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    if (attempts >= MAX_COMPLETION_ATTEMPTS) {
      console.error('Generation timeout reached');
      // Try to cancel the run before throwing
      try {
        await this.openai.beta.threads.runs.cancel(threadId, runId);
      } catch (e) {
        console.error('Failed to cancel run:', e);
      }
      throw new Error('Generation timeout');
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Run not completed, final status: ${runStatus.status}`);
    }

    return runStatus;
  }

  public async deleteAssistant(assistantId: string): Promise<void> {
    try {
      await this.openai.beta.assistants.del(assistantId);
    } catch (error) {
      console.error('Error deleting OpenAI assistant:', error);
      throw error;
    }
  }

} 
