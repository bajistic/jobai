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

  public async createJobRankerAssistant(userId: string): Promise<{ id: string; name: string; description: string }> {
    // Create ranker assistant on OpenAI
    const assistant = await this.openai.beta.assistants.create({
      name: `JobRanker_${userId}`,
      description: 'Assistant for ranking jobs',
      model: 'gpt-4o-mini',
    });
    // Return the newly created OpenAI assistant metadata
    return {
      id: assistant.id,
      name: assistant.name,
      description: assistant.description || '',
    };
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
    const assistant = await prisma.userAssistant.findFirst({
      where: { 
        userId,
        assistantName: `JobRanker_${userId}`
      }
    });

    if (!assistant) {
      throw new Error('No job ranking assistant found for user');
    }

    const thread = await this.openai.beta.threads.create();
    await this.openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Inserat: ${job.description}`
    });

    const run = await this.openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.assistantId,
    });

    const runStatus = await this.waitForCompletion(thread.id, run.id);

    if (runStatus.status !== "completed") throw new Error("Job ranking not completed");
    const messages = await this.openai.beta.threads.messages.list(thread.id);
    const content = messages.data[0].content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const json = JSON.parse(content.text.value);
    return jobRankingSchema.parse(json) as JobRanking;
  }

  private async waitForCompletion(threadId: string, runId: string) {
    let attempts = 0;
    let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);

    while (runStatus.status !== 'completed' && attempts < MAX_COMPLETION_ATTEMPTS) {
      console.log(`Status: ${runStatus.status}, attempt ${attempts + 1}/${MAX_COMPLETION_ATTEMPTS}`);
      await new Promise(resolve => setTimeout(resolve, COMPLETION_CHECK_INTERVAL));
      runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    if (attempts >= MAX_COMPLETION_ATTEMPTS) {
      console.error('Generation timeout reached');
      throw new Error('Generation timeout');
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