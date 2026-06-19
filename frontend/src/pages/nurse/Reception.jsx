import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import { patientsApi, visitsApi, consultationTypesApi } from "../../api/endpoints";
import { unwrapList } from "../../api/client";
import { useToast, getErrorMessage } from "../../components/Toast";
import { IconSearch, IconUserPlus, IconX } from "../../components/icons";

const EMPTY_PATIENT = {
  first_name: "", last_name: "", phone: "", id_number: "",
  date_of_birth: "", gender: "O", address: "",
  next_of_kin_name: "", next_of_kin_phone: "",
};

export default function Reception() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newPatient, setNewPatient] = useState(EMPTY_PATIENT);
  const [registering, setRegistering] = useState(false);

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [consultationTypes, setConsultationTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [creatingVisit, setCreatingVisit] = useState(false);

  const [recentVisits, setRecentVisits] = useState([]);

  useEffect(() => {
    consultationTypesApi.list({ is_active: true }).then((res) => {
      const list = unwrapList(res.data);
      setConsultationTypes(list);
      if (list.length) setSelectedTypeId(String(list[0].id));
    });
    loadRecentVisits();
  }, []);

  function loadRecentVisits() {
    visitsApi.list({ ordering: "-created_at" }).then((res) => {
      setRecentVisits(unwrapList(res.data).slice(0, 8));
    });
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await patientsApi.list({ search: query.trim() });
      setResults(unwrapList(res.data));
    } catch (err) {
      showToast(getErrorMessage(err, "Search failed."), "error");
    } finally {
      setSearching(false);
    }
  }

  function openRegisterModal() {
    setNewPatient({ ...EMPTY_PATIENT, first_name: "", last_name: "" });
    setShowRegisterModal(true);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await patientsApi.create(newPatient);
      showToast(`${res.data.full_name} registered successfully.`);
      setShowRegisterModal(false);
      setSelectedPatient(res.data);
      setShowVisitModal(true);
    } catch (err) {
      showToast(getErrorMessage(err, "Could not register patient."), "error");
    } finally {
      setRegistering(false);
    }
  }

  function openVisitModal(patient) {
    setSelectedPatient(patient);
    setShowVisitModal(true);
  }

  async function handleCreateVisit(e) {
    e.preventDefault();
    if (!selectedTypeId) return;
    setCreatingVisit(true);
    try {
      await visitsApi.create({
        patient: selectedPatient.id,
        consultation_type: Number(selectedTypeId),
      });
      showToast(`Visit created for ${selectedPatient.full_name || selectedPatient.first_name}.`);
      setShowVisitModal(false);
      setResults([]);
      setQuery("");
      setSearched(false);
      loadRecentVisits();
    } catch (err) {
      showToast(getErrorMessage(err, "Could not create visit."), "error");
    } finally {
      setCreatingVisit(false);
    }
  }

  return (
    <Layout title="Reception">
      <div className="page-header">
        <div>
          <h1>Patient Reception</h1>
          <p>Search for an existing patient or register a new one to start a visit.</p>
        </div>
        <button className="btn btn-primary" onClick={openRegisterModal}>
          <IconUserPlus /> Register New Patient
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <IconSearch />
            <input
              type="search"
              placeholder="Search by name, phone, or ID number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {searched && !searching && (
          <div style={{ marginTop: 18 }}>
            {results.length === 0 ? (
              <div className="empty-state">
                <h3>No patients found</h3>
                <p>Try a different search term, or register this patient as new.</p>
              </div>
            ) : (
              results.map((p) => (
                <div className="patient-result-card" key={p.id}>
                  <div className="patient-result-info">
                    <span className="patient-result-name">{p.full_name}</span>
                    <span className="patient-result-meta">
                      {p.phone} {p.id_number && `· ID ${p.id_number}`} {p.gender && `· ${p.gender}`}
                    </span>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => openVisitModal(p)}>
                    Create Visit
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Visits</div>
        </div>
        {recentVisits.length === 0 ? (
          <div className="empty-state">
            <h3>No visits yet</h3>
            <p>Visits you create will appear here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Consultation Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((v) => (
                  <tr key={v.id}>
                    <td>{v.patient_name}</td>
                    <td>{v.patient_phone}</td>
                    <td>{v.consultation_type_name}</td>
                    <td><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16 }}>Register New Patient</h2>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}><IconX /></button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name<span className="required">*</span></label>
                  <input type="text" required value={newPatient.first_name}
                    onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name<span className="required">*</span></label>
                  <input type="text" required value={newPatient.last_name}
                    onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone<span className="required">*</span></label>
                  <input type="tel" required value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">ID Number</label>
                  <input type="text" value={newPatient.id_number}
                    onChange={(e) => setNewPatient({ ...newPatient, id_number: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" value={newPatient.date_of_birth}
                    onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Next of Kin Name</label>
                  <input type="text" value={newPatient.next_of_kin_name}
                    onChange={(e) => setNewPatient({ ...newPatient, next_of_kin_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Next of Kin Phone</label>
                  <input type="tel" value={newPatient.next_of_kin_phone}
                    onChange={(e) => setNewPatient({ ...newPatient, next_of_kin_phone: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={registering}>
                  {registering ? "Registering..." : "Register & Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Visit Modal */}
      {showVisitModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowVisitModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16 }}>Create Visit</h2>
              <button className="modal-close" onClick={() => setShowVisitModal(false)}><IconX /></button>
            </div>
            <p className="muted" style={{ marginBottom: 16, fontSize: 13.5 }}>
              For patient: <strong>{selectedPatient.full_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}</strong>
            </p>
            <form onSubmit={handleCreateVisit}>
              <div className="form-group">
                <label className="form-label">Consultation Type<span className="required">*</span></label>
                <select value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)} required>
                  {consultationTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>{ct.name} — KES {ct.fee}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVisitModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingVisit}>
                  {creatingVisit ? "Creating..." : "Create Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}