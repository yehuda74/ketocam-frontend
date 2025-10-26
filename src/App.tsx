import React, { useMemo, useRef, useState } from "react";
import "./App.css";

/* ---------- Types ---------- */

type Swap = { ingredient: string; issue: string; swap: string; why: string };

export type KetoResult = {
  mealName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  sugarAlcohols?: number;
  sodium: number;
  netCarbs: number;

  ketoFriendly: boolean;
  ketoReason: string;

  flaggedIngredients?: string[];
  processingFlags?: string[];
  healthWarnings?: string[];
  swaps?: Swap[];

  confidenceScore: number; // 0..1
  healthScore: number;     // 0..10

  // Optional (if your n8n adds them)
  ketoScore?: number;      // 0..10
  verdict?: string;        // "Keto-friendly" | "Not keto-friendly"
};

/* ---------- Env / helpers ---------- */

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
function requireApiUrl(): string {
  if (!API_URL) throw new Error("Set VITE_API_URL in .env.local");
  return API_URL;
}

function titleize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/* ---------- Component ---------- */

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<KetoResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setFile(f);
    setError(null);
  }

  /** Robust fetch that tolerates empty/non-JSON responses and shows clear errors */
  async function analyze() {
    setError(null);
    setData(null);
    if (!file) {
      setError("Choose a meal image first.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file); // <-- must be "image" to match your webhook

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(requireApiUrl(), {
        method: "POST",
        body: form,
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeout);

      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 300)}`);
      if (!raw.trim()) throw new Error("Empty response from server.");

      let json: any;
      try {
        json = contentType.includes("application/json") ? JSON.parse(raw) : JSON.parse(raw);
      } catch {
        throw new Error(`Expected JSON but got:\n${raw.slice(0, 300)}`);
      }

      setData(json as KetoResult);
    } catch (e: any) {
      if (e?.name === "AbortError") setError("Request timed out (30s). Try again.");
      else setError(e?.message ?? "Request failed. Check VITE_API_URL and n8n.");
    } finally {
      setLoading(false);
    }
  }

  // Prefer backend verdict if present; otherwise derive from netCarbs (< 25)
  const isKeto = data?.ketoFriendly ?? ((data?.netCarbs ?? Infinity) < 25);

  return (
    <div className="viewport">
      <div className="phone">
        <div className="notch" />
        <div className="screen">
          {/* Centered hero */}
          <div className="heroCenter">
            <div className="appicon">🍔</div>
            <h1 className="heroTitle">KetoCam AI</h1>
            <p className="heroSub">
              <strong>Snap a pic to get your Keto Meal Analysis</strong>
            </p>
          </div>

          {/* Upload card */}
          <div
            className="uploadCard glass"
            role="button"
            aria-label="Upload your meal"
            onClick={openPicker}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <div className="cameraCircle">
              <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
                <g fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 19.5v-10A2.5 2.5 0 0 1 6 7h2l1.4-2.3A2 2 0 0 1 11.1 4h1.8a2 2 0 0 1 1.7.9L16 7h2a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 19.5Z" />
                  <circle cx="12" cy="14" r="4.2" />
                </g>
              </svg>
            </div>

            <h2 className="uploadTitle">Upload your meal</h2>
            <p className="uploadSub">Take a photo or upload from gallery</p>
            <p className="uploadHint">
              <svg className="uploadIcon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Drag &amp; drop or tap to upload
            </p>

            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFile}
            />

            {previewUrl && (
              <div className="preview">
                <img src={previewUrl} alt="Meal preview" />
              </div>
            )}
          </div>

          {/* Analyze CTA after image chosen */}
          {file && (
            <div className="panel glass">
              <button className="cta" onClick={analyze} disabled={loading}>
                {loading ? "Analyzing…" : "Analyze Meal"}
              </button>
              {error && <div className="toast error">{error}</div>}
            </div>
          )}

          {/* Results */}
          {data && (
            <div className="panel glass result">
              <div className="topBadgeRow">
                <button className={`topBadge ${isKeto ? "ok" : "no"}`}>
                  {isKeto ? "Keto Friendly" : "Not Keto Friendly"}
                </button>
              </div>

              <div className="row between">
                <h3 className="meal">{data.mealName || "Unknown meal"}</h3>
              </div>
              <p className="reason">
                <strong>{data.ketoReason}</strong>
              </p>

              <div className="macros">
                <div className={`pill ${data.netCarbs > 8 ? "warn" : ""}`}>
                  <div className="k">Net Carbs</div>
                  <div className="v">{data.netCarbs} g</div>
                </div>
                <div className="pill">
                  <div className="k">Calories</div>
                  <div className="v">{data.calories}</div>
                </div>
                <div className="pill">
                  <div className="k">Fat</div>
                  <div className="v">{data.fat} g</div>
                </div>
                <div className="pill">
                  <div className="k">Protein</div>
                  <div className="v">{data.protein} g</div>
                </div>
              </div>

              {!!data.processingFlags?.length && (
                <>
                  <h4>Warnings</h4>
                  <div className="chips">
                    {data.processingFlags.map((f, i) => (
                      <span className="chip" key={i}>
                        {titleize(f)}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {!!data.swaps?.length && (
                <>
                  <h4>Cleaner swaps</h4>
                  <ul className="swaps">
                    {data.swaps.map((s, i) => (
                      <li key={i}>
                        <strong>{s.ingredient}</strong> → {s.swap}{" "}
                        <span className="muted">({s.why})</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="scores">
                <div>
                  <strong>Confidence:&nbsp;</strong>
                  {Math.round((data.confidenceScore ?? 0) * 100)}%
                  &nbsp; · &nbsp;
                  <strong>Health score:&nbsp;</strong>
                  {data.healthScore}/10
                  {typeof data.ketoScore === "number" && (
                    <>
                      &nbsp; · &nbsp;<strong>Keto score:</strong>&nbsp;{data.ketoScore} / 10
                    </>
                  )}
                  {data.verdict && (
                    <>
                      &nbsp; · &nbsp;<strong>Verdict:</strong>&nbsp;{data.verdict}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="spacer" />
        </div>
      </div>
    </div>
  );
}