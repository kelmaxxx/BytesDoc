'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useDocumentStore } from '@/lib/stores/documentStore'
import { useUserStore } from '@/lib/stores/userStore'
import { useActivityStore } from '@/lib/stores/activityStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import BarChart from '@/components/charts/BarChart'
import DocumentTable from '@/components/dashboard/DocumentTable'
import ArchiveList from '@/components/dashboard/ArchiveList'
import DocumentViewerModal from '@/components/dashboard/DocumentViewerModal'
import UploadModal from '@/components/dashboard/UploadModal'
import { FileText, Archive, Upload } from 'lucide-react'
import { Document } from '@/types'

export default function SecretaryDashboard() {
  return (
    <Suspense fallback={null}>
      <SecretaryDashboardContent />
    </Suspense>
  )
}

function SecretaryDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'
  
  const { user, isAuthenticated } = useAuthStore()
  const { documents, addDocument, updateDocument, deleteDocument } = useDocumentStore()
  const { users } = useUserStore()
  const { addLog } = useActivityStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'secretary') {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  if (!user) return null

  const tabs = [
    { name: 'Dashboard', href: '/dashboard/secretary' },
    { name: 'Documents', href: '/dashboard/secretary?tab=documents' },
    { name: 'Archive', href: '/dashboard/secretary?tab=archive' },
  ]

  const uploaderNames = users.reduce((acc, u) => {
    acc[u.id] = u.fullName
    return acc
  }, {} as Record<string, string>)

  // Filter out financial documents
  const accessibleDocs = documents.filter(d => d.category !== 'Financial Records')
  
  const filteredDocs = accessibleDocs.filter(d => {
    if (tab === 'documents') {
      const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase())
      return !d.is_archived && matchesSearch
    }
    return d.is_archived
  })

  const handleUpload = (data: any) => {
    addDocument({
      ...data,
      uploadedBy: user.id,
      uploadDate: new Date().toISOString(),
      filePath: '/mock/document.pdf',
      is_archived: false,
      is_locked: false,
      fileType: 'pdf',
      category: data.category as any,
    })
    addLog({ userId: user.id, action: 'upload', documentId: `${Date.now()}` })
    setUploadModalOpen(false)
  }

  const handleView = (doc: Document) => {
    setSelectedDoc(doc)
    setViewModalOpen(true)
    addLog({ userId: user.id, action: 'view', documentId: doc.id })
  }

  const handleDownload = (doc: Document) => {
    addLog({ userId: user.id, action: 'download', documentId: doc.id })
    alert('Download started: ' + doc.title)
  }

  const handleDelete = (doc: Document) => {
    if (confirm('Delete this document?')) {
      deleteDocument(doc.id)
      addLog({ userId: user.id, action: 'archive', documentId: doc.id })
    }
  }

  const myUploads = accessibleDocs.filter(d => d.uploadedBy === user.id).length
  const totalDocs = accessibleDocs.filter(d => !d.is_archived).length
  const archivedDocs = accessibleDocs.filter(d => d.is_archived).length

  const categoryData = [
    { name: 'Proposals', value: accessibleDocs.filter(d => d.category === 'Proposals').length },
    { name: 'Permits', value: accessibleDocs.filter(d => d.category === 'Permits').length },
    { name: 'Reports', value: accessibleDocs.filter(d => d.category === 'Reports').length },
  ]

  const recentDocs = accessibleDocs.filter(d => !d.is_archived).slice(0, 5)

  return (
    <DashboardLayout tabs={tabs} activeTab={tab === 'documents' ? 'Documents' : tab === 'archive' ? 'Archive' : 'Dashboard'}>
      {tab === 'dashboard' && (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Secretary Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="My Uploads" value={myUploads} icon={<Upload size={32} />} />
            <Card title="Total Documents" value={totalDocs} icon={<FileText size={32} />} />
            <Card title="Archived Documents" value={archivedDocs} icon={<Archive size={32} />} />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Documents per Category</h2>
            <BarChart data={categoryData} />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Documents</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Title</th>
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Category</th>
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocs.map((doc) => (
                    <tr key={doc.id} className="border-b dark:border-gray-700">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{doc.title}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{doc.category}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload size={20} className="inline mr-2" />
              Upload Document
            </Button>
          </div>

          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />

          <DocumentTable
            documents={filteredDocs}
            canUpload={true}
            canEdit={(doc) => doc.uploadedBy === user.id}
            canDelete={(doc) => doc.uploadedBy === user.id}
            canArchive={false}
            onView={handleView}
            onDownload={handleDownload}
            onEdit={(doc) => {}}
            onDelete={handleDelete}
            uploaderNames={uploaderNames}
          />
        </div>
      )}

      {tab === 'archive' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Archive (Read Only)</h1>
          <ArchiveList
            documents={filteredDocs}
            onView={handleView}
            onDownload={handleDownload}
            uploaderNames={uploaderNames}
          />
        </div>
      )}

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
        allowedCategories={['Proposals', 'Permits', 'Reports']}
      />

      <DocumentViewerModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        document={selectedDoc}
      />
    </DashboardLayout>
  )
}
