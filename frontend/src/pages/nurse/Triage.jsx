import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { visitsApi, triageApi } from "../../api/endpoints";
import { unwrapList } from "../../api/client";
import { useToast, getErrorMessage } from "../../components/Toast";
import { IconActivity } from "../../components/icons";

const EMPTY_TRIAGE = {
  blood_pressure: "", temperature: "", pulse: "", weight: "", height: "", notes: "",
};

export default function Triage() {
  const { showToast } = useToast();
  const [pendingVisits, setPendingVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [form, setForm] = useState(EMPTY_TRIAGE);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPending();
  }, []);

  function loadPending() {
    setLoading(true);
    visitsApi.list({ status: "REGISTERED", ordering: "created_at" }).then((res) => {
      setPendingVisits(unwrapList(res.data));
      setLoading(false);
    });
  }

  function selectVisit(visit) {
    setSelectedVisit(visit);
    setForm(EMPTY_TRIAGE);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedVisit) return;
    setSubmitting(true);
    try {
      await triageApi.create({
        visit: selectedVisit.id,
        blood_pressure: form.blood_pressure,
        temperature: form.temperature || null,
        pulse: form.pulse || null,
        weight: form.weight || null,
        height: form.height || null,
        notes: form.notes,
      });
      showToast(`Triage recorded for ${selectedVisit.patient_name}. Sent to consultation queue.`);
      setSelectedVisit(null);
      setForm(EMPTY_TRIAGE);
      loadPending();
    } catch (err) {
      showToast(getErrorMessage(err, "Could not save triage."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout title="Triage">
      <div className="page-header">
        <div>
          <h1>Triage</h1>
          <p>Record vitals for waiting patients before they're sent to the consultation queue.</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Awaiting Triage</div>
          </div>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : pendingVisits.length === 0 ? (
            <div className="empty-state">
              <IconActivity className="empty-state-icon" />
              <h3>No patients waiting</h3>
              <p>New visits will show up here for triage.</p>
            </div>
          ) : (
            pendingVisits.map((v) => (
              <div
                className="patient-result-card"
                key={v.id}
                style={{
                  cursor: "pointer",
                  borderColor: selectedVisit?.id === v.id ? "var(--teal-500)" : undefined,
                  background: selectedVisit?.id === v.id ? "var(--teal-50)" : undefined,
                }}
                onClick={() => selectVisit(v)}
              >
                <div className="patient-result-info">
                  <span className="patient-result-name">{v.patient_name}</span>
                  <span className="patient-result-meta">
                    {v.patient_phone} · {v.consultation_type_name}
                  </span>
                </div>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => selectVisit(v)}>
                  {selectedVisit?.id === v.id ? "Selected" : "Select"}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {selectedVisit ? `Vitals — ${selectedVisit.patient_name}` : "Vitals"}
            </div>
          </div>
          {!selectedVisit ? (
            <p className="muted" style={{ fontSize: 13.5 }}>Select a patient from the list to record their vitals.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Blood Pressure</label>
                  <input type="text" placeholder="e.g. 120/80" value={form.blood_pressure}
                    onChange={(e) => setForm({ ...form, blood_pressure: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Temperature (°C)</label>
                  <input type="number" step="0.1" placeholder="36.7" value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pulse (bpm)</label>
                  <input type="number" placeholder="72" value={form.pulse}
                    onChange={(e) => setForm({ ...form, pulse: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input type="number" step="0.1" placeholder="70" value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input type="number" step="0.1" placeholder="175" value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea placeholder="Any additional observations..." value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Triage & Send to Queue"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}