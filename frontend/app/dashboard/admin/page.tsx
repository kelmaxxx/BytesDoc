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
import LineChart from '@/components/charts/LineChart'
import DocumentTable from '@/components/dashboard/DocumentTable'
import ArchiveList from '@/components/dashboard/ArchiveList'
import UserTable from '@/components/dashboard/UserTable'
import ActivityLogTable from '@/components/dashboard/ActivityLogTable'
import DocumentViewerModal from '@/components/dashboard/DocumentViewerModal'
import UploadModal from '@/components/dashboard/UploadModal'
import Modal from '@/components/ui/Modal'
import { FileText, Archive, Upload, Download, UserPlus } from 'lucide-react'
import { Document } from '@/types'

export default function AdminDashboard() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardContent />
    </Suspense>
  )
}

function AdminDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'
  
  const { user, isAuthenticated } = useAuthStore()
  const { documents, addDocument, updateDocument, deleteDocument, archiveDocument, bulkArchiveByAdministration } = useDocumentStore()
  const { users, addUser, updateUserRole } = useUserStore()
  const { logs, addLog } = useActivityStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterUser, setFilterUser] = useState('All')
  const [filterAction, setFilterAction] = useState('All')
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'Proposals',
    event: 'Freshmen Orientation',
    administration: '2024-2025',
  })

  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    fullName: '',
    role: 'member' as any,
  })

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'chief_minister') {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  if (!user) return null

  const tabs = [
    { name: 'Dashboard', href: '/dashboard/admin' },
    { name: 'Documents', href: '/dashboard/admin?tab=documents' },
    { name: 'Archive', href: '/dashboard/admin?tab=archive' },
    { name: 'Users', href: '/dashboard/admin?tab=users' },
    { name: 'Activity Logs', href: '/dashboard/admin?tab=logs' },
  ]

  const uploaderNames = users.reduce((acc, u) => {
    acc[u.id] = u.fullName
    return acc
  }, {} as Record<string, string>)

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

  const handleEdit = () => {
    if (selectedDoc) {
      updateDocument(selectedDoc.id, editFormData)
      setEditModalOpen(false)
      setSelectedDoc(null)
    }
  }

  const handleDelete = (doc: Document) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument(doc.id)
      addLog({ userId: user.id, action: 'archive', documentId: doc.id })
    }
  }

  const handleArchive = (doc: Document) => {
    if (confirm('Archive this document? It will become read-only.')) {
      archiveDocument(doc.id)
      addLog({ userId: user.id, action: 'archive', documentId: doc.id })
    }
  }

  const handleBulkArchive = (administration: string) => {
    if (confirm(`Archive all documents from ${administration}?`)) {
      bulkArchiveByAdministration(administration)
      addLog({ userId: user.id, action: 'archive' })
    }
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

  const handleInviteUser = () => {
    if (!inviteFormData.email || !inviteFormData.fullName) {
      alert('Please fill all fields')
      return
    }
    addUser(inviteFormData)
    setInviteModalOpen(false)
    setInviteFormData({ email: '', fullName: '', role: 'member' })
  }

  const exportLogsToCSV = () => {
    const filteredLogs = logs.filter(log => {
      const matchesUser = filterUser === 'All' || log.userId === filterUser
      const matchesAction = filterAction === 'All' || log.action === filterAction
      return matchesUser && matchesAction
    })

    const csv = [
      ['User', 'Action', 'Document', 'Timestamp'],
      ...filteredLogs.map(log => {
        const logUser = users.find(u => u.id === log.userId)
        const doc = log.documentId ? documents.find(d => d.id === log.documentId) : null
        return [
          logUser?.fullName || 'Unknown',
          log.action,
          doc?.title || 'N/A',
          new Date(log.timestamp).toLocaleString()
        ]
      })
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'activity-logs.csv'
    a.click()
  }

  const totalDocs = documents.length
  const activeDocs = documents.filter(d => !d.is_archived).length
  const archivedDocs = documents.filter(d => d.is_archived).length
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentUploads = documents.filter(d => new Date(d.uploadDate) > sevenDaysAgo).length

  const categoryData = [
    { name: 'Proposals', value: documents.filter(d => d.category === 'Proposals').length },
    { name: 'Permits', value: documents.filter(d => d.category === 'Permits').length },
    { name: 'Budgets', value: documents.filter(d => d.category === 'Budgets').length },
    { name: 'Reports', value: documents.filter(d => d.category === 'Reports').length },
  ]

  const uploadData = [
    { name: 'Nov', value: 2 },
    { name: 'Dec', value: 3 },
    { name: 'Jan', value: 1 },
    { name: 'Feb', value: 2 },
    { name: 'Mar', value: 4 },
    { name: 'Apr', value: 3 },
  ]

  const recentDocs = documents.filter(d => !d.is_archived).slice(0, 5)
  const filteredDocs = documents.filter(d => {
    if (tab === 'documents') {
      const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'All' || d.category === filterCategory
      return !d.is_archived && matchesSearch && matchesCategory
    }
    return d.is_archived
  })

  return (
    <DashboardLayout tabs={tabs} activeTab={tab === 'documents' ? 'Documents' : tab === 'archive' ? 'Archive' : tab === 'users' ? 'Users' : tab === 'logs' ? 'Activity Logs' : 'Dashboard'}>
      {tab === 'dashboard' && (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Total Documents" value={totalDocs} icon={<FileText size={32} />} />
            <Card title="Active Documents" value={activeDocs} icon={<FileText size={32} />} />
            <Card title="Archived Documents" value={archivedDocs} icon={<Archive size={32} />} />
            <Card title="Recent Uploads (7d)" value={recentUploads} icon={<Upload size={32} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Documents per Category</h2>
              <BarChart data={categoryData} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Uploads Over Time</h2>
              <LineChart data={uploadData} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Documents</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Title</th>
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Category</th>
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Uploader</th>
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Date</th>
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocs.map((doc) => (
                    <tr key={doc.id} className="border-b dark:border-gray-700">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{doc.title}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{doc.category}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{uploaderNames[doc.uploadedBy]}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-primary dark:text-accent hover:underline flex items-center"
                        >
                          <Download size={16} className="mr-1" />
                          Download
                        </button>
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

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <div className="flex gap-2 flex-wrap">
              {['All', 'Proposals', 'Permits', 'Budgets', 'Reports', 'Financial Records'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg ${
                    filterCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <DocumentTable
            documents={filteredDocs}
            canUpload={true}
            canEdit={() => true}
            canDelete={() => true}
            canArchive={true}
            onView={handleView}
            onDownload={handleDownload}
            onEdit={(doc) => {
              setSelectedDoc(doc)
              setEditFormData({
                title: doc.title,
                category: doc.category,
                event: doc.event,
                administration: doc.administration,
              })
              setEditModalOpen(true)
            }}
            onDelete={handleDelete}
            onArchive={handleArchive}
            uploaderNames={uploaderNames}
          />
        </div>
      )}

      {tab === 'archive' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Archive</h1>
          <ArchiveList
            documents={filteredDocs}
            onView={handleView}
            onDownload={handleDownload}
            canBulkArchive={true}
            onBulkArchive={handleBulkArchive}
            uploaderNames={uploaderNames}
          />
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
            <Button onClick={() => setInviteModalOpen(true)}>
              <UserPlus size={20} className="inline mr-2" />
              Invite User
            </Button>
          </div>
          <UserTable users={users} onRoleChange={updateUserRole} />
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
            <Button onClick={exportLogsToCSV}>
              <Download size={20} className="inline mr-2" />
              Export to CSV
            </Button>
          </div>
          <ActivityLogTable
            logs={logs}
            users={users}
            documents={documents}
            filterUser={filterUser}
            filterAction={filterAction}
            onFilterUserChange={setFilterUser}
            onFilterActionChange={setFilterAction}
          />
        </div>
      )}

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Document">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Title</label>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <Button onClick={handleEdit}>Save Changes</Button>
        </div>
      </Modal>

      <DocumentViewerModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        document={selectedDoc}
      />

      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite New User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Email</label>
            <input
              type="email"
              value={inviteFormData.email}
              onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Full Name</label>
            <input
              type="text"
              value={inviteFormData.fullName}
              onChange={(e) => setInviteFormData({ ...inviteFormData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Role</label>
            <select
              value={inviteFormData.role}
              onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="chief_minister">Chief Minister</option>
              <option value="secretary">Secretary</option>
              <option value="finance_minister">Finance Minister</option>
              <option value="member">Member</option>
            </select>
          </div>
          <Button onClick={handleInviteUser}>Invite User</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
