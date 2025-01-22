'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, Upload, Trash2, Database, Bot } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    image: '',
    documents: [
      {
        id: 'doc_1',
        name: 'B.Bayarsaikhan_CV.pdf',
        fileId: 'file_1',
      },
      {
        id: 'doc_2',
        name: 'B.Bayarsaikhan_Schreiben.docx',
        fileId: 'file_2',
      },
      {
        id: 'doc_3',
        name: 'B.Bayarsaikhan_Zeugnisse.pdf',
        fileId: 'file_3',
      },
      {
        id: 'doc_4',
        name: 'B.Bayarsaikhan_Zertifikate.pdf',
        fileId: 'file_4',
      },
    ],
    assistantId: 'asst_placeholder',
    jobFilterPrompt: `Ich suche nach Stellen in folgenden Bereichen:

- Einstiegsstellen und Quereinstiegsmöglichkeiten
- Kaufmännische Positionen (KV)
- Kundendienst und Kassenwesen
- Software- und Webentwicklung
- IT-Support
- Grafikdesign
- Logistik

Technische Kenntnisse:
- Webentwicklung: HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js
- Linux
- Design: Photoshop, Illustrator, Figma
- Datenbanken: MongoDB, PostgreSQL
- MS Office, Python

Nicht relevant:
- Temporärstellen
- Praktika
- Lehrstellen
- Stellen mit Hochschulabschluss
- Stellen mit mehrjähriger Berufserfahrung`,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        // Merge the API data with default documents array if none provided
        setProfile({
          ...data,
          documents: data.documents || profile.documents,
          jobFilterPrompt: data.jobFilterPrompt || profile.jobFilterPrompt
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Keep existing state on error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        setIsEditing(false)
        fetchProfile()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsSaving(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('documents', file)
      })

      const response = await fetch('/api/assistant/upload-documents', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchProfile()
      }
    } catch (error) {
      console.error('Error uploading documents:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/assistant/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProfile()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600">Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <div className="flex gap-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <input
                      type="text"
                      value={profile.image || ''}
                      onChange={(e) => setProfile({ ...profile, image: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter image URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
                
                <div className="space-y-6 border-t pt-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">AI Assistant Configuration</h3>
                    
                    {/* Vector Store Section */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">Vector Store</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload your documents to create a personalized knowledge base
                      </p>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Documents
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.doc,.docx"
                            onChange={handleDocumentUpload}
                          />
                        </label>
                        <span className="text-sm text-gray-500">
                          {profile.documents.length} documents uploaded
                        </span>
                      </div>
                      
                      {/* Document List */}
                      <div className="mt-4 space-y-2">
                        {profile.documents.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                            <span className="text-sm text-gray-700">{doc.name}</span>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assistant Section */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">AI Assistant</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Configure your personal AI assistant for job applications
                      </p>
                      
                      {/* Job Filter Prompt */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Job Filter Criteria
                        </label>
                        <textarea
                          value={profile.jobFilterPrompt || ''}
                          onChange={(e) => setProfile({ ...profile, jobFilterPrompt: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your custom job filtering criteria..."
                          rows={23}
                        />
                        <p className="text-xs text-gray-500">
                          Customize how your assistant filters and ranks job postings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.name || 'Profile picture'}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-2xl">
                        {profile.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {profile.name || 'No name set'}
                    </h2>
                    <p className="text-gray-500">{profile.email}</p>
                  </div>
                </div>
                
                <div className="border-t pt-6 mt-6">
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile.name || 'Not set'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Application Documents</h3>
                  <div className="space-y-2">
                    {profile.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-700">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
} 