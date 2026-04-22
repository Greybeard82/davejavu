import Link from 'next/link';

const LICENSE_TEXT = {
  en: {
    title: 'License Terms',
    body: `Thanks for buying. This file is licensed to you for personal use. Print it, hang it, share it with family, use it as a wallpaper. Please don't resell it, redistribute the file, or use it for commercial purposes without contacting me first. If you want to use it for something bigger, hit me up at {email} and we'll sort it out.`,
    back: 'Back to portfolio',
  },
  pt: {
    title: 'Termos de Licença',
    body: `Obrigado pela compra. Este ficheiro é licenciado para uso pessoal. Imprima-o, pendure-o, partilhe com a família, use como papel de parede. Por favor não o revenda, redistribua ou use para fins comerciais sem me contactar primeiro. Se quiser usá-lo para algo maior, fale comigo em {email} e resolvemos.`,
    back: 'Voltar ao portfólio',
  },
  es: {
    title: 'Términos de Licencia',
    body: `Gracias por tu compra. Este archivo está licenciado para uso personal. Imprímelo, cuélgalo, compártelo con la familia, úsalo como fondo de pantalla. Por favor no lo revendas, redistribuyas o uses con fines comerciales sin contactarme primero. Si quieres usarlo para algo más grande, escríbeme a {email} y lo resolvemos.`,
    back: 'Volver al portafolio',
  },
  fr: {
    title: 'Conditions de Licence',
    body: `Merci pour votre achat. Ce fichier vous est accordé sous licence pour usage personnel. Imprimez-le, accrochez-le, partagez-le en famille, utilisez-le comme fond d'écran. Merci de ne pas le revendre, redistribuer ou utiliser à des fins commerciales sans me contacter au préalable. Si vous souhaitez une utilisation plus large, contactez-moi à {email} et on s'arrangera.`,
    back: 'Retour au portfolio',
  },
  it: {
    title: 'Termini di Licenza',
    body: `Grazie per l'acquisto. Questo file è concesso in licenza per uso personale. Stampalo, appendilo, condividilo con la famiglia, usalo come sfondo. Non rivenderlo, ridistribuirlo o usarlo per scopi commerciali senza contattarmi prima. Se vuoi usarlo per qualcosa di più grande, scrivimi a {email} e troviamo una soluzione.`,
    back: 'Torna al portfolio',
  },
  de: {
    title: 'Lizenzbedingungen',
    body: `Danke für Ihren Kauf. Diese Datei ist Ihnen für den persönlichen Gebrauch lizenziert. Drucken Sie sie aus, hängen Sie sie auf, teilen Sie sie mit der Familie, verwenden Sie sie als Hintergrundbild. Bitte verkaufen Sie sie nicht weiter, verbreiten Sie die Datei nicht oder verwenden Sie sie für kommerzielle Zwecke, ohne mich vorher zu kontaktieren. Wenn Sie sie für etwas Größeres nutzen möchten, schreiben Sie mir an {email} und wir finden eine Lösung.`,
    back: 'Zurück zum Portfolio',
  },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@davejavu.com';

export function generateMetadata({ params: { locale } }) {
  const t = LICENSE_TEXT[locale] || LICENSE_TEXT.en;
  return { title: `${t.title} — DAVEJAVU` };
}

export default async function LicensePage({ params }) {
  const { locale } = await params;
  const t = LICENSE_TEXT[locale] || LICENSE_TEXT.en;
  const bodyText = t.body.replace('{email}', CONTACT_EMAIL);

  return (
    <main className="min-h-screen bg-[#FAF9F6] pt-[72px]">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-mid-gray hover:text-orange transition-colors mb-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t.back}
        </Link>

        <h1 className="font-display text-4xl text-charcoal mb-10">{t.title}</h1>

        <p className="text-base text-charcoal leading-relaxed">
          {bodyText.split(CONTACT_EMAIL).map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-orange underline hover:no-underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>

        <hr className="border-[#d1d1d1] my-10" />

        <div className="text-xs text-mid-gray space-y-2">
          <p>Tiers sold: Web / Small Print (2000px, personal use · €15) and Full Resolution (native, personal use · €49).</p>
          <p>The photographer retains full copyright in all cases. A purchase grants a personal-use license only.</p>
          <p>For commercial, editorial, advertising, or product use — <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-orange transition-colors">contact me directly</a>.</p>
        </div>
      </div>
    </main>
  );
}
