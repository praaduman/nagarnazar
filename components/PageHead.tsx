export default function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {sub ? <p>{sub}</p> : null}
    </div>
  );
}
