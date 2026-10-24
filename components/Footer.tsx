import { PROJECT } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="lane" style={{ marginBottom: 28 }} />
        <div className="foot-row">
          <div className="fl">
            {PROJECT.name} <b>{PROJECT.tagline}</b>
          </div>
          <div className="fl">
            {PROJECT.team.join(", ")}. Guide: {PROJECT.guide}
          </div>
        </div>
      </div>
    </footer>
  );
}
