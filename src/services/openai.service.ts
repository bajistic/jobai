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

interface Assistants {
  composer: Assistant;
  ranker: Assistant;
}

interface JobRanking {
  ranking: "bingo" | "good" | "okay" | "bad";
  canton: string;
}

const jobRankingSchema = z.object({
  ranking: z.string(),
  canton: z.string(),
});

const ASSISTANT_ID = "asst_ycM57UoS5QGUBoSxepUAXvsJ"; // Cover Letter Composer ID
const MAX_COMPLETION_ATTEMPTS = 30;
const COMPLETION_CHECK_INTERVAL = 1000; // 1 second

interface ProgressUpdate {
  progress: number;
  status: string;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI;
  private assistants: Assistants;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    
    this.assistants = {
      composer: {
        id: "asst_ycM57UoS5QGUBoSxepUAXvsJ",
        name: "Cover Letter Composer",
        description: "Generates cover letters based on job descriptions"
      },
      ranker: {
        id: "asst_lRapp9wkqB88a3HAZO8ahcV9", // Replace with your actual ranker assistant ID
        name: "Job Ranker",
        description: "Ranks jobs based on criteria"
      }
    };
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  public async uploadDocuments(userId: string, files: File[]): Promise<string[]> {
    try {
      // Upload files to OpenAI one at a time
      const uploadedFiles = [];
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

      const fileIds = uploadedFiles.map(file => file.id);
      console.log("File IDs:", fileIds);

      // Create or update vector store
      // TODO: Add fileIds to vector store
      // const vectorStore = await this.openai.beta.vectorStores.create({
      //   name: `VectorStore_${userId}`,
      //   file_ids: fileIds,
      // });


      // Create or update vector store
      const vectorStorePrisma = await prisma.userVectorStore.upsert({
        where: { id: `vs_${userId}` },
        create: {
          userId,
          vectorStoreId: `vs_${userId}`,
          fileIds,
        },
        update: {
          fileIds,
        },
      });

      // Create or update the cover letter assistant
      const assistant = await this.createCoverLetterAssistant(userId, fileIds);

      // Store in database
      await prisma.userAssistant.upsert({
        where: { userId },
        create: {
          userId,
          assistantId: assistant.id,
          assistantName: "Cover Letter Assistant",
          systemPrompt: "You are a professional cover letter writer. Use the provided documents to personalize cover letters.",
        },
        update: {
          assistantId: assistant.id,
        },
      });

      // Store document records
      await Promise.all(
        files.map((file, index) =>
          prisma.userDocument.create({
            data: {
              userId,
              name: file.name,
              fileId: fileIds[index],
            },
          })
        )
      );

      return fileIds;
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  private async createCoverLetterAssistant(userId: string, fileIds: string[]): Promise<Assistant> {
    const assistant = await this.openai.beta.assistants.create({
      name: `${userId}'s Cover Letter Assistant`,
      description: "Personalized assistant for cover letter generation",
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      instructions: `You are a professional cover letter writer. Use the provided documents to create personalized cover letters.
        Always maintain a professional tone and highlight relevant experiences from the documents.`
    });

    return {
      id: assistant.id,
      name: assistant.name,
      description: assistant.description
    };
  }

  public async updateJobRankingAssistant(userId: string, jobFilterPrompt: string): Promise<void> {
    try {
      // Create or update the job ranking assistant
      const assistant = await this.openai.beta.assistants.create({
        name: `${userId}'s Job Ranker`,
        description: "Personalized assistant for job ranking",
        model: "gpt-4o-mini",
        instructions: jobFilterPrompt,
        tools: [{ type: "file_search" }],
      });
      console.log("Created assistant", assistant);

      // Store in database
      await prisma.userAssistant.upsert({
        where: { 
          userId_assistantName: {
            userId,
            assistantName: "Job Ranker"
          }
        },
        create: {
          userId,
          assistantId: assistant.id,
          assistantName: "Job Ranker",
          systemPrompt: jobFilterPrompt,
        },
        update: {
          assistantId: assistant.id,
          systemPrompt: jobFilterPrompt,
        },
      });
    } catch (error) {
      console.error('Error updating job ranking assistant:', error);
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
          assistantName: "Cover Letter Assistant"
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
        content: `Inserat: ${job.description}\nAnmerkungen: ${notes}`
      });

      onProgress?.({ progress: 60, status: 'Starting assistant run...' });
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.assistantId,
      });

      onProgress?.({ progress: 70, status: 'Waiting for completion...' });
      const runStatus = await this.waitForCompletion(thread.id, run.id);

      if (runStatus.status !== 'completed') {
        throw new Error('Generation timeout or failed');
      }

      onProgress?.({ progress: 80, status: 'Retrieving response...' });
      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const content = messages.data[0].content[0];
      
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      onProgress?.({ progress: 90, status: 'Creating Google Doc...' });
      const googleDocsService = GoogleDocsService.getInstance();
      const docs_url = await googleDocsService.createCoverLetterDoc(content.text.value, job);

      onProgress?.({ progress: 100, status: 'Cover letter generation completed successfully' });
      return { content: content.text.value, docs_url };
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      throw error;
    }
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
} 