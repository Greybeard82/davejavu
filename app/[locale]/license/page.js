import Link from 'next/link';

const CONTACT_EMAIL = 'contact@davejavuphoto.com';

const T = {
  en: {
    title: 'Terms & Conditions',
    back: 'Back to portfolio',
    lastUpdated: 'Last updated: April 2026',
    sections: [
      {
        heading: '1. What you are buying',
        body: `You are purchasing a digital license to use a photograph for personal, non-commercial purposes. You are not purchasing a physical print. You are not acquiring copyright, ownership, or any intellectual property rights in the photograph.`,
      },
      {
        heading: '2. License grant',
        body: `Upon payment, DAVEJAVU grants you a non-exclusive, non-transferable, worldwide license to use the licensed photograph for personal use only, including: printing for personal display at home or in a private office; use as a screensaver or digital wallpaper; and sharing with family and friends in non-commercial contexts.`,
      },
      {
        heading: '3. Prohibited uses',
        body: `The license does not permit: any commercial use (advertising, editorial, product placement, merchandise); resale or sub-licensing of the file or derived prints; public redistribution of the digital file; use in AI training datasets or machine learning models; use in NFTs or blockchain applications; removal or alteration of embedded copyright metadata.`,
      },
      {
        heading: '4. Copyright',
        body: `The photographer retains full and exclusive copyright in all photographs at all times. A purchase grants a personal-use license only and does not transfer copyright, moral rights, or any other intellectual property rights.`,
      },
      {
        heading: '5. Delivery',
        body: `Files are delivered as high-quality JPEG files via a time-limited download link sent to the email address provided at checkout. Download links are valid for 14 days. If your link expires before you download, contact ${CONTACT_EMAIL} and a replacement will be issued.`,
      },
      {
        heading: '6. No-refund policy',
        body: `In accordance with Article 16(m) of the EU Consumer Rights Directive (2011/83/EU), the right of withdrawal does not apply to digital content made available immediately after purchase. By ticking the checkbox at checkout and proceeding with payment, you expressly consent to the immediate supply of digital content and acknowledge that you thereby waive your right of withdrawal. No refunds will be issued once a download link has been generated.`,
      },
      {
        heading: '7. Embedded metadata',
        body: `Each purchased file contains embedded EXIF and IPTC metadata identifying the buyer's email address and PayPal order ID. This metadata is used solely for copyright enforcement and is not shared with third parties.`,
      },
      {
        heading: '8. Data protection (GDPR)',
        body: `Controller: David Martins / DAVEJAVU — ${CONTACT_EMAIL}.\n\nData collected: your name and email address, received from PayPal at the time of purchase.\n\nPurpose & legal basis: order fulfilment and download delivery (Art. 6(1)(b) GDPR — performance of a contract); compliance with accounting and tax obligations (Art. 6(1)(c) GDPR — legal obligation).\n\nRetention: purchase records are kept for 7 years as required by Spanish accounting law (Ley 58/2003 General Tributaria). Contact records are deleted after 2 years.\n\nProcessors: PayPal (payment processing), Resend (transactional email), Supabase (database). All processors operate under GDPR-compliant data processing agreements.\n\nYour rights: you have the right to access, rectify, restrict processing, or request erasure of your personal data. Note that purchase records required for legal compliance cannot be erased during the mandatory retention period. To exercise your rights, email ${CONTACT_EMAIL}.`,
      },
      {
        heading: '9. Governing law',
        body: `These terms are governed by Spanish law. Any disputes shall be subject to the exclusive jurisdiction of the courts of Barcelona, Spain, without prejudice to your statutory rights as a consumer under the law of your country of residence within the European Union.`,
      },
      {
        heading: '10. Contact',
        body: `For any questions about these terms or your purchase, contact ${CONTACT_EMAIL}.`,
      },
    ],
  },
  es: {
    title: 'Términos y Condiciones',
    back: 'Volver al portafolio',
    lastUpdated: 'Última actualización: abril de 2026',
    sections: [
      { heading: '1. Qué estás comprando', body: `Estás adquiriendo una licencia digital para usar una fotografía con fines personales y no comerciales. No estás comprando una impresión física. No adquieres derechos de autor, propiedad ni ningún derecho de propiedad intelectual sobre la fotografía.` },
      { heading: '2. Concesión de licencia', body: `Tras el pago, DAVEJAVU te otorga una licencia mundial no exclusiva e intransferible para usar la fotografía licenciada únicamente para uso personal, incluyendo: impresión para uso decorativo en casa u oficina privada; uso como salvapantallas o fondo de escritorio; y compartir con familiares y amigos en contextos no comerciales.` },
      { heading: '3. Usos prohibidos', body: `La licencia no permite: ningún uso comercial (publicidad, editorial, colocación de productos, merchandising); reventa o sublicencia del archivo o copias derivadas; redistribución pública del archivo digital; uso en conjuntos de datos de entrenamiento de IA o modelos de aprendizaje automático; uso en NFTs o aplicaciones de blockchain; eliminación o alteración de los metadatos de derechos de autor incrustados.` },
      { heading: '4. Derechos de autor', body: `El fotógrafo conserva en todo momento el copyright completo y exclusivo de todas las fotografías. Una compra otorga únicamente una licencia de uso personal y no transfiere derechos de autor, derechos morales ni ningún otro derecho de propiedad intelectual.` },
      { heading: '5. Entrega', body: `Los archivos se entregan como archivos JPEG de alta calidad mediante un enlace de descarga con tiempo limitado enviado al correo electrónico proporcionado en el momento de la compra. Los enlaces de descarga son válidos durante 14 días. Si tu enlace caduca antes de descargar, contacta a ${CONTACT_EMAIL} y se emitirá un reemplazo.` },
      { heading: '6. Política de no reembolso', body: `De conformidad con el artículo 16(m) de la Directiva de la UE sobre derechos de los consumidores (2011/83/UE), el derecho de desistimiento no se aplica al contenido digital puesto a disposición inmediatamente después de la compra. Al marcar la casilla en el proceso de pago y proceder con el pago, consientes expresamente el suministro inmediato de contenido digital y reconoces que renuncias a tu derecho de desistimiento. No se emitirán reembolsos una vez generado un enlace de descarga.` },
      { heading: '7. Metadatos incrustados', body: `Cada archivo comprado contiene metadatos EXIF e IPTC incrustados que identifican el correo electrónico del comprador y el ID de pedido de PayPal. Estos metadatos se utilizan únicamente para hacer cumplir los derechos de autor y no se comparten con terceros.` },
      { heading: '8. Protección de datos (RGPD)', body: `Responsable: David Martins / DAVEJAVU — ${CONTACT_EMAIL}.\n\nDatos recopilados: tu nombre y dirección de correo electrónico, recibidos de PayPal en el momento de la compra.\n\nFinalidad y base legal: cumplimiento del pedido y entrega de la descarga (Art. 6(1)(b) RGPD); cumplimiento de obligaciones contables y fiscales (Art. 6(1)(c) RGPD).\n\nConservación: los registros de compras se conservan durante 7 años según la legislación contable española (Ley 58/2003 General Tributaria).\n\nTus derechos: tienes derecho a acceder, rectificar, limitar el tratamiento o solicitar la supresión de tus datos personales. Escribe a ${CONTACT_EMAIL}.` },
      { heading: '9. Ley aplicable', body: `Estos términos se rigen por la legislación española. Cualquier disputa estará sujeta a la jurisdicción exclusiva de los tribunales de Barcelona, España, sin perjuicio de tus derechos como consumidor según la legislación de tu país de residencia en la Unión Europea.` },
      { heading: '10. Contacto', body: `Para cualquier pregunta sobre estos términos o tu compra, contacta a ${CONTACT_EMAIL}.` },
    ],
  },
  pt: {
    title: 'Termos e Condições',
    back: 'Voltar ao portfólio',
    lastUpdated: 'Última atualização: abril de 2026',
    sections: [
      { heading: '1. O que está a comprar', body: `Está a adquirir uma licença digital para utilizar uma fotografia para fins pessoais e não comerciais. Não está a comprar uma impressão física. Não adquire direitos de autor, propriedade nem quaisquer direitos de propriedade intelectual sobre a fotografia.` },
      { heading: '2. Concessão de licença', body: `Após o pagamento, a DAVEJAVU concede-lhe uma licença mundial não exclusiva e intransmissível para utilizar a fotografia licenciada apenas para uso pessoal, incluindo: impressão para exposição pessoal em casa ou escritório privado; uso como protetor de ecrã ou fundo de ambiente de trabalho; e partilha com familiares e amigos em contextos não comerciais.` },
      { heading: '3. Utilizações proibidas', body: `A licença não permite: qualquer uso comercial (publicidade, editorial, colocação de produtos, merchandising); revenda ou sublicenciamento do ficheiro ou cópias derivadas; redistribuição pública do ficheiro digital; uso em conjuntos de dados de treino de IA ou modelos de aprendizagem automática; uso em NFTs ou aplicações de blockchain; remoção ou alteração dos metadados de direitos de autor incorporados.` },
      { heading: '4. Direitos de autor', body: `O fotógrafo mantém em todo o momento os direitos de autor completos e exclusivos sobre todas as fotografias. A compra concede apenas uma licença de uso pessoal e não transfere direitos de autor, direitos morais nem quaisquer outros direitos de propriedade intelectual.` },
      { heading: '5. Entrega', body: `Os ficheiros são entregues como ficheiros JPEG de alta qualidade através de um link de download com prazo limitado enviado para o endereço de email fornecido no momento da compra. Os links de download são válidos durante 14 dias. Se o seu link expirar antes de descarregar, contacte ${CONTACT_EMAIL} e será emitido um substituto.` },
      { heading: '6. Política de não reembolso', body: `De acordo com o artigo 16.º, alínea m), da Diretiva da UE sobre os direitos dos consumidores (2011/83/UE), o direito de rescisão não se aplica ao conteúdo digital disponibilizado imediatamente após a compra. Ao assinalar a caixa de verificação no checkout e proceder ao pagamento, consente expressamente no fornecimento imediato de conteúdo digital e reconhece que renuncia ao seu direito de rescisão. Não serão emitidos reembolsos após a geração de um link de download.` },
      { heading: '7. Metadados incorporados', body: `Cada ficheiro comprado contém metadados EXIF e IPTC incorporados que identificam o endereço de email do comprador e o ID do pedido PayPal. Estes metadados são utilizados exclusivamente para efeitos de proteção dos direitos de autor e não são partilhados com terceiros.` },
      { heading: '8. Proteção de dados (RGPD)', body: `Responsável: David Martins / DAVEJAVU — ${CONTACT_EMAIL}.\n\nDados recolhidos: o seu nome e endereço de email, recebidos do PayPal no momento da compra.\n\nFinalidade e base legal: cumprimento do pedido e entrega do download (Art. 6.º, n.º 1, al. b) RGPD); cumprimento de obrigações contabilísticas e fiscais (Art. 6.º, n.º 1, al. c) RGPD).\n\nConservação: os registos de compras são conservados durante 7 anos conforme exigido pela lei contabilística espanhola.\n\nOs seus direitos: tem direito a aceder, retificar, limitar o tratamento ou solicitar o apagamento dos seus dados pessoais. Escreva para ${CONTACT_EMAIL}.` },
      { heading: '9. Lei aplicável', body: `Estes termos são regidos pela lei espanhola. Qualquer litígio ficará sujeito à jurisdição exclusiva dos tribunais de Barcelona, Espanha, sem prejuízo dos seus direitos como consumidor ao abrigo da legislação do seu país de residência na União Europeia.` },
      { heading: '10. Contacto', body: `Para qualquer questão sobre estes termos ou a sua compra, contacte ${CONTACT_EMAIL}.` },
    ],
  },
  fr: {
    title: 'Conditions Générales de Vente',
    back: 'Retour au portfolio',
    lastUpdated: 'Dernière mise à jour : avril 2026',
    sections: [
      { heading: '1. Ce que vous achetez', body: `Vous achetez une licence numérique pour utiliser une photographie à des fins personnelles et non commerciales. Vous n'achetez pas un tirage physique. Vous n'acquérez pas les droits d'auteur, la propriété ni aucun droit de propriété intellectuelle sur la photographie.` },
      { heading: '2. Octroi de licence', body: `Après paiement, DAVEJAVU vous accorde une licence mondiale non exclusive et non transférable pour utiliser la photographie sous licence à des fins personnelles uniquement, notamment : impression pour affichage personnel à domicile ou dans un bureau privé ; utilisation comme économiseur d'écran ou fond d'écran numérique ; partage avec la famille et les amis dans un contexte non commercial.` },
      { heading: '3. Utilisations interdites', body: `La licence n'autorise pas : toute utilisation commerciale (publicité, éditorial, placement de produit, merchandising) ; la revente ou sous-licence du fichier ou des impressions dérivées ; la redistribution publique du fichier numérique ; l'utilisation dans des ensembles de données d'entraînement IA ou des modèles d'apprentissage automatique ; l'utilisation dans des NFT ou applications blockchain ; la suppression ou modification des métadonnées de droit d'auteur intégrées.` },
      { heading: '4. Droit d'auteur', body: `Le photographe conserve à tout moment le droit d'auteur complet et exclusif sur toutes les photographies. Un achat n'accorde qu'une licence d'utilisation personnelle et ne transfère pas le droit d'auteur, les droits moraux ni aucun autre droit de propriété intellectuelle.` },
      { heading: '5. Livraison', body: `Les fichiers sont livrés en format JPEG haute qualité via un lien de téléchargement à durée limitée envoyé à l'adresse e-mail fournie lors du paiement. Les liens de téléchargement sont valables 14 jours. Si votre lien expire avant le téléchargement, contactez ${CONTACT_EMAIL} et un lien de remplacement sera émis.` },
      { heading: '6. Politique de non-remboursement', body: `Conformément à l'article 16(m) de la directive européenne sur les droits des consommateurs (2011/83/UE), le droit de rétractation ne s'applique pas aux contenus numériques mis à disposition immédiatement après l'achat. En cochant la case lors du paiement et en procédant au paiement, vous consentez expressément à la fourniture immédiate de contenu numérique et reconnaissez renoncer à votre droit de rétractation. Aucun remboursement ne sera accordé une fois un lien de téléchargement généré.` },
      { heading: '7. Métadonnées intégrées', body: `Chaque fichier acheté contient des métadonnées EXIF et IPTC intégrées identifiant l'adresse e-mail de l'acheteur et l'ID de commande PayPal. Ces métadonnées sont utilisées uniquement à des fins de protection du droit d'auteur et ne sont pas partagées avec des tiers.` },
      { heading: '8. Protection des données (RGPD)', body: `Responsable du traitement : David Martins / DAVEJAVU — ${CONTACT_EMAIL}.\n\nDonnées collectées : votre nom et adresse e-mail, reçus de PayPal lors de l'achat.\n\nFinalité et base légale : exécution de la commande et livraison du téléchargement (Art. 6(1)(b) RGPD) ; conformité aux obligations comptables et fiscales (Art. 6(1)(c) RGPD).\n\nConservation : les enregistrements d'achat sont conservés 7 ans conformément à la loi comptable espagnole.\n\nVos droits : vous avez le droit d'accéder, de rectifier, de limiter le traitement ou de demander l'effacement de vos données personnelles. Écrivez à ${CONTACT_EMAIL}.` },
      { heading: '9. Droit applicable', body: `Ces conditions sont régies par le droit espagnol. Tout litige sera soumis à la juridiction exclusive des tribunaux de Barcelone, Espagne, sans préjudice de vos droits en tant que consommateur selon la législation de votre pays de résidence dans l'Union européenne.` },
      { heading: '10. Contact', body: `Pour toute question concernant ces conditions ou votre achat, contactez ${CONTACT_EMAIL}.` },
    ],
  },
  it: {
    title: 'Termini e Condizioni',
    back: 'Torna al portfolio',
    lastUpdated: 'Ultimo aggiornamento: aprile 2026',
    sections: [
      { heading: '1. Cosa stai acquistando', body: `Stai acquistando una licenza digitale per utilizzare una fotografia per scopi personali e non commerciali. Non stai acquistando una stampa fisica. Non acquisisci diritti d'autore, proprietà né alcun diritto di proprietà intellettuale sulla fotografia.` },
      { heading: '2. Concessione della licenza', body: `Dopo il pagamento, DAVEJAVU ti concede una licenza mondiale non esclusiva e non trasferibile per utilizzare la fotografia licenziata esclusivamente per uso personale, tra cui: stampa per esposizione personale a casa o in ufficio privato; uso come screensaver o sfondo digitale; condivisione con familiari e amici in contesti non commerciali.` },
      { heading: '3. Usi vietati', body: `La licenza non consente: qualsiasi uso commerciale (pubblicità, editoriale, product placement, merchandising); rivendita o sublicenza del file o delle copie derivate; ridistribuzione pubblica del file digitale; utilizzo in dataset di addestramento IA o modelli di machine learning; utilizzo in NFT o applicazioni blockchain; rimozione o alterazione dei metadati di copyright incorporati.` },
      { heading: '4. Diritto d\'autore', body: `Il fotografo mantiene in ogni momento il copyright completo ed esclusivo su tutte le fotografie. Un acquisto concede solo una licenza per uso personale e non trasferisce diritti d'autore, diritti morali né alcun altro diritto di proprietà intellettuale.` },
      { heading: '5. Consegna', body: `I file vengono consegnati come file JPEG di alta qualità tramite un link di download a tempo limitato inviato all'indirizzo email fornito al momento del pagamento. I link di download sono validi per 14 giorni. Se il tuo link scade prima del download, contatta ${CONTACT_EMAIL} e verrà emesso un sostituto.` },
      { heading: '6. Politica di non rimborso', body: `Ai sensi dell'articolo 16(m) della direttiva UE sui diritti dei consumatori (2011/83/UE), il diritto di recesso non si applica ai contenuti digitali resi disponibili immediatamente dopo l'acquisto. Spuntando la casella al checkout e procedendo con il pagamento, acconsenti espressamente alla fornitura immediata di contenuti digitali e riconosci di rinunciare al tuo diritto di recesso. Non verranno emessi rimborsi una volta generato un link di download.` },
      { heading: '7. Metadati incorporati', body: `Ogni file acquistato contiene metadati EXIF e IPTC incorporati che identificano l'indirizzo email dell'acquirente e l'ID ordine PayPal. Questi metadati sono utilizzati esclusivamente per la tutela del copyright e non vengono condivisi con terzi.` },
      { heading: '8. Protezione dei dati (GDPR)', body: `Titolare del trattamento: David Martins / DAVEJAVU — ${CONTACT_EMAIL}.\n\nDati raccolti: il tuo nome e indirizzo email, ricevuti da PayPal al momento dell'acquisto.\n\nFinalità e base giuridica: esecuzione dell'ordine e consegna del download (Art. 6(1)(b) GDPR); conformità agli obblighi contabili e fiscali (Art. 6(1)(c) GDPR).\n\nConservazione: i registri degli acquisti sono conservati per 7 anni come richiesto dalla legge contabile spagnola.\n\nI tuoi diritti: hai il diritto di accedere, rettificare, limitare il trattamento o richiedere la cancellazione dei tuoi dati personali. Scrivi a ${CONTACT_EMAIL}.` },
      { heading: '9. Legge applicabile', body: `Questi termini sono regolati dalla legge spagnola. Qualsiasi controversia sarà soggetta alla giurisdizione esclusiva dei tribunali di Barcellona, Spagna, fatti salvi i tuoi diritti come consumatore ai sensi della legislazione del tuo paese di residenza nell'Unione europea.` },
      { heading: '10. Contatto', body: `Per qualsiasi domanda su questi termini o sul tuo acquisto, contatta ${CONTACT_EMAIL}.` },
    ],
  },
  de: {
    title: 'Allgemeine Geschäftsbedingungen',
    back: 'Zurück zum Portfolio',
    lastUpdated: 'Zuletzt aktualisiert: April 2026',
    sections: [
      { heading: '1. Was Sie kaufen', body: `Sie erwerben eine digitale Lizenz zur persönlichen, nicht-kommerziellen Nutzung einer Fotografie. Sie erwerben keinen physischen Druck. Sie erwerben kein Urheberrecht, kein Eigentum und keine sonstigen Rechte des geistigen Eigentums an der Fotografie.` },
      { heading: '2. Lizenzgewährung', body: `Nach der Zahlung gewährt Ihnen DAVEJAVU eine nicht-exklusive, nicht übertragbare, weltweite Lizenz zur ausschließlich persönlichen Nutzung der lizenzierten Fotografie, einschließlich: Druck zur persönlichen Dekoration zu Hause oder im privaten Büro; Verwendung als Bildschirmschoner oder digitales Hintergrundbild; Teilen mit Familie und Freunden in nicht-kommerziellen Zusammenhängen.` },
      { heading: '3. Verbotene Nutzungen', body: `Die Lizenz erlaubt nicht: jegliche kommerzielle Nutzung (Werbung, Redaktion, Produktplatzierung, Merchandising); Weiterverkauf oder Unterlizenzierung der Datei oder abgeleiteter Drucke; öffentliche Verbreitung der digitalen Datei; Nutzung in KI-Trainingsdatensätzen oder maschinellen Lernmodellen; Nutzung in NFTs oder Blockchain-Anwendungen; Entfernung oder Änderung eingebetteter Urheberrechts-Metadaten.` },
      { heading: '4. Urheberrecht', body: `Der Fotograf behält jederzeit das vollständige und ausschließliche Urheberrecht an allen Fotografien. Ein Kauf gewährt lediglich eine Lizenz zur persönlichen Nutzung und überträgt keine Urheberrechte, Persönlichkeitsrechte oder sonstige Rechte des geistigen Eigentums.` },
      { heading: '5. Lieferung', body: `Dateien werden als hochwertige JPEG-Dateien über einen zeitlich begrenzten Download-Link geliefert, der an die beim Kauf angegebene E-Mail-Adresse gesendet wird. Download-Links sind 14 Tage lang gültig. Wenn Ihr Link vor dem Download abläuft, kontaktieren Sie ${CONTACT_EMAIL} und ein Ersatzlink wird ausgestellt.` },
      { heading: '6. Keine-Rückgabe-Richtlinie', body: `Gemäß Artikel 16(m) der EU-Verbraucherrechterichtlinie (2011/83/EU) gilt das Widerrufsrecht nicht für digitale Inhalte, die unmittelbar nach dem Kauf zur Verfügung gestellt werden. Durch das Ankreuzen der Checkbox beim Checkout und die Durchführung der Zahlung stimmen Sie ausdrücklich der sofortigen Bereitstellung digitaler Inhalte zu und bestätigen, dass Sie Ihr Widerrufsrecht damit aufgeben. Nach Generierung eines Download-Links werden keine Rückerstattungen gewährt.` },
      { heading: '7. Eingebettete Metadaten', body: `Jede gekaufte Datei enthält eingebettete EXIF- und IPTC-Metadaten, die die E-Mail-Adresse des Käufers und die PayPal-Bestellnummer identifizieren. Diese Metadaten werden ausschließlich zur Durchsetzung des Urheberrechts verwendet und nicht an Dritte weitergegeben.` },
      { heading: '8. Datenschutz (DSGVO)', body: `Verantwortlicher: David Martins / DAVEJAVU — ${CONTACT_EMAIL}.\n\nErhobene Daten: Ihr Name und Ihre E-Mail-Adresse, die zum Zeitpunkt des Kaufs von PayPal empfangen werden.\n\nZweck und Rechtsgrundlage: Auftragsabwicklung und Download-Lieferung (Art. 6(1)(b) DSGVO); Erfüllung buchhalterischer und steuerlicher Pflichten (Art. 6(1)(c) DSGVO).\n\nSpeicherung: Kaufaufzeichnungen werden gemäß spanischem Buchführungsrecht 7 Jahre aufbewahrt.\n\nIhre Rechte: Sie haben das Recht auf Auskunft, Berichtigung, Einschränkung der Verarbeitung oder Löschung Ihrer personenbezogenen Daten. Schreiben Sie an ${CONTACT_EMAIL}.` },
      { heading: '9. Anwendbares Recht', body: `Diese Bedingungen unterliegen spanischem Recht. Alle Streitigkeiten unterliegen der ausschließlichen Zuständigkeit der Gerichte in Barcelona, Spanien, unbeschadet Ihrer Rechte als Verbraucher nach dem Recht Ihres Wohnsitzlandes in der Europäischen Union.` },
      { heading: '10. Kontakt', body: `Bei Fragen zu diesen Bedingungen oder Ihrem Kauf wenden Sie sich an ${CONTACT_EMAIL}.` },
    ],
  },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = T[locale] || T.en;
  return { title: `${t.title} — DAVEJAVU` };
}

export default async function LicensePage({ params }) {
  const { locale } = await params;
  const t = T[locale] || T.en;

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

        <h1 className="text-4xl font-700 text-charcoal mb-2 tracking-tight">{t.title}</h1>
        <p className="text-xs text-mid-gray mb-12">{t.lastUpdated}</p>

        <div className="flex flex-col gap-10">
          {t.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-sm font-700 text-charcoal uppercase tracking-widest mb-3">{s.heading}</h2>
              {s.body.split('\n\n').map((para, i) => (
                <p key={i} className="text-sm text-charcoal leading-relaxed mb-3">{para}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
