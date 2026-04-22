import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'Contact — DAVEJAVU',
  description: 'Inquire about licensing a photo or get in touch.',
};

export default async function ContactPage({ params, searchParams }) {
  const { locale } = await params;
  const resolvedSearch = await searchParams;
  const prefilledPhoto = resolvedSearch?.photo || '';

  return (
    <div className="max-w-2xl mx-auto px-6 pt-[72px] pb-24">
      <div className="pt-16">
        <h1 className="text-3xl md:text-4xl font-700 text-charcoal tracking-tight">Get in Touch</h1>
        <p className="text-sm text-mid-gray mt-3 leading-relaxed max-w-md">
          Interested in licensing a photo? Fill in the form and I'll get back to you within 48 hours.
        </p>
      </div>
      <div className="mt-12">
        <ContactForm locale={locale} prefilledPhoto={prefilledPhoto} />
      </div>
    </div>
  );
}
