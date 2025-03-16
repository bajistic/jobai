'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, Upload, Trash2, Database, Bot, Pencil, Save, X } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ExpandedTextEditor } from '@/components/ExpandedTextEditor'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    image: '',
    documents: [],
    assistantId: '',
    jobRankerPrompt: '',
    composerPrompt: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        console.log("Profile data:", data);
        
        // Extract composer prompt correctly
        const composerAssistant = data.assistants?.find(
          (a: any) => a.assistantName.startsWith('Composer_')
        );
        const composerPrompt = composerAssistant?.systemPrompt || '';
        
        setProfile({
          ...data,
          documents: data.documents || [],
          jobRankerPrompt: data.jobRankerPrompt || '',
          composerPrompt: composerPrompt
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile data')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      console.log('Profile to be sent', profile);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        setIsEditing(false)
        await fetchProfile()
        toast.success('Profile updated successfully')
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('documents', file)
      })

      const response = await fetch('/api/assistant/upload-documents', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload documents')
      }

      await fetchProfile()
      toast.success('Documents uploaded successfully')
    } catch (error) {
      console.error('Error uploading documents:', error)
      toast.error('Failed to upload documents')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/assistant/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      await fetchProfile()
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please sign in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-background py-4 sm:py-12 px-2 sm:px-4">
        <Card className="max-w-3xl mx-auto shadow-sm mb-8 sm:mb-12">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
              <div className="flex flex-wrap gap-2">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1 text-xs sm:text-sm sm:gap-2"
                  >
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    Edit Profile
                  </Button>
                ) : null}
                <Button 
                  onClick={handleSignOut} 
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1 text-xs sm:text-sm sm:gap-2"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Profile Picture
                    </label>
                    <Input
                      type="text"
                      value={profile.image || ''}
                      onChange={(e) => setProfile({ ...profile, image: e.target.value })}
                      placeholder="Enter image URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">AI Assistant Configuration</h3>

                    {/* Vector Store Section */}
                    <Card className="mb-6 bg-muted/40 max-w-full overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Database className="h-5 w-5 text-primary" />
                          <h4 className="font-medium">Vector Store</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload your documents to create a personalized knowledge base
                        </p>
                        <div className="flex items-center gap-4">
                          <label className="cursor-pointer">
                            <Button 
                              variant="default" 
                              className="flex items-center gap-2"
                              disabled={isUploading}
                            >
                              <Upload className="h-4 w-4" />
                              {isUploading ? 'Uploading...' : 'Upload Documents'}
                            </Button>
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              accept=".pdf,.doc,.docx"
                              onChange={handleDocumentUpload}
                              disabled={isUploading}
                            />
                          </label>
                          <span className="text-sm text-muted-foreground">
                            {profile.documents.length} documents uploaded
                          </span>
                        </div>

                        {/* Document List */}
                        <div className="mt-4 space-y-2">
                          {profile.documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-card rounded-md border">
                              <span className="text-sm">{doc.name}</span>
                              <Button 
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive/90 p-1 h-auto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Assistant Section */}
                    <Card className="bg-muted/40">
                      <CardContent className="pt-6 px-3 sm:px-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="h-5 w-5 text-primary" />
                          <h4 className="font-medium">AI Assistant</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure your personal AI assistant for job applications
                        </p>

                        {/* Job Filter Prompt */}
                        <div className="space-y-2 mt-6">
                          <div className="flex justify-between items-center mb-2 flex-wrap">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <label className="block text-sm font-medium">
                                Job Ranker Criteria
                              </label>
                              <ExpandedTextEditor 
                                value={profile.jobRankerPrompt || ''}
                                onChange={(value) => setProfile({ ...profile, jobRankerPrompt: value })}
                                title="Job Ranker Instructions"
                                triggerLabel="Maximize"
                                placeholder="Enter your custom job ranking criteria..."
                              />
                            </div>
                          </div>
                          <Textarea
                            value={profile.jobRankerPrompt || ''}
                            onChange={(e) => setProfile({ ...profile, jobRankerPrompt: e.target.value })}
                            placeholder="Enter your custom job ranking criteria..."
                            className="min-h-[120px] w-full"
                          />
                        </div>

                        {/* Job Composer Prompt */}
                        <div className="space-y-2 mt-6">
                          <div className="flex justify-between items-center mb-2 flex-wrap">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <label className="block text-sm font-medium">
                                Job Composer Criteria
                              </label>
                              <ExpandedTextEditor 
                                value={profile.composerPrompt || ''}
                                onChange={(value) => setProfile({ ...profile, composerPrompt: value })}
                                title="Job Composer Instructions"
                                triggerLabel="Maximize"
                                placeholder="Enter your custom job composing criteria..."
                              />
                            </div>
                          </div>
                          <Textarea
                            value={profile.composerPrompt || ''}
                            onChange={(e) => setProfile({ ...profile, composerPrompt: e.target.value })}
                            placeholder="Enter your custom job composing criteria..."
                            className="min-h-[120px] w-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    size="sm"
                    className="flex items-center gap-1 text-xs sm:text-sm sm:gap-2"
                  >
                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-xs sm:text-sm sm:gap-2"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name || 'Profile picture'}
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-xl sm:text-2xl">
                        {profile.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold">
                      {profile.name || 'No name set'}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">{profile.email}</p>
                  </div>
                </div>

                <Separator className="my-3 sm:my-4" />

                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Application Documents</h3>
                  <div className="space-y-2">
                    {profile.documents.length > 0 ? (
                      profile.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center p-3 bg-muted/40 rounded-md">
                          <span className="text-sm">{doc.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                    )}
                  </div>
                </div>

                <Separator className="my-3 sm:my-4" />

                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">AI Assistant Configuration</h3>
                  
                  {/* Job Ranker Settings */}
                  <div className="mb-4">
                    <div className="flex items-center mb-1">
                      <h4 className="text-sm font-medium">Job Ranker Criteria</h4>
                    </div>
                    {profile.jobRankerPrompt ? (
                      <div className="p-3 bg-muted/40 rounded-md">
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{profile.jobRankerPrompt}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No job ranking criteria set</p>
                    )}
                  </div>
                  
                  {/* Job Composer Settings */}
                  <div>
                    <div className="flex items-center mb-1">
                      <h4 className="text-sm font-medium">Job Composer Criteria</h4>
                    </div>
                    {profile.composerPrompt ? (
                      <div className="p-3 bg-muted/40 rounded-md">
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{profile.composerPrompt}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No job composer criteria set</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
