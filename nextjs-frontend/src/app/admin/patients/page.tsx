import { AdminLayout } from '@/components/layout/admin-layout'
import { AdminPatientsPage } from '@/components/admin/patients-page'

export default function PatientsPage() {
  return (
    <AdminLayout>
      <AdminPatientsPage />
    </AdminLayout>
  )
}
