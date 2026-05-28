export type Role = 'chief_minister' | 'secretary' | 'finance_minister' | 'member'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  createdAt: string
}

export interface Document {
  id: string
  title: string
  category: string
  event: string
  administration: string
  uploadedBy: string
  uploadDate: string
  filePath: string
  is_archived: boolean
  is_locked: boolean
  is_deleted: boolean
  deleted_at?: string | null
  fileType: 'pdf' | 'docx'
}

export interface Administration {
  id: string
  name: string
  startDate: string
  endDate: string | null
  createdAt: string
}

export interface Category {
  id: string
  name: string
  createdAt: string
}

export interface Event {
  id: string
  name: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  action: 'upload' | 'download' | 'view' | 'archive' | 'lock' | 'unlock' | 'login' | 'delete' | 'restore'
  documentId?: string
  timestamp: string
}
