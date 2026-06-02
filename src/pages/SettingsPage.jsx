import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../state/settings";

export default function SettingsPage() {
  const {
    pressMachines,
    addPressMachine,
    removePressMachine,
    updatePressMachine,
    companyName,
    setCompanyName,
    companyLogo,
    setCompanyLogo,
  } = useSettings();
  const [newMachine, setNewMachine] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [companyNameDraft, setCompanyNameDraft] = useState(companyName);
  const logoInputRef = useRef(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newMachine.trim()) return;
    addPressMachine(newMachine);
    setNewMachine("");
  };

  const startEdit = (machine) => {
    setEditingId(machine.id);
    setEditingName(machine.name);
  };

  const saveEdit = () => {
    if (editingName.trim()) {
      updatePressMachine(editingId, editingName);
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCompanyLogo(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure your press shop.</p>
        </div>
        <div className="page-actions">
          <Link to="/orders" className="button ghost">
            Back to Orders
          </Link>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 4px" }}>Company Information</h3>
        <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 13 }}>
          Your company name and logo will appear on printed job sheets.
        </p>
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 6,
                color: "var(--muted)",
              }}
            >
              Company Name
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={companyNameDraft}
                onChange={(e) => setCompanyNameDraft(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 14,
                }}
              />
              <button onClick={() => setCompanyName(companyNameDraft)}>
                Save
              </button>
            </div>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                marginBottom: 6,
                color: "var(--muted)",
              }}
            >
              Company Logo
            </label>
            {companyLogo ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={companyLogo}
                  alt="Logo"
                  style={{
                    height: 48,
                    maxWidth: 160,
                    objectFit: "contain",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                  }}
                />
                <button
                  className="button small ghost"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Replace
                </button>
                <button
                  className="button small ghost"
                  style={{ color: "#dc2626" }}
                  onClick={() => setCompanyLogo("")}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                className="button ghost"
                onClick={() => logoInputRef.current?.click()}
              >
                Upload Logo
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 style={{ margin: "0 0 4px" }}>Press Machines</h3>
        <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 13 }}>
          Define the printing machines available in your Press department. When
          an order enters the Press stage, the operator will choose which
          machine to use.
        </p>

        <form
          onSubmit={handleAdd}
          style={{ display: "flex", gap: 8, marginBottom: 16 }}
        >
          <input
            value={newMachine}
            onChange={(e) => setNewMachine(e.target.value)}
            placeholder="Machine name / model…"
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 14,
            }}
          />
          <button type="submit">Add Machine</button>
        </form>

        {pressMachines.length === 0 && (
          <p style={{ color: "var(--muted)" }}>No machines defined yet.</p>
        )}

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {pressMachines.map((m) => (
            <li
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {editingId === m.id ? (
                <div style={{ display: "flex", gap: 8, flex: 1 }}>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                    autoFocus
                  />
                  <button className="button small" onClick={saveEdit}>
                    Save
                  </button>
                  <button
                    className="button small ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span style={{ fontWeight: 500 }}>{m.name}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="button small ghost"
                      onClick={() => startEdit(m)}
                    >
                      Edit
                    </button>
                    <button
                      className="button small ghost"
                      style={{ color: "#dc2626" }}
                      onClick={() => removePressMachine(m.id)}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
