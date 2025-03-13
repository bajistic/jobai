import OpenAI from 'openai';
import fs from "fs";
import { config } from '@/lib/config';
import { Job } from '@/lib/types/shared';
import { z } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";
import { GoogleDocsService } from './google-docs.service';
import { prisma } from '@/lib/prisma';

// Feature flag for using the new job filtering approach
export const USE_OPTIMIZED_JOB_FILTERING = process.env.USE_OPTIMIZED_JOB_FILTERING === 'true';

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

interface JobScore {
  entryLevel: number;
  requiresDegree: number;
  requiresExperience: number;
  salesRole: number;
  techRole: number;
  designRole: number;
  customerServiceRole: number;
  officeSupportRole: number;
  financialRole: number;
  healthcareRole: number;
  skillMatch: number;
  remoteWork: number;
  partTime: number;
  salary: number;
  [key: string]: number; // Allow custom criteria
}

interface JobAnalysis {
  scores: JobScore;
  tags: string[];
  canton: string;
}

const jobAnalysisSchema = z.object({
  scores: z.record(z.number()),
  tags: z.array(z.string()),
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
  
  public async createJobRankingAssistant(userId: string): Promise<Assistant> {
    try {
      // Create a new assistant for job ranking
      const assistant = await this.openai.beta.assistants.create({
        name: `JobRanker_${userId}`,
        description: "Assistant for ranking job listings",
        model: "gpt-4o-mini",
        instructions: `Analysiere Stellenanzeigen und bewerte sie basierend auf den Benutzerkriterien. 
        Gib eine Bewertung als "bingo", "good", "okay" oder "bad" zurück, sowie den Schweizer Kanton.`,
      });
  
      console.log("Created job ranking assistant", assistant);
  
      // Store in database
      await prisma.userAssistant.create({
        data: {
          userId,
          assistantId: assistant.id,
          assistantName: `JobRanker_${userId}`,
          systemPrompt: assistant.instructions || '',
        },
      });
  
      return {
        id: assistant.id,
        name: assistant.name,
        description: assistant.description ?? "",
        instructions: assistant.instructions ?? "",
      };
    } catch (error) {
      console.error('Error creating job ranking assistant:', error);
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

  public async updateJobRankingPrompt(userId: string, jobRankerPrompt: string): Promise<void> {
    try {
      // Update the user's job ranking prompt in the database
      await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          jobRankerPrompt,
        },
        update: {
          jobRankerPrompt,
        },
      });

      console.log(`Updated job ranking prompt for user ${userId}`);
    } catch (error) {
      console.error('Error updating job ranking prompt:', error);
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

  // Already implemented as updateJobRankingPrompt

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

  /**
   * Fast version of rankJob that uses a preconfigured prompt
   * to avoid looking up user preferences
   */
  public async rankJobWithAssistant(job: Job, prompt: string): Promise<JobRanking> {
    try {
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

      // Directly use the OpenAI chat completions API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: jobInfo
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent responses
        response_format: { type: 'json_object' }
      });

      // Get the response content
      const responseContent = response.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error("Empty response from OpenAI");
      }

      // Parse the JSON response
      try {
        const json = JSON.parse(responseContent);
        return jobRankingSchema.parse(json) as JobRanking;
      } catch (error) {
        console.error("Failed to parse response:", error);
        return { ranking: "okay", canton: "N/A" };
      }
    } catch (error) {
      console.error("Error in rankJobWithAssistant:", error);
      return { ranking: "okay", canton: "N/A" };
    }
  }

  public async rankJob(job: Job, userId: string): Promise<JobRanking> {
    try {
      // Get user's job ranking prompt or use the default
      const userSettings = await prisma.userProfile.findUnique({
        where: { userId }
      });

      // Get the ranking prompt (either from user settings or use default)
      const rankingPrompt = userSettings?.jobRankerPrompt || `Analysiere die folgende Stellenanzeige und berechne Punkte basierend auf den folgenden Kriterien.

Pluspunkte:
(+4) Einstiegsstelle in jedem Bereich (Einsteiger, Quereinsteiger)
(+4) Kaufmännische Lehre (Kaufmann EFZ, KV), oder lediglich Berufslehre/Grundbildung erfordert
(+4) Kassenwesen und Kundendienst
(+4) Immobilienbewirtschafter, SVIT
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

Bemerkung: Keine Jobs von Stellenvermittler und Temporärbüros. Keine Praktikum oder Lehrstellen`;

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

      console.log(`Ranking job: ${job.title}`);

      // Directly use the OpenAI chat completions API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: rankingPrompt
          },
          {
            role: 'user',
            content: jobInfo
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent responses
        response_format: { type: 'json_object' }
      });

      // Get the response content
      const responseContent = response.choices[0]?.message?.content;
      console.log(`Response: ${responseContent}`);

      if (!responseContent) {
        throw new Error("Empty response from OpenAI");
      }

      try {
        // Parse the JSON response
        const json = JSON.parse(responseContent);
        console.log(`Parsed result:`, json);

        // Validate the JSON structure
        const result = jobRankingSchema.parse(json) as JobRanking;
        return result;
      } catch (error) {
        console.error("Failed to parse ranking response:", error);
        console.error("Original response:", responseContent);

        // Try to extract ranking and canton directly with regex as last resort
        try {
          const rankingMatch = responseContent.match(/ranking["']?\s*:\s*["']?(bingo|good|okay|bad)["']?/i);
          const cantonMatch = responseContent.match(/canton["']?\s*:\s*["']?([A-Z]{2}|N\/A)["']?/i);

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
  
  /**
   * Comprehensive daily job analysis that evaluates jobs against a wide range of criteria
   * This runs once per day for all jobs and stores the results in the database
   */
  public async analyzeJob(job: Job): Promise<JobAnalysis> {
    try {
      // Create a comprehensive prompt for job analysis
      const analysisPrompt = `
Analyze this job listing against a comprehensive set of criteria and return detailed scores and tags.

Step 1: Analyze the job description for key traits, requirements, and benefits.
Step 2: Score the job on a scale from -5 to +5 for each criterion below, where:
  - Positive scores indicate the job has this desirable trait
  - Negative scores indicate the job has an undesirable trait
  - Zero means neutral or not applicable

Step 3: Generate a list of descriptive tags for categorizing the job

Return ONLY a JSON object with the following structure:
{
  "scores": {
    "entryLevel": Number,           // How suitable for entry-level candidates (higher is better)
    "requiresDegree": Number,       // Degree requirements (negative if required)
    "requiresExperience": Number,   // Experience requirements (negative for high requirements)
    "salesRole": Number,            // How sales-focused the role is
    "techRole": Number,             // How technical/IT-focused the role is
    "designRole": Number,           // How design/creative-focused the role is
    "customerServiceRole": Number,  // How customer-service oriented the role is
    "officeSupportRole": Number,    // How administrative/support-oriented the role is
    "financialRole": Number,        // How finance/accounting-focused the role is
    "healthcareRole": Number,       // How healthcare-related the role is
    "skillMatch": Number,           // General skill match for common job seekers
    "remoteWork": Number,           // Remote work opportunities (positive if available)
    "partTime": Number,             // Part-time opportunities (positive if available)
    "salary": Number                // Salary attractiveness (if mentioned)
  },
  "tags": [String],                 // Array of descriptive tags (e.g., "remote", "entry-level", "tech", etc.)
  "canton": String                  // Swiss canton where the job is located (e.g., "ZH", "BE", etc.)
}`;

      // Format the job information
      const jobInfo = `
Title: ${job.title || 'Keine Angabe'}
Company: ${job.company || 'Keine Angabe'}
Location: ${job.location || 'Keine Angabe'}
Workload: ${job.workload || 'Keine Angabe'}
Published: ${job.published ? new Date(job.published).toLocaleDateString() : 'Keine Angabe'}

Description: 
${job.description || 'Keine Beschreibung verfügbar'}
`;

      console.log(`Analyzing job: ${job.title}`);
      
      // Use OpenAI chat completions API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using the same model as the existing rankJob for consistency
        messages: [
          {
            role: 'system',
            content: analysisPrompt
          },
          {
            role: 'user',
            content: jobInfo
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent responses
        response_format: { type: 'json_object' }
      });

      // Get the response content
      const responseContent = response.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error("Empty response from OpenAI");
      }

      try {
        // Parse the JSON response
        const json = JSON.parse(responseContent);
        console.log(`Parsed analysis result:`, json);
        
        // Validate the JSON structure
        const result = jobAnalysisSchema.parse(json) as JobAnalysis;
        return result;
      } catch (error) {
        console.error("Failed to parse job analysis response:", error);
        console.error("Original response:", responseContent);
        
        // Return a default analysis as fallback
        return {
          scores: {
            entryLevel: 0,
            requiresDegree: 0,
            requiresExperience: 0,
            salesRole: 0,
            techRole: 0,
            designRole: 0,
            customerServiceRole: 0,
            officeSupportRole: 0,
            financialRole: 0,
            healthcareRole: 0,
            skillMatch: 0,
            remoteWork: 0,
            partTime: 0,
            salary: 0
          },
          tags: [],
          canton: job.canton || "N/A"
        };
      }
    } catch (error) {
      console.error("Error in analyzeJob:", error);
      // Provide a fallback analysis rather than crashing
      return {
        scores: {
          entryLevel: 0,
          requiresDegree: 0,
          requiresExperience: 0,
          salesRole: 0,
          techRole: 0,
          designRole: 0,
          customerServiceRole: 0,
          officeSupportRole: 0,
          financialRole: 0,
          healthcareRole: 0,
          skillMatch: 0,
          remoteWork: 0,
          partTime: 0,
          salary: 0
        },
        tags: [],
        canton: job.canton || "N/A"
      };
    }
  }

  /**
   * Batch processes multiple jobs for daily analysis
   * This function should be run once per day via a scheduled task
   */
  public async filterJobsOnceDaily(limit: number = 100): Promise<number> {
    console.log(`Starting daily job filtering for ${limit} jobs`);
    
    // Get jobs that haven't been analyzed recently or at all
    // Order by published date to prioritize newer jobs
    const jobs = await prisma.jobs.findMany({
      where: {
        OR: [
          { last_analyzed: null },
          { last_analyzed: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Older than 24 hours
        ]
      },
      orderBy: { published: 'desc' },
      take: limit
    });
    
    console.log(`Found ${jobs.length} jobs to analyze`);
    
    // Process each job and update in database
    let processedCount = 0;
    
    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id}: ${job.title}`);
        
        // Analyze the job
        const analysis = await this.analyzeJob(job as unknown as Job);
        
        // Update the job record with scores, tags, and analysis date
        await prisma.jobs.update({
          where: { id: job.id },
          data: {
            scores: analysis.scores,
            tags: analysis.tags,
            canton: analysis.canton || job.canton,
            last_analyzed: new Date()
          }
        });
        
        processedCount++;
        console.log(`Successfully processed job ${job.id}`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        // Continue with next job
      }
    }
    
    console.log(`Completed daily job filtering. Processed ${processedCount} jobs`);
    return processedCount;
  }

  /**
   * Personalizes job recommendations locally based on pre-computed scores and user preferences
   */
  public async getPersonalizedJobs(userId: string, page: number = 1, pageSize: number = 20): Promise<{ jobs: any[], total: number }> {
    try {
      // Get user's preferences from their job ranker prompt
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      
      // Extract preference weights from the user's job ranker prompt
      const weights = this.extractUserPreferenceWeights(userProfile?.jobRankerPrompt);
      
      // Define a base query for jobs with pre-computed scores
      const baseQuery = {
        where: {
          scores: { not: null },
          job_preferences: {
            none: {
              user_id: userId,
              is_hidden: true,
            }
          }
        }
      };
      
      // Count total jobs matching the criteria
      const totalJobs = await prisma.jobs.count(baseQuery);
      
      // Fetch the jobs with their scores
      const jobs = await prisma.jobs.findMany({
        ...baseQuery,
        include: {
          job_preferences: {
            where: {
              user_id: userId
            }
          }
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      
      // Calculate personalized score for each job and sort
      const personalizedJobs = jobs.map(job => {
        const personalizedScore = this.calculatePersonalizedScore(job, weights);
        return {
          ...job,
          personalizedScore
        };
      }).sort((a, b) => b.personalizedScore - a.personalizedScore);
      
      return {
        jobs: personalizedJobs,
        total: totalJobs
      };
    } catch (error) {
      console.error("Error in getPersonalizedJobs:", error);
      throw error;
    }
  }

  /**
   * Extracts preference weights from a user's job ranker prompt
   * This parses the prompt to identify what criteria the user cares about
   */
  private extractUserPreferenceWeights(jobRankerPrompt?: string): Record<string, number> {
    if (!jobRankerPrompt) {
      // Default weights if no prompt is provided
      return {
        entryLevel: 1,
        requiresDegree: -1,
        requiresExperience: -1,
        techRole: 0.5,
        designRole: 0.5,
        customerServiceRole: 0.5,
        officeSupportRole: 0.5,
        skillMatch: 1,
        remoteWork: 0.5
      };
    }

    const weights: Record<string, number> = {
      // Initialize with default weights
      entryLevel: 0,
      requiresDegree: 0,
      requiresExperience: 0,
      salesRole: 0,
      techRole: 0,
      designRole: 0,
      customerServiceRole: 0,
      officeSupportRole: 0,
      financialRole: 0,
      healthcareRole: 0,
      skillMatch: 0,
      remoteWork: 0,
      partTime: 0,
      salary: 0
    };

    // Helper function to extract points from prompt
    const extractPoints = (regex: RegExp, criterionKey: string): void => {
      const match = jobRankerPrompt.match(regex);
      if (match && match[1]) {
        const points = parseFloat(match[1]);
        if (!isNaN(points)) {
          weights[criterionKey] = points;
        }
      }
    };

    // Extract points for various criteria from the prompt
    extractPoints(/Einstiegsstelle.*?\(([+-]?\d+(?:\.\d+)?)\)/i, 'entryLevel');
    extractPoints(/Hochschulabschluss.*?\(([+-]?\d+(?:\.\d+)?)\)/i, 'requiresDegree');
    extractPoints(/Berufserfahrung.*?\(([+-]?\d+(?:\.\d+)?)\)/i, 'requiresExperience');
    extractPoints(/Software-\/Webentwicklung.*?\(([+-]?\d+(?:\.\d+)?)\)/i, 'techRole');
    extractPoints(/Grafikdesign.*?\(([+-]?\d+(?:\.\d+)?)\)/i, 'designRole');
    extractPoints(/Kundendienst.*?\(([+-]?\d+(?:\.\d+)?)\)/i, 'customerServiceRole');
    extractPoints(/Kaufmännische.*?\(([+-]?\d+(?:\.\d+)?)\)/i, 'officeSupportRole');
    
    // Look for tools/skills matching
    if (jobRankerPrompt.includes('HTML') || 
        jobRankerPrompt.includes('CSS') || 
        jobRankerPrompt.includes('JavaScript')) {
      weights.skillMatch = 1;
      weights.techRole = Math.max(weights.techRole, 0.5);
    }
    
    // Consider remote work preferences if mentioned
    if (jobRankerPrompt.toLowerCase().includes('remote') || 
        jobRankerPrompt.toLowerCase().includes('homeoffice')) {
      weights.remoteWork = 1;
    }

    return weights;
  }

  /**
   * Calculates a personalized score for a job based on pre-computed scores and user preferences
   */
  private calculatePersonalizedScore(job: any, weights: Record<string, number>): number {
    // If job doesn't have scores, return a low score
    if (!job.scores) return -100;
    
    const scores = job.scores as JobScore;
    let totalScore = 0;
    let weightSum = 0;
    
    // Calculate weighted sum of scores based on user preferences
    for (const [criterion, weight] of Object.entries(weights)) {
      if (weight !== 0 && scores[criterion] !== undefined) {
        totalScore += scores[criterion] * weight;
        weightSum += Math.abs(weight);
      }
    }
    
    // Normalize score to a -5 to +5 scale
    const normalizedScore = weightSum > 0 
      ? totalScore / weightSum 
      : 0;
    
    // Apply additional factors based on job preferences
    let adjustedScore = normalizedScore;
    
    // Consider existing user preferences for this job
    if (job.job_preferences && job.job_preferences.length > 0) {
      const preference = job.job_preferences[0];
      
      // Boost starred jobs
      if (preference.is_starred) {
        adjustedScore += 2;
      }
      
      // Use existing ranking as a factor
      if (preference.ranking === 'bingo') adjustedScore += 1;
      else if (preference.ranking === 'good') adjustedScore += 0.5;
      else if (preference.ranking === 'bad') adjustedScore -= 1;
    }
    
    // Factor in recency of the job posting
    if (job.published) {
      const daysAgo = (Date.now() - new Date(job.published).getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo < 7) {
        adjustedScore += 0.5; // Small boost for recent jobs
      }
    }
    
    return adjustedScore;
  }
  
  /**
   * Ranks jobs using a hybrid approach that can use either the new or old method
   * This serves as a wrapper to manage the transition between approaches
   */
  public async rankJobHybrid(job: Job, userId: string): Promise<JobRanking> {
    if (USE_OPTIMIZED_JOB_FILTERING) {
      try {
        // Use pre-computed scores if available
        const jobRecord = await prisma.jobs.findUnique({
          where: { id: job.id },
        });
        
        if (jobRecord?.scores) {
          // Get user preferences to translate scores to a ranking
          const userPreferences = await prisma.userProfile.findUnique({
            where: { userId }
          });
          
          const weights = this.extractUserPreferenceWeights(userPreferences?.jobRankerPrompt);
          const score = this.calculatePersonalizedScore(jobRecord, weights);
          
          // Convert score to ranking
          let ranking: "bingo" | "good" | "okay" | "bad";
          if (score >= 3) ranking = "bingo";
          else if (score >= 1) ranking = "good";
          else if (score >= -1) ranking = "okay";
          else ranking = "bad";
          
          return {
            ranking,
            canton: jobRecord.canton || "N/A"
          };
        }
      } catch (error) {
        console.error("Error using optimized ranking:", error);
        // Fall back to the old method on error
      }
    }
    
    // Fall back to the original method if optimized filtering is disabled
    // or if pre-computed scores aren't available for this job
    return this.rankJob(job, userId);
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
