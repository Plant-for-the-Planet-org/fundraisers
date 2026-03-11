import { AuthGuard } from '@/components/auth/auth-guard';

export default function Dashboard() {
  return (
    <AuthGuard>
      <section>Dashboard page</section>
    </AuthGuard>
  );
}
