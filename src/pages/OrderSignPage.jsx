import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function OrderSignPage({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  const [signerName, setSignerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSig, setHasSig] = useState(false);

  const fmtDate = (val) => {
    if (!val) return "—";
    const d = new Date(typeof val === "number" ? val : val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  useEffect(() => {
    const load = async () => {
      const { data: result, error } = await supabase.rpc("get_order_by_sign_token", { p_token: token });
      if (error || !result) { setNotFound(true); setLoading(false); return; }
      setData(result);
      if (result.customerSignature) setAlreadySigned(true);
      setLoading(false);
    };
    load();
  }, [token]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a2e";
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSig(true);
  };

  const stopDraw = () => { drawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasSig) { setError("Please sign in the box above."); return; }
    if (!signerName.trim()) { setError("Please enter your name."); return; }
    setError("");
    setSubmitting(true);
    const signature = canvasRef.current.toDataURL("image/png");
    const { error: rpcErr } = await supabase.rpc("sign_order", {
      p_token: token,
      p_name: signerName.trim(),
      p_signature: signature,
    });
    if (rpcErr) { setError("Failed to save signature. Please try again."); setSubmitting(false); return; }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return (
    <div style={centerStyle}>
      <div style={{ fontSize: 16, color: "#666" }}>Loading order…</div>
    </div>
  );

  if (notFound) return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Order Not Found</h2>
        <p style={{ color: "#888", fontSize: 14 }}>This link may be invalid or expired.</p>
      </div>
    </div>
  );

  if (submitted || alreadySigned) return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#166534" }}>
          {submitted ? "Order Signed Successfully" : "Already Signed"}
        </h2>
        {alreadySigned && !submitted && (
          <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
            This order was already signed by <strong>{data.customerSignature}</strong>.
          </p>
        )}
        {data.customerSignatureImage && (
          <img src={data.customerSignatureImage} alt="Signature" style={{ maxWidth: 280, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 8 }} />
        )}
        <p style={{ marginTop: 20, fontSize: 13, color: "#888" }}>Order #{data.orderNumber} — {data.jobName}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "24px 16px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#4f7bff", marginBottom: 4 }}>
            Order Approval
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>
            Order #{data.orderNumber}
          </h1>
        </div>

        <div style={cardStyle}>
          <h3 style={sectionTitle}>Order Details</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {[
                ["Job / Project", data.jobName],
                ["Customer", data.customerName],
                ["Company", data.companyName],
                ["Phone", data.phone],
                ["Address", data.address],
                ["Product Type", data.productType],
                ["Quantity", data.quantity],
                ["Print Specs", data.printSpecs],
                ["Required Delivery", fmtDate(data.deliveryDate)],
              ].filter(([, v]) => v && v !== "—").map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "7px 0", color: "#888", width: "40%", verticalAlign: "top" }}>{label}</td>
                  <td style={{ padding: "7px 0", fontWeight: 600 }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Customer Approval & Signature</h3>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
              By signing below, you confirm the order details above are correct and authorize the job to proceed.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#444" }}>
                Full Name *
              </label>
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                required
                placeholder="Enter your full name"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Signature *</label>
                <button type="button" onClick={clearCanvas} style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Clear
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={560}
                height={160}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
                style={{
                  width: "100%",
                  height: 160,
                  border: "2px dashed #d1d5db",
                  borderRadius: 10,
                  background: "#fafafa",
                  cursor: "crosshair",
                  touchAction: "none",
                  display: "block",
                }}
              />
              {!hasSig && (
                <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 6 }}>
                  Sign with your finger or mouse
                </p>
              )}
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "13px",
                background: submitting ? "#9ca3af" : "linear-gradient(135deg, #4f7bff, #a855f7)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving…" : "Confirm & Sign"}
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", marginTop: 16 }}>
          Powered by PressMan
        </p>
      </div>
    </div>
  );
}

const centerStyle = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", padding: 16 };
const cardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.04)" };
const sectionTitle = { fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 14, marginTop: 0, textTransform: "uppercase", letterSpacing: 0.5 };
