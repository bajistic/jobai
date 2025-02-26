import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { config } from '@/lib/config';
import { Job } from '@/lib/types/shared';
import { auth } from '@/lib/auth';

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
      const session = await auth();
      const userName = session?.user?.name || 'Unknown User';
      // Copy the template
      const copyResponse = await this.driveClient.files.copy({
        fileId: this.templateId,
        requestBody: {
          name: `${userName}_Schreiben_${job.company}_${new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })}`,
          parents: [this.folderId]
        }
      });

      const documentId = copyResponse.data.id!;

      await this.setPermissions(documentId);
      await this.updatePlaceholders(documentId, job, content);

      return `https://docs.google.com/document/d/${documentId}/edit`;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  private async setPermissions(documentId: string) {
    await this.driveClient.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: config.googleServiceAccount.userEmail
      },
      supportsAllDrives: true,
      sendNotificationEmail: false
    });
  }

  private async updatePlaceholders(documentId: string, job: Job, content: string) {
    const today = new Date().toLocaleDateString('de-CH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const placeholders = {
      '{{ADDRESS}}': job.address || '',
      '{{DATE}}': today,
      '{{TITLE}}': 'Bewerbung als ' + job.title,
      '{{WORKLOAD}}': job.workload || '',
      '{{GREETING}}': 'Sehr geehrte Damen und Herren',
      '{{CONTENT}}': content,
      '{{SALUTE}}': 'Freundliche Grüsse',
      '{{COMPANY}}': job.company,
    };

    const requests = Object.entries(placeholders).map(([placeholder, value]) => ({
      replaceAllText: {
        containsText: { text: placeholder, matchCase: true },
        replaceText: value
      }
    }));

    await this.docsClient.documents.batchUpdate({
      documentId,
      requestBody: { requests }
    });
  }
}
