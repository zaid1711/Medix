import { AdminLayout } from '@/components/layout/admin-layout'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'

export default function AdminPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  )
}
