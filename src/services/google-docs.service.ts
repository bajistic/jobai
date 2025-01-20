import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { config } from '@/lib/config';
import { Job } from '@/lib/types/shared';

export class GoogleDocsService {
  private static instance: GoogleDocsService;
  private auth: GoogleAuth;
  private docsClient;
  private driveClient;
  private templateId = '1_kZWhfedQ0KguiMFmMuToJYsPsdLJjubdtwInoPCPl8';
  private folderId = '14yo4d1GlhI_L1Mh4oTmEH4Um84H-HLDq';

  private constructor() {
    this.auth = new GoogleAuth({
      credentials: {
        client_email: config.googleServiceAccount.clientEmail,
        private_key: config.googleServiceAccount.privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
    this.docsClient = google.docs({ version: 'v1', auth: this.auth });
    this.driveClient = google.drive({ version: 'v3', auth: this.auth });
  }

  public static getInstance(): GoogleDocsService {
    if (!GoogleDocsService.instance) {
      GoogleDocsService.instance = new GoogleDocsService();
    }
    return GoogleDocsService.instance;
  }

  public async createCoverLetterDoc(content: string, job: Job): Promise<string> {
    try {
      // Copy the template
      const copyResponse = await this.driveClient.files.copy({
        fileId: this.templateId,
        requestBody: {
          name: `Cover Letter - ${job.title} - ${new Date().toLocaleDateString()}`,
          parents: [this.folderId]
        }
      });

      const documentId = copyResponse.data.id!;

      // Get today's date in Swiss German format
      const today = new Date().toLocaleDateString('de-CH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Define placeholders and their values
      const placeholders = {
        '{{ADDRESS}}': job.address || '',
        '{{DATE}}': today,
        '{{TITLE}}': job.title || '',
        '{{GREETING}}': 'Sehr geehrte Damen und Herren',
        '{{CONTENT}}': content,
        '{{SALUTE}}': 'Freundliche Grüsse',
        '{{COMPANY}}': job.company || '',
      };

      // Create batch update requests for each placeholder
      const requests = Object.entries(placeholders).map(([placeholder, value]) => ({
        replaceAllText: {
          containsText: { text: placeholder, matchCase: true },
          replaceText: value
        }
      }));

      // Update all placeholders
      await this.docsClient.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });

      // Make the document publicly accessible via link
      await this.driveClient.permissions.create({
        fileId: documentId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return `https://docs.google.com/document/d/${documentId}/edit`;
    } catch (error) {
      console.error('Failed to create Google Doc:', error);
      throw error;
    }
  }
} 