import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg">
      <AdminTopBar />
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
