'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import InterestsManager from '@/components/InterestsManager'
import PlatformConnections from '@/components/PlatformConnections'

interface EditProfileModalProps {
  user: any
  onClose: () => void
  onSave: () => void
}

export default function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    banner_url: user.banner_url || '',
    website: user.website || '',
    location: user.location || '',
    theme_color: user.theme_color || '#6366f1',
    socialLinks: user.socialLinks || [],
    projects: user.projects || [],
  })

  const [newSocialLink, setNewSocialLink] = useState({ platform: 'website', url: '' })
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '', 
    image_url: '', 
    project_url: '', 
    category: '' 
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onSave()
      } else {
        alert(t.common.error)
      }
    } catch (error) {
      alert(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const addSocialLink = () => {
    if (newSocialLink.url) {
      setFormData({
        ...formData,
        socialLinks: [...formData.socialLinks, { ...newSocialLink, id: Date.now() }]
      })
      setNewSocialLink({ platform: 'website', url: '' })
    }
  }

  const removeSocialLink = (index: number) => {
    setFormData({
      ...formData,
      socialLinks: formData.socialLinks.filter((_: any, i: number) => i !== index)
    })
  }

  const addProject = () => {
    if (newProject.title) {
      setFormData({
        ...formData,
        projects: [...formData.projects, { ...newProject, id: Date.now() }]
      })
      setNewProject({ title: '', description: '', image_url: '', project_url: '', category: '' })
    }
  }

  const removeProject = (index: number) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((_: any, i: number) => i !== index)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t.user.editProfile}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.user.bio}
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Banner URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner URL
            </label>
            <input
              type="url"
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.user.website}
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.user.location}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="#6366f1"
              />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.user.socialLinks}
            </label>
            <div className="space-y-2 mb-3">
              {formData.socialLinks.map((link: any, index: number) => (
                <div key={link.id || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm capitalize">{link.platform}: {link.url}</span>
                  <button
                    onClick={() => removeSocialLink(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={newSocialLink.platform}
                onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="website">Website</option>
                <option value="twitter">Twitter</option>
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
              </select>
              <input
                type="url"
                value={newSocialLink.url}
                onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://..."
              />
              <button
                onClick={addSocialLink}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interests */}
          <div>
            <InterestsManager />
          </div>

          {/* Platform Connections */}
          <div>
            <PlatformConnections />
          </div>

          {/* Projects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.user.projects}
            </label>
            <div className="space-y-3 mb-3">
              {formData.projects.map((project: any, index: number) => (
                <div key={project.id || index} className="p-3 bg-gray-50 rounded border">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{project.title}</h4>
                    <button
                      onClick={() => removeProject(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600">{project.description}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2 border border-gray-200 rounded-lg p-3">
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Project title"
              />
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="Description"
              />
              <input
                type="url"
                value={newProject.image_url}
                onChange={(e) => setNewProject({ ...newProject, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Image URL"
              />
              <input
                type="url"
                value={newProject.project_url}
                onChange={(e) => setNewProject({ ...newProject, project_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Project URL"
              />
              <input
                type="text"
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Category"
              />
              <button
                onClick={addProject}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {t.user.addProject}
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? t.common.loading : t.common.save}
          </button>
        </div>
      </div>
    </div>
  )
}

