import PageHead from "@/components/PageHead";
import ReportForm from "@/components/ReportForm";

export const metadata = { title: "Report an issue | NagarNazar" };

export default function ReportPage() {
  return (
    <div className="wrap page">
      <PageHead title="Report an issue" sub="Pick the spot on the map, add a photo and send it. Duplicates merge automatically." />
      <ReportForm />
    </div>
  );
}
