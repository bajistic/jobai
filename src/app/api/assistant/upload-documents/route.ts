import { NextResponse } from 'next/server';
import { OpenAIService } from '@/services/openai.service';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const vectorStore = await prisma.userVectorStore.findFirst({ 
      where: { userId },
      select: { vectorStoreId: true }
    });
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('documents') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const openAIService = OpenAIService.getInstance();
    const fileIds = await openAIService.uploadDocuments(userId, files, vectorStore?.vectorStoreId);
    console.log("File IDs:", fileIds);

    return NextResponse.json({ 
      success: true, 
      fileIds,
      message: 'Documents uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' }, 
      { status: 500 }
    );
  }
} 