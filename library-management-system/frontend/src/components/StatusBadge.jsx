export default function StatusBadge({ status }) {
  const cls = status === "available" ? "available" : "borrowed";
  return <span className={`badge ${cls}`}>{status}</span>;
}
