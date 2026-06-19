import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { visitsApi, paymentsApi, prescriptionsApi } from "../../api/endpoints";
import { unwrapList } from "../../api/client";
import { useToast, getErrorMessage } from "../../components/Toast";
import { IconCash, IconCheck, IconPill } from "../../components/icons";

export default function Billing() {
  const { showToast } = useToast();
  const [readyVisits, setReadyVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visitDetail, setVisitDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [dispensingId, setDispensingId] = useState(null);

  useEffect(() => {
    loadReady();
  }, []);

  function loadReady() {
    setLoading(true);
    visitsApi.billingReady().then((res) => {
      setReadyVisits(unwrapList(res.data));
      setLoading(false);
    });
  }

  async function selectVisit(visit) {
    setSelectedVisit(visit);
    setLoadingDetail(true);
    setPaymentRef("");
    try {
      const res = await visitsApi.get(visit.id);
      setVisitDetail(res.data);
      const total = computeTotal(res.data);
      setPaymentAmount(total.toFixed(2));
    } finally {
      setLoadingDetail(false);
    }
  }

  function computeTotal(detail) {
    if (!detail) return 0;
    const fee = Number(detail.consultation_fee || 0);
    const notesTotal = (detail.consultation?.service_notes || []).reduce(
      (sum, n) => sum + Number(n.amount || 0), 0
    );
    const medsTotal = (detail.consultation?.prescriptions || []).reduce(
      (sum, p) => sum + Number(p.line_total || 0), 0
    );
    return fee + notesTotal + medsTotal;
  }

  const alreadyPaid = (visitDetail?.payments_total) || 0;

  async function handlePayment(e) {
    e.preventDefault();
    if (!selectedVisit) return;
    setSubmittingPayment(true);
    try {
      await paymentsApi.create({
        visit: selectedVisit.id,
        amount: paymentAmount,
        method: paymentMethod,
        reference: paymentRef,
      });
      showToast("Payment recorded successfully.");
      const res = await visitsApi.get(selectedVisit.id);
      setVisitDetail(res.data);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not record payment."), "error");
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function handleDispense(prescriptionId) {
    setDispensingId(prescriptionId);
    try {
      await prescriptionsApi.dispense(prescriptionId);
      showToast("Medicine dispensed and stock updated.");
      const res = await visitsApi.get(selectedVisit.id);
      setVisitDetail(res.data);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not dispense medicine."), "error");
    } finally {
      setDispensingId(null);
    }
  }

  const total = computeTotal(visitDetail);
  const consultation = visitDetail?.consultation;

  return (
    <Layout title="Billing & Dispensing">
      <div className="page-header">
        <div>
          <h1>Billing & Dispensing</h1>
          <p>Patients sent back from consultation, ready for payment and medicine dispensing.</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ready for Billing</div>
          </div>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : readyVisits.length === 0 ? (
            <div className="empty-state">
              <IconCash className="empty-state-icon" />
              <h3>Nothing to bill right now</h3>
              <p>Completed consultations will appear here.</p>
            </div>
          ) : (
            readyVisits.map((v) => (
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
                  <span className="patient-result-meta">{v.consultation_type_name}</span>
                </div>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => selectVisit(v)}>
                  {selectedVisit?.id === v.id ? "Selected" : "View Bill"}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {selectedVisit ? `Bill — ${selectedVisit.patient_name}` : "Bill Breakdown"}
            </div>
          </div>

          {!selectedVisit ? (
            <p className="muted" style={{ fontSize: 13.5 }}>Select a patient to view their bill.</p>
          ) : loadingDetail ? (
            <p className="muted">Loading bill...</p>
          ) : (
            <>
              <div className="line-item">
                <div>
                  <div className="line-item-name">Consultation Fee</div>
                  <div className="line-item-sub">{visitDetail.consultation_type_name}</div>
                </div>
                <div className="line-item-amount">KES {Number(visitDetail.consultation_fee).toLocaleString()}</div>
              </div>

              {(consultation?.service_notes || []).map((note) => (
                <div className="line-item" key={note.id}>
                  <div className="line-item-name">{note.title}</div>
                  <div className="line-item-amount">KES {Number(note.amount).toLocaleString()}</div>
                </div>
              ))}

              {(consultation?.prescriptions || []).map((p) => (
                <div className="line-item" key={p.id}>
                  <div>
                    <div className="line-item-name">{p.medicine_name}</div>
                    <div className="line-item-sub">
                      {p.quantity} {p.medicine_unit.toLowerCase()}(s)
                      {p.dispensed ? (
                        <span className="badge badge-success" style={{ marginLeft: 8 }}>Dispensed</span>
                      ) : (
                        <span className="badge badge-warning" style={{ marginLeft: 8 }}>Pending</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-gap">
                    <div className="line-item-amount">KES {Number(p.line_total).toLocaleString()}</div>
                    {!p.dispensed && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDispense(p.id)}
                        disabled={dispensingId === p.id}
                      >
                        <IconPill style={{ width: 13, height: 13 }} />
                        {dispensingId === p.id ? "Dispensing..." : "Dispense"}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="bill-total-row">
                <span className="bill-total-label">Total Due</span>
                <span className="bill-total-amount">KES {total.toLocaleString()}</span>
              </div>

              <div className="section-divider" />

              <form onSubmit={handlePayment}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount<span className="required">*</span></label>
                    <input type="number" step="0.01" required value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="CASH">Cash</option>
                      <option value="MPESA">M-Pesa</option>
                      <option value="INSURANCE">Insurance</option>
                      <option value="CARD">Card</option>
                    </select>
                  </div>
                </div>
                {paymentMethod === "MPESA" && (
                  <div className="form-group">
                    <label className="form-label">M-Pesa Reference</label>
                    <input type="text" placeholder="e.g. QXC1A2B3C4" value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)} />
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={submittingPayment}>
                  <IconCheck style={{ width: 14, height: 14 }} />
                  {submittingPayment ? "Recording..." : "Record Payment"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}