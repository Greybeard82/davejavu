export default function CollectionPage({ params }) {
  const { slug } = params;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">Collection</h1>
      <p className="mt-2 text-sm text-gray-300">Placeholder for slug: {slug}</p>
    </main>
  );
}
