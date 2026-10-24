import MapExplorer from "@/components/MapExplorer";
import PageHead from "@/components/PageHead";

export const metadata = { title: "Road Health Map | NagarNazar" };

export default function MapPage() {
  return (
    <div className="wrap page">
      <PageHead title="Road health map" sub="Every road scored 0 to 100 from live reports. Click a pin for evidence and status." />
      <MapExplorer />
    </div>
  );
}
