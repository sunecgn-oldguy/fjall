export default function MapPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-stone-800">Kort</h1>
      <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
        <p className="text-stone-500 text-lg">
          Kortsíðan verður gjørd í Fasa 3 við Leaflet.
        </p>
        <p className="text-stone-400 text-sm mt-2">
          Her kemur eitt interaktivt kort við GPS-markering.
        </p>
      </div>
    </div>
  );
}
