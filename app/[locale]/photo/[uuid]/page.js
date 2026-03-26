export default function PhotoPage({ params }) {
  const { uuid } = params;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">Photo</h1>
      <p className="mt-2 text-sm text-gray-300">Placeholder page for UUID: {uuid}</p>
    </main>
  );
}
