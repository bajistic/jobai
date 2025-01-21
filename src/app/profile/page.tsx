'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    image: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const response = await fetch('/api/profile')
    if (response.ok) {
      const data = await response.json()
      setProfile(data)
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
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
          </div>
        )}
      </div>
    </div>
  )
} 