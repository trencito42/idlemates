import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [userCount, activeSessionCount, totalPayments, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.boostSession.count({ where: { status: 'running' } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, createdAt: true, role: true } })
  ])

  const stats = [
    { label: 'Total Users', value: userCount.toString(), icon: 'fa-users' },
    { label: 'Active Sessions', value: activeSessionCount.toString(), icon: 'fa-gamepad' },
    { label: 'Total Revenue', value: `$${((totalPayments._sum.amount || 0) / 100).toFixed(2)}`, icon: 'fa-sack-dollar' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted">System overview and quick actions</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <i className={`fa-duotone ${stat.icon} text-3xl text-primary`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
        <div className="space-y-3">
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-bg/50 border border-white/5">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-muted">
                  Joined {new Date(user.createdAt).toLocaleDateString('ro-RO')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${user.role === 'ADMIN' ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>
                  {user.role}
                </span>
                <Link href={`/admin/users?id=${user.id}`} className="text-sm text-primary hover:underline">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/admin/users" className="card p-6 hover:border-primary/20 transition-colors">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="fa-duotone fa-users text-primary"></i>
            Manage Users
          </h3>
          <p className="text-sm text-muted">View, ban, or modify user accounts</p>
        </Link>
        <form
          action={async () => {
            'use server'
            // best-effort helper action to grant Pro to stefan@xodo.ro
            await fetch(`${process.env.NEXTAUTH_URL}/api/admin/grant-subscription`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'stefan@xodo.ro', planCode: 'pro' })
            })
          }}
          className="card p-6 hover:border-primary/20 transition-colors"
        >
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="fa-duotone fa-crown text-primary"></i>
            Grant Pro to stefan@xodo.ro
          </h3>
          <p className="text-sm text-muted mb-4">One-click internal grant for testing/support</p>
          <button type="submit" className="btn btn-sm">Grant Now</button>
        </form>
        <Link href="/admin/sessions" className="card p-6 hover:border-primary/20 transition-colors">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="fa-duotone fa-gamepad text-primary"></i>
            Active Sessions
          </h3>
          <p className="text-sm text-muted">Monitor and control boost sessions</p>
        </Link>
        <Link href="/admin/payments" className="card p-6 hover:border-primary/20 transition-colors">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="fa-duotone fa-credit-card text-primary"></i>
            Payment History
          </h3>
          <p className="text-sm text-muted">View transactions and subscriptions</p>
        </Link>
        <Link href="/admin/webhooks" className="card p-6 hover:border-primary/20 transition-colors">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="fa-duotone fa-bell text-primary"></i>
            Webhook Events
          </h3>
          <p className="text-sm text-muted">Inspect webhook logs</p>
        </Link>
      </div>
    </div>
  )
}
