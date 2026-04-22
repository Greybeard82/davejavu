import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createAdminClient } from '@/lib/supabase-admin';

async function getPublishedCollections(locale) {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('collections')
      .select('slug, collection_translations ( locale, title )')
      .eq('published', true)
      .order('created_at', { ascending: true });

    return (data || []).map((c) => {
      const t = c.collection_translations?.find((x) => x.locale === locale)
             || c.collection_translations?.find((x) => x.locale === 'en')
             || {};
      return { slug: c.slug, name: t.title || c.slug };
    });
  } catch {
    return [];
  }
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const [messages, collections] = await Promise.all([
    getMessages({ locale }),
    getPublishedCollections(locale),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navbar locale={locale} collections={collections} />
      <main>
        {children}
      </main>
      <Footer locale={locale} />
    </NextIntlClientProvider>
  );
}
