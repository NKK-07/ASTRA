"use client";
import { useState } from "react";
import { Panel, Tag, fmtDate, fmtSize, fmtTime } from "./ui";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { facility } from "@/lib/data/catalog";
import { sha256Hex, shortHash } from "@/lib/core/seal";
import seedFiles from "@/lib/data/seed-files.json";
import type { EvidenceFile, TrialRecord } from "@/lib/types";
import { testName } from "./reasons";

type VerifyResult = { valid: boolean; digestMatches: boolean; signatureValid: boolean; signedByCurrentKey: boolean; checkedAt: string; tampered?: boolean };

export async function verifyRecord(r: TrialRecord, tamper = false): Promise<VerifyResult> {
  const rec = tamper ? { ...r, files: r.files.map((f, i) => (i === 0 ? { ...f, size: f.size + 1 } : f)) } : r;
  const res = await fetch("/api/v1/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ record: rec, seal: r.seal }) });
  if (!res.ok) throw new Error("verify failed");
  return { ...(await res.json()), tampered: tamper };
}

async function hashFiles(list: FileList | File[]): Promise<EvidenceFile[]> {
  const out: EvidenceFile[] = [];
  for (const f of Array.from(list)) {
    out.push({ name: f.name, kind: f.type || "file", size: f.size, sha256: await sha256Hex(await f.arrayBuffer()) });
  }
  return out;
}

export function Drop({ label, onFiles, multiple = true }: { label: string; onFiles: (f: File[]) => void; multiple?: boolean }) {
  const [over, setOver] = useState(false);
  const t = useT();
  return (
    <label className={`drop ${over ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(Array.from(e.dataTransfer.files)); }}>
      <input type="file" multiple={multiple} onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))} />
      {label}<div className="notice mt8">{t("Hashed with SHA-256 in your browser. Files are not uploaded.")}</div>
    </label>
  );
}

function downloadSeed(recordId: string, name: string) {
  const f = (seedFiles as Record<string, { name: string; content: string }[]>)[recordId]?.find((x) => x.name === name);
  if (!f) return;
  const url = URL.createObjectURL(new Blob([f.content], { type: "text/plain" }));
  const a = document.createElement("a"); a.href = url; a.download = f.name; a.click(); URL.revokeObjectURL(url);
}

export default function RecordView({ record }: { record: TrialRecord }) {
  const s = useStore();
  const t = useT();
  const role = s.role;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [fileCheck, setFileCheck] = useState<{ name: string; hash: string; match?: string }[]>([]);
  const [body, setBody] = useState<"DGAQA" | "DGQA" | "CEMILAC">("DGAQA");
  const [err, setErr] = useState("");
  const product = s.products.find((p) => p.id === record.productId);
  const fac = facility(record.facilityId);
  const sealed = !!record.seal;
  const allSigned = record.requiredSignoffs.every((r) => record.signoffs.some((x) => x.role === r));
  const hasSeedFiles = !!(seedFiles as Record<string, unknown>)[record.id];

  async function doSeal() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/v1/seal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ record }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      s.seal(record.id, j);
    } catch (e) { setErr(t("Sealing failed: {m}", { m: (e as Error).message })); }
    setBusy(false);
  }
  async function doVerify(tamper = false) {
    setBusy(true); setErr("");
    try {
      const r = await verifyRecord(record, tamper);
      setResult(r);
      if (!tamper) {
        const ins = s.inspections.find((i) => i.recordId === record.id && i.integrity !== (r.valid ? "verified" : "failed"));
        if (ins && role === "qa") s.setIntegrity(ins.id, r.valid ? "verified" : "failed");
        s.log(r.valid ? "Verified record integrity" : "Integrity check failed", record.id);
      }
    } catch { setErr(t("Verification service unreachable.")); }
    setBusy(false);
  }
  async function checkFiles(files: File[]) {
    const hashed = await hashFiles(files);
    setFileCheck(hashed.map((h) => ({ name: h.name, hash: h.sha256, match: record.files.find((f) => f.sha256 === h.sha256)?.name })));
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="head">
        <div>
          <p className="eyebrow">05 · {t("Evidence")} · {testName(t, record.test)}</p>
          <h1 className="h1">{t("Trial record")} <span className="mono" style={{ fontSize: 26 }}>{record.id}</span></h1>
          <p className="sub">{product?.name} · {t(fac?.name ?? "")} · {fmtDate(record.date)}</p>
        </div>
        <div className="row">
          <Tag tone={sealed ? "i" : "a"}>{sealed ? t("Sealed and signed") : t("Open")}</Tag>
          {sealed && <button className="btn" disabled={busy} onClick={() => doVerify(false)}>{t("Verify integrity")}</button>}
          {sealed && <button className="btn g" disabled={busy} onClick={() => doVerify(true)}>{t("Try a tampered copy")}</button>}
        </div>
      </div>

      {result && (
        <div className={`banner ${result.valid ? "i" : ""}`} style={!result.valid ? { borderColor: "rgba(255,93,82,.4)", background: "var(--red-dim)" } : undefined}>
          <Tag tone={result.valid ? "i" : "r"}>{result.valid ? t("Verified") : t("Failed")}</Tag>
          <span className="x"><b>{result.valid ? t("All {n} file hashes and sign-offs match the seal.", { n: record.files.length }) : result.tampered ? t("Tampered copy detected: one file's details changed, so the digest no longer matches the seal.") : t("The record no longer matches its seal.")}</b>
            {" "}{result.digestMatches ? t("Digest matches") : t("Digest differs")} · {result.signatureValid ? t("Ed25519 signature valid") : t("Ed25519 signature invalid")} · {result.signedByCurrentKey ? t("current platform key") : t("older platform key")} · {fmtTime(result.checkedAt)}</span>
        </div>
      )}
      {err && <div className="banner" style={{ borderColor: "rgba(255,93,82,.4)" }}><Tag tone="r">{t("Error")}</Tag><span className="x">{err}</span></div>}

      <div className="grid g-73">
        <div className="stack">
          <Panel title={t("Files")} meta="SHA-256">
            {record.files.length === 0 ? <div className="empty">{t("No files yet.")}</div> : (
              <div className="tw"><table className="dense"><thead><tr><th>{t("File")}</th><th>{t("Type")}</th><th className="r">{t("Size")}</th><th>SHA-256</th>{hasSeedFiles && <th></th>}</tr></thead><tbody>
                {record.files.map((f) => (
                  <tr key={f.name + f.sha256}><td>{f.name}</td><td className="muted">{t(f.kind)}</td><td className="r mono">{fmtSize(f.size)}</td><td className="hash" title={f.sha256}>{shortHash(f.sha256)}</td>
                    {hasSeedFiles && <td className="r"><button className="btn g" style={{ height: 26 }} onClick={() => downloadSeed(record.id, f.name)}>{t("Download")}</button></td>}</tr>
                ))}
              </tbody></table></div>
            )}
            {!sealed && role === "operator" && <div className="pb"><Drop label={t("Drop instrument data, photos and reports here, or click to choose")} onFiles={async (fs) => s.addFiles(record.id, await hashFiles(fs))} /></div>}
          </Panel>
          {sealed && (
            <Panel title={t("Check a file against this record")}>
              <div className="pb stack">
                <Drop label={hasSeedFiles ? t("Drop a file (try one you downloaded above) to check it is the sealed original") : t("Drop a file to check it is the sealed original")} onFiles={checkFiles} />
                {fileCheck.map((c) => (
                  <div key={c.name + c.hash} className="row"><Tag tone={c.match ? "i" : "r"}>{c.match ? t("Match") : t("No match")}</Tag><span className="small">{c.name}</span><span className="hash">{shortHash(c.hash)}</span>{c.match && <span className="muted small">= {t("sealed")} {c.match}</span>}</div>
                ))}
              </div>
            </Panel>
          )}
        </div>
        <div className="stack">
          <Panel title={t("Sign-offs")} meta={`${record.signoffs.length} / ${record.requiredSignoffs.length}`}>
            {record.requiredSignoffs.map((r) => {
              const so = record.signoffs.find((x) => x.role === r);
              const maySign = !sealed && !so && (role === "operator" || (role === "applicant" && r === "Firm test lead"));
              return (
                <div className="li" key={r}><span className={`box ${so ? "y" : ""}`}>{so ? "✓" : ""}</span><span className="x"><b>{t(r)}</b><span>{so ? `${t(so.name)} · ${fmtTime(so.at)}` : t("Not signed")}</span></span>
                  {maySign && <button className="btn" onClick={() => s.signOff(record.id, { role: r, name: role === "applicant" ? "Ananya Rao" : r.startsWith("Range officer") ? "Vikram Singh" : r.startsWith("Observer") ? "Maj. K. Bhatt" : "Ananya Rao", at: new Date().toISOString() })}>{t("Sign")}</button>}
                </div>
              );
            })}
          </Panel>
          <Panel title={t("Seal")}>
            <div className="pb stack">
              {sealed ? (
                <dl className="kv">
                  <dt>{t("Digest")}</dt><dd className="mono" title={record.seal!.digest}>{shortHash(record.seal!.digest)}</dd>
                  <dt>{t("Signature")}</dt><dd>Ed25519 · {t("key")} {record.seal!.keyId}</dd>
                  <dt>{t("Sealed")}</dt><dd>{fmtTime(record.seal!.signedAt)}</dd>
                  <dt>{t("Shared")}</dt><dd>{record.sharedWith.length ? record.sharedWith.join(", ") : t("Not yet")}</dd>
                </dl>
              ) : (
                <>
                  <p className="small muted">{t("Sealing hashes the file list and sign-offs into one digest and signs it with the platform key. After that, any change shows up on verification.")}</p>
                  {role === "operator" && <button className="btn p" disabled={busy || !allSigned || record.files.length === 0} onClick={doSeal}>{t("Seal record")}</button>}
                  {(!allSigned || record.files.length === 0) && <p className="notice">{t("Needs at least one file and all {n} sign-offs.", { n: record.requiredSignoffs.length })}</p>}
                </>
              )}
              {sealed && role === "applicant" && (
                <div className="row">
                  <select className="input" value={body} onChange={(e) => setBody(e.target.value as typeof body)} aria-label={t("QA body")}><option>DGAQA</option><option>DGQA</option><option>CEMILAC</option></select>
                  <button className="btn p" disabled={record.sharedWith.includes(body)} onClick={() => s.share(record.id, body)}>{record.sharedWith.includes(body) ? t("Shared with {body}", { body }) : `${t("Share with QA")}: ${body}`}</button>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
