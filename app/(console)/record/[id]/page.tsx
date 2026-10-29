"use client";
import { useParams } from "next/navigation";
import Shell from "@/components/Shell";
import RecordView from "@/components/RecordView";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function RecordPage() {
  const { id } = useParams<{ id: string }>();
  const rec = useStore((s) => s.records.find((r) => r.id === id));
  const t = useT();
  return <Shell crumbs={["Evidence", id]}>{rec ? <RecordView record={rec} /> : <div className="empty">{t("Record not found.")}</div>}</Shell>;
}
