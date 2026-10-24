import PageHead from "@/components/PageHead";
import SafeRouteView from "@/components/SafeRouteView";

export const metadata = { title: "SafeRoute | NagarNazar" };

export default function SafeRoutePage() {
  return (
    <div className="wrap page">
      <PageHead title="SafeRoute: fastest isn't always best." sub="Compare the quickest path with one that avoids the worst road surfaces." />
      <SafeRouteView />
    </div>
  );
}
