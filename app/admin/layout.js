import '../../app/globals.css';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = {
  title: 'Admin — DAVEJAVU',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
