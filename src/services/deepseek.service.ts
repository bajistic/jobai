import DS from 'deepseek'; // Hypothetical DeepSeek SDK - adjust based on actual SDK
import { Job } from '@/lib/types/shared';
import { GoogleDocsService } from './google-docs.service';
import { config } from '@/lib/config';

interface ProgressUpdate {
  progress: number;
  status: string;
}

export class DeepSeekService {
  private static instance: DeepSeekService;
  private deepseek: DS;
  private readonly MODEL_NAME = 'deepseek-chat'; // Verify correct model name

  private constructor() {
    this.deepseek = new DS({
      apiKey: config.deepseekApiKey,
      baseUrl: 'https://api.deepseek.com' // Verify API endpoint
    });
  }

  public static getInstance(): DeepSeekService {
    if (!DeepSeekService.instance) {
      DeepSeekService.instance = new DeepSeekService();
    }
    return DeepSeekService.instance;
  }

  public async generateCoverLetter(
    userId: string,
    job: Job,
    onProgress?: (update: ProgressUpdate) => void,
    notes?: string
  ): Promise<{ content: string; docs_url: string }> {
    try {
      onProgress?.({ progress: 20, status: 'Starting generation...' });
      
      const systemPrompt = `Erstelle ein prägnantes Bewerbungsschreiben auf Deutsch oder in der Sprache des Stelleninserats. 
        Betone wichtige Punkte der Aufgaben und Anforderungen der Position und begründe deine Aussagen stilvoll und wahrheitsgetreu. 
        Generiere nur den Hauptteil des Schreibens. Wichtig: Verwende "ss" anstatt ß.`;

      const response = await this.deepseek.chat.completions.create({
        model: this.MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Inserat: ${job.description}\nAnmerkungen: ${notes}` }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      onProgress?.({ progress: 80, status: 'Creating Google Doc...' });
      const content = response.choices[0].message.content;
      const googleDocsService = GoogleDocsService.getInstance();
      const docs_url = await googleDocsService.createCoverLetterDoc(content, job);

      onProgress?.({ progress: 100, status: 'Cover letter generation completed successfully' });
      return { content, docs_url };
    } catch (error) {
      console.error('DeepSeek generation failed:', error);
      throw error;
    }
  }

  public async rankJob(job: Job, userId: string): Promise<{ ranking: string; canton: string }> {
    try {
      const response = await this.deepseek.chat.completions.create({
        model: this.MODEL_NAME,
        messages: [{
          role: 'user',
          content: `Analyze and rank this job listing: ${job.description}`
        }],
        temperature: 0.2,
        max_tokens: 100
      });

      // Implement your ranking logic parsing here
      return this.parseRankingResponse(response.choices[0].message.content);
    } catch (error) {
      console.error('DeepSeek ranking failed:', error);
      throw error;
    }
  }

  private parseRankingResponse(response: string): { ranking: string; canton: string } {
    // Implement your actual response parsing logic here
    return {
      ranking: 'good',
      canton: 'ZH'
    };
  }
} 