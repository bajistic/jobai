import OpenAI from 'openai';
import { config } from '@/lib/config';
import { Job } from '@/lib/types/shared';
import { z } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";
import { GoogleDocsService } from './google-docs.service';

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

  public async rankJob(job: Job): Promise<JobRanking> {
    const systemPrompt = `
      Analysiere die folgende Stellenanzeige und berechne Punkte basierend auf den folgenden Kriterien.
  
      Pluspunkte:
      (+4) Einstiegsstelle in jedem Bereich (Einsteiger, Quereinsteiger)
      (+4) Kaufmännische Lehre  (Kaufmann EFZ, KV), oder lediglich Berufslehre/Grundbildung erfordert
      (+4) Kassenwesen und Kundendienst
      (+3) Software-/Webentwicklungsrolle
      (+3) IT-Support
      (+3) Grafikdesignrolle
      (+3) Detailhandel/Verkauf
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
  
      Antworten:
      Ranking: "bingo", "good", "okay" oder "bad"
      Canton: Schweizer Kanton, in dem der Job angeboten wird.
    `;
    const userPrompt = `
      Title: ${job.title}
      Location: ${job.location}
      Description: ${job.description}
    `;

    try {
      const completion = await this.openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: zodResponseFormat(jobRankingSchema, "job_ranking")
      });

      const response = completion.choices[0]?.message?.parsed ?? {
        ranking: "bad",
        canton: "N/A"
      };
      return response as JobRanking;
    } catch (error) {
      console.error("Error filtering job with AI:", error);
      return {
        ranking: "bad",
        canton: "N/A"
      };
    }
  }

  public async generateCoverLetter(job: Job): Promise<{ content: string; docs_url: string }> {
    try {
      // Create thread
      const thread = await this.openai.beta.threads.create();

      // Add message to thread
      await this.openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Inserat: ${job.description}\nAnmerkungen: ${job.preferences?.notes || ''}`
      });

      // Start assistant run
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
      });

      // Wait for completion
      const runStatus = await this.waitForCompletion(thread.id, run.id);

      if (runStatus.status !== 'completed') {
        throw new Error('Generation timeout or failed');
      }

      // Get response
      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const content = messages.data[0].content[0];
      
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Create Google Doc
      const googleDocsService = GoogleDocsService.getInstance();
      const docs_url = await googleDocsService.createCoverLetterDoc(content.text.value, job as unknown as Job);

      return { content: content.text.value, docs_url: docs_url };
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      throw error;
    }
  }

  private async waitForCompletion(threadId: string, runId: string) {
    let attempts = 0;
    let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);

    while (runStatus.status !== 'completed' && attempts < MAX_COMPLETION_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, COMPLETION_CHECK_INTERVAL));
      runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    return runStatus;
  }
} 