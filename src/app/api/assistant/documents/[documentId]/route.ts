import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, props: { params: Promise<{ documentId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await prisma.userDocument.findUnique({
      where: {
        id: params.documentId,
        userId: userId,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete the document from the database
    await prisma.userDocument.delete({
      where: {
        id: params.documentId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' }, 
      { status: 500 }
    );
  }
} 