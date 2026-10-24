import type { Status } from "@/lib/types";
import { STATUS_CLASS, STATUS_LABEL } from "@/lib/format";

export default function StatusPill({ status }: { status: Status | "clear" }) {
  if (status === "clear") return <span className="status-pill st-res">All clear</span>;
  return <span className={`status-pill ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
