import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createAdminClient } from '@/lib/supabase-admin';

async function getCollections(locale) {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('collections')
      .select('slug, collection_translations ( locale, title )')
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

// Overrides the root layout's English title and description per locale, so the
// browser tab and search snippet are not English on every language.
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('title'), description: t('description') };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [messages, collections] = await Promise.all([
    getMessages({ locale }),
    getCollections(locale),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex flex-col min-h-screen">
        <Navbar locale={locale} collections={collections} />
        <main className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
