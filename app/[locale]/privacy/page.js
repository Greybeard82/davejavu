import { redirect } from 'next/navigation';

export default async function PrivacyPage({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/license`);
}
