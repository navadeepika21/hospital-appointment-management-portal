import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { getAll, getById, createItem, updateItem, deleteItem } from "./services/api";

const today = new Date().toISOString().slice(0, 10);
const blankDoctor = { name: "", specialization: "", experience: "", phone: "", email: "", available: true };
const blankPatient = { name: "", age: "", gender: "", phone: "", email: "" };
const blankAppointment = { patientId: "", doctorId: "", date: today, time: "", reason: "", status: "Booked" };

function Icon({ children }) {
  return <span className="nav-icon" aria-hidden="true">{children}</span>;
}

function App() {
  const location = useLocation();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [d, p, a] = await Promise.all([
        getAll("doctors"), getAll("patients"), getAll("appointments")
      ]);
      setDoctors(d);
      setPatients(p);
      setAppointments(a);
    } catch (err) {
      setError(`${err.message} Start the server with: npm run server`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const titleMap = {
    "/": "Dashboard", "/dashboard": "Dashboard",
    "/doctors": "Doctors", "/patients": "Patients", "/appointments": "Appointments"
  };
  const pageTitle = titleMap[location.pathname] || "Hospital Portal";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✚</div>
          <div><strong>CarePoint</strong><small>Hospital Portal</small></div>
        </div>
        <div className="side-label">WORKSPACE</div>
        <nav className="navigation">
          <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}><Icon>▦</Icon>Dashboard</NavLink>
          <NavLink to="/doctors" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}><Icon>⚕</Icon>Doctors</NavLink>
          <NavLink to="/patients" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}><Icon>♙</Icon>Patients</NavLink>
          <NavLink to="/appointments" className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}><Icon>▣</Icon>Appointments</NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-symbol">♡</span><strong>Care that connects</strong><p>Simple tools for a healthier, more organized hospital.</p></div>
          <div className="user-mini"><div className="avatar">AD</div><div><strong>Admin Desk</strong><small>Hospital staff</small></div><span className="dots">•••</span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><div className="eyebrow">CAREPOINT / MANAGEMENT</div><h1>{pageTitle}</h1></div>
          <div className="top-actions"><span className="today-chip">● System online</span><div className="avatar top-avatar">AD</div></div>
        </header>
        <div className="content">
          {notice && <div className="notice success">✓ {notice}</div>}
          {error && <div className="notice error">{error}<button className="text-button" onClick={refresh}>Retry</button></div>}
          {loading && <div className="loading"><span className="spinner"></span> Loading hospital records…</div>}
          {!loading && !error && (
            <Routes>
              <Route path="/" element={<Dashboard doctors={doctors} patients={patients} appointments={appointments} />} />
              <Route path="/dashboard" element={<Dashboard doctors={doctors} patients={patients} appointments={appointments} />} />
              <Route path="/doctors" element={<DoctorsPage doctors={doctors} refresh={refresh} notify={setNotice} />} />
              <Route path="/patients" element={<PatientsPage patients={patients} refresh={refresh} notify={setNotice} />} />
              <Route path="/appointments" element={<AppointmentsPage doctors={doctors} patients={patients} appointments={appointments} refresh={refresh} notify={setNotice} />} />
              <Route path="/:section/:id/edit" element={<EditRecordRoute refresh={refresh} notify={setNotice} />} />
              <Route path="*" element={<Dashboard doctors={doctors} patients={patients} appointments={appointments} />} />
            </Routes>
          )}
          <footer className="footer">CarePoint Hospital Portal <span>•</span> React + JSON Server</footer>
        </div>
      </main>
    </div>
  );
}

function Dashboard({ doctors, patients, appointments }) {
  const navigate = useNavigate();
  const upcoming = [...appointments]
    .filter(a => a.status !== "Cancelled" && a.date >= today)
    .sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 5);
  const count = (status) => appointments.filter(a => a.status === status).length;
  const patientName = (id) => patients.find(p => String(p.id) === String(id))?.name || "Unknown patient";
  const doctorName = (id) => doctors.find(d => String(d.id) === String(id))?.name || "Unknown doctor";

  return <div className="page-stack">
    <section className="welcome-banner">
      <div><div className="banner-tag">HOSPITAL OVERVIEW</div><h2>Good care starts with<br/>a well-organized day.</h2><p>Manage your hospital's doctors, patients and appointments in one place.</p><button className="btn btn-light" onClick={() => navigate("/appointments")}>＋ Book an appointment</button></div>
      <div className="banner-art" aria-hidden="true"><div className="art-circle circle-one"></div><div className="art-circle circle-two"></div><div className="medical-cross">✚</div><div className="art-card"><span>Today's focus</span><strong>{appointments.filter(a => a.date === today && a.status !== "Cancelled").length}</strong><small>appointments today</small></div></div>
    </section>

    <div className="section-heading"><div><h2>At a glance</h2><p>Live totals from your hospital records</p></div><span className="live-label"><span></span> Updated from API</span></div>
    <section className="stats-grid">
      <StatCard label="Total doctors" value={doctors.length} icon="⚕" tone="teal" sub={`${doctors.filter(d => d.available).length} available`} />
      <StatCard label="Registered patients" value={patients.length} icon="♙" tone="blue" sub="Patient records" />
      <StatCard label="Total appointments" value={appointments.length} icon="▣" tone="purple" sub={`${count("Booked")} booked`} />
      <StatCard label="Confirmed visits" value={count("Confirmed")} icon="✓" tone="orange" sub={`${count("Completed")} completed`} />
    </section>

    <section className="dashboard-bottom">
      <div className="panel upcoming-panel">
        <div className="panel-heading"><div><h3>Upcoming appointments</h3><p>Your next scheduled visits</p></div><button className="link-button" onClick={() => navigate("/appointments")}>View all →</button></div>
        {upcoming.length === 0 ? <EmptyState title="No upcoming appointments" text="New bookings will appear here." /> :
          <div className="appointment-list">{upcoming.map(a => <div className="appointment-row" key={a.id}><div className="date-box"><strong>{new Date(`${a.date}T00:00:00`).getDate()}</strong><small>{new Date(`${a.date}T00:00:00`).toLocaleDateString("en-US",{month:"short"})}</small></div><div className="appointment-main"><strong>{patientName(a.patientId)}</strong><span>{doctorName(a.doctorId)}</span></div><div className="appointment-time">{a.time || "—"}<StatusBadge status={a.status}/></div></div>)}</div>}
      </div>
      <div className="panel status-panel"><div className="panel-heading"><div><h3>Appointment status</h3><p>Current booking breakdown</p></div></div>
        <div className="status-summary"><div className="status-total">{appointments.length}<small>Total</small></div><div className="status-legend">{[["Booked","status-booked"],["Confirmed","status-confirmed"],["Completed","status-completed"],["Cancelled","status-cancelled"]].map(([s,c])=><div key={s}><span className={`legend-dot ${c}`}></span>{s}<strong>{count(s)}</strong></div>)}</div></div>
        <div className="progress-track">{appointments.length > 0 && [ ["Booked","#f59e0b"],["Confirmed","#0d9488"],["Completed","#64748b"],["Cancelled","#ef4444"] ].map(([s,color]) => <span key={s} style={{width:`${count(s)/appointments.length*100}%`,background:color}} />)}</div>
        <div className="quick-tip"><span>✦</span><p><strong>Quick tip</strong><br/>Keep doctor availability up to date before creating a new appointment.</p></div>
      </div>
    </section>
  </div>;
}

function StatCard({ label, value, icon, tone, sub }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-sub">{sub}</span></div>;
}
function StatusBadge({ status }) {
  const cls = {Booked:"status-booked",Confirmed:"status-confirmed",Completed:"status-completed",Cancelled:"status-cancelled"}[status] || "";
  return <span className={`status-badge ${cls}`}>{status}</span>;
}
function EmptyState({ title, text }) {
  return <div className="empty-state"><div className="empty-icon">▤</div><strong>{title}</strong><p>{text}</p></div>;
}
function SearchBar({ value, onChange, placeholder = "Search records..." }) {
  return <label className="search-box"><span>⌕</span><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>;
}

function DoctorsPage({ doctors, refresh, notify }) {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("All specializations");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankDoctor);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();
  const specializations = [...new Set(doctors.map(d=>d.specialization).filter(Boolean))];
  const filtered = doctors.filter(d => {
    const matchesSearch = `${d.name} ${d.email} ${d.phone}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (specialization === "All specializations" || d.specialization === specialization);
  });

  function openNew() { setEditing(null); setForm(blankDoctor); setFormError(""); setShowForm(true); }
  async function openEdit(doctor) {
    try {
      const full = await getById("doctors", doctor.id);
      setEditing(String(doctor.id)); setForm({...full, experience:String(full.experience ?? "")}); setFormError(""); setShowForm(true);
    } catch(e) { notify(e.message); }
  }
  async function submit(e) {
    e.preventDefault(); setFormError("");
    if (!form.name.trim() || !form.specialization.trim() || !form.phone.trim() || !form.email.trim()) return setFormError("Please complete all required fields.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setFormError("Enter a valid email address.");
    if (!/^[0-9+\-\s]{7,15}$/.test(form.phone)) return setFormError("Enter a valid phone number.");
    setSaving(true);
    try {
      const payload = {...form, name:form.name.trim(), experience:Number(form.experience || 0), available:Boolean(form.available)};
      if (editing) await updateItem("doctors", editing, payload);
      else await createItem("doctors", payload);
      await refresh(); setShowForm(false); notify(editing ? "Doctor details updated." : "Doctor added successfully.");
    } catch(err) { setFormError(err.message); } finally { setSaving(false); }
  }
  async function remove(doctor) {
    if (!window.confirm(`Delete ${doctor.name}? This cannot be undone.`)) return;
    try { await deleteItem("doctors", doctor.id); await refresh(); notify("Doctor deleted."); }
    catch(e) { notify(e.message); }
  }

  return <div className="page-stack">
    <PageIntro title="Doctors" text="Manage your medical team and their availability." action="+ Add doctor" onAction={openNew}/>
    <div className="toolbar"><SearchBar value={search} onChange={setSearch} placeholder="Search doctor name, email or phone"/><select className="filter-select" value={specialization} onChange={e=>setSpecialization(e.target.value)}><option>All specializations</option>{specializations.map(s=><option key={s}>{s}</option>)}</select><span className="result-count">{filtered.length} doctors</span></div>
    {showForm && <DoctorForm form={form} setForm={setForm} editing={editing} saving={saving} error={formError} onSubmit={submit} onClose={()=>setShowForm(false)}/>}
    {filtered.length === 0 ? <EmptyState title="No doctors found" text="Try another search or add a doctor to get started."/> :
      <div className="records-grid">{filtered.map(d=><article className="doctor-card" key={d.id}><div className="doctor-card-top"><div className="doctor-avatar">{d.name.split(" ").filter(Boolean).slice(-2).map(w=>w[0]).join("").toUpperCase()}</div><StatusBadge status={d.available ? "Confirmed" : "Cancelled"}/></div><h3>{d.name}</h3><span className="specialty">{d.specialization}</span><div className="doctor-details"><span>◷ {d.experience || 0} years experience</span><span>☎ {d.phone}</span><span>✉ {d.email}</span></div><div className="card-actions"><button className="btn btn-outline" onClick={()=>openEdit(d)}>Edit</button><button className="btn btn-danger-light" onClick={()=>remove(d)}>Delete</button></div></article>)}</div>}
  </div>;
}

function DoctorForm({ form, setForm, editing, saving, error, onSubmit, onClose }) {
  const field = (key,value) => setForm(prev=>({...prev,[key]:value}));
  return <div className="panel form-panel"><div className="panel-heading"><div><h3>{editing ? "Edit doctor" : "Add a doctor"}</h3><p>Fields marked * are required.</p></div><button className="close-button" onClick={onClose}>×</button></div>
    <form className="form-grid" onSubmit={onSubmit}>
      <label>Full name *<input required value={form.name} onChange={e=>field("name",e.target.value)} placeholder="Dr. Full Name"/></label>
      <label>Specialization *<input required value={form.specialization} onChange={e=>field("specialization",e.target.value)} placeholder="e.g. Cardiology"/></label>
      <label>Experience (years)<input type="number" min="0" max="70" value={form.experience} onChange={e=>field("experience",e.target.value)} placeholder="5"/></label>
      <label>Phone *<input required value={form.phone} onChange={e=>field("phone",e.target.value)} placeholder="Phone number"/></label>
      <label>Email *<input required type="email" value={form.email} onChange={e=>field("email",e.target.value)} placeholder="doctor@example.com"/></label>
      <label className="checkbox-label"><input type="checkbox" checked={Boolean(form.available)} onChange={e=>field("available",e.target.checked)}/> Doctor is available</label>
      {error && <p className="form-error full-width">{error}</p>}
      <div className="form-actions full-width"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add doctor"}</button></div>
    </form>
  </div>;
}

function PatientsPage({ patients, refresh, notify }) {
  const [search,setSearch] = useState("");
  const [showForm,setShowForm] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(blankPatient);
  const [saving,setSaving] = useState(false);
  const [formError,setFormError] = useState("");
  const filtered = patients.filter(p=>`${p.name} ${p.email} ${p.phone}`.toLowerCase().includes(search.toLowerCase()));

  function openNew(){setEditing(null);setForm(blankPatient);setFormError("");setShowForm(true);}
  async function openEdit(p){try{const full=await getById("patients",p.id);setEditing(String(p.id));setForm({...full,age:String(full.age ?? "")});setFormError("");setShowForm(true);}catch(e){notify(e.message);}}
  async function submit(e){
    e.preventDefault();setFormError("");
    if(!form.name.trim()||!form.age||!form.gender||!form.phone.trim()||!form.email.trim())return setFormError("Please complete all required fields.");
    if(Number(form.age)<0||Number(form.age)>120)return setFormError("Enter an age between 0 and 120.");
    if(!/^\S+@\S+\.\S+$/.test(form.email))return setFormError("Enter a valid email address.");
    if(!/^[0-9+\-\s]{7,15}$/.test(form.phone))return setFormError("Enter a valid phone number.");
    setSaving(true);
    try{const payload={...form,name:form.name.trim(),age:Number(form.age)};if(editing)await updateItem("patients",editing,payload);else await createItem("patients",payload);await refresh();setShowForm(false);notify(editing?"Patient details updated.":"Patient registered successfully.");}
    catch(err){setFormError(err.message);}finally{setSaving(false);}
  }
  async function remove(p){if(!window.confirm(`Delete patient ${p.name}?`))return;try{await deleteItem("patients",p.id);await refresh();notify("Patient deleted.");}catch(e){notify(e.message);}}
  return <div className="page-stack">
    <PageIntro title="Patients" text="Keep patient information organized and up to date." action="+ Add patient" onAction={openNew}/>
    <div className="toolbar"><SearchBar value={search} onChange={setSearch} placeholder="Search patient name, email or phone"/><span className="result-count">{filtered.length} patients</span></div>
    {showForm && <div className="panel form-panel"><div className="panel-heading"><div><h3>{editing?"Edit patient":"Register a patient"}</h3><p>Enter accurate contact details.</p></div><button className="close-button" onClick={()=>setShowForm(false)}>×</button></div>
      <form className="form-grid" onSubmit={submit}>
        <label>Full name *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Patient name"/></label>
        <label>Age *<input required type="number" min="0" max="120" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="Age"/></label>
        <label>Gender *<select required value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></label>
        <label>Phone *<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone number"/></label>
        <label>Email *<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="patient@example.com"/></label>
        {formError&&<p className="form-error full-width">{formError}</p>}
        <div className="form-actions full-width"><button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving?"Saving…":editing?"Save changes":"Register patient"}</button></div>
      </form>
    </div>}
    <div className="panel table-panel"><div className="panel-heading"><div><h3>Patient directory</h3><p>Patient records retrieved from JSON Server</p></div><span className="table-count">{filtered.length} records</span></div>
      {filtered.length===0?<EmptyState title="No patients found" text="Try a different search or register a patient."/>:
      <div className="table-wrap"><table><thead><tr><th>PATIENT</th><th>AGE / GENDER</th><th>PHONE</th><th>EMAIL</th><th>ACTIONS</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="table-person"><div className="small-avatar">{p.name.split(" ").filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase()}</div><div><strong>{p.name}</strong><small>ID: {p.id}</small></div></div></td><td>{p.age} / {p.gender}</td><td>{p.phone}</td><td>{p.email}</td><td><div className="inline-actions"><button className="table-action" onClick={()=>openEdit(p)}>Edit</button><button className="table-action danger-text" onClick={()=>remove(p)}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}

function AppointmentsPage({ doctors, patients, appointments, refresh, notify }) {
  const [search,setSearch] = useState("");
  const [dateFilter,setDateFilter] = useState("");
  const [statusFilter,setStatusFilter] = useState("All statuses");
  const [showForm,setShowForm] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState(blankAppointment);
  const [saving,setSaving] = useState(false);
  const [formError,setFormError] = useState("");
  const patientName = id => patients.find(p=>String(p.id)===String(id))?.name || "Unknown patient";
  const doctor = id => doctors.find(d=>String(d.id)===String(id));
  const filtered = appointments.filter(a=>{
    const searchText=`${patientName(a.patientId)} ${doctor(a.doctorId)?.name||""} ${a.reason||""}`.toLowerCase();
    return searchText.includes(search.toLowerCase()) && (!dateFilter||a.date===dateFilter) && (statusFilter==="All statuses"||a.status===statusFilter);
  }).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  function openNew(){setEditing(null);setForm({...blankAppointment,date:today});setFormError("");setShowForm(true);}
  async function openEdit(a){try{const full=await getById("appointments",a.id);setEditing(String(a.id));setForm({...full});setFormError("");setShowForm(true);}catch(e){notify(e.message);}}
  async function submit(e){
    e.preventDefault();setFormError("");
    if(!form.patientId||!form.doctorId||!form.date||!form.time||!form.reason.trim())return setFormError("Please complete all required fields.");
    const selectedDoctor=doctor(form.doctorId);
    if(!selectedDoctor)return setFormError("Select a valid doctor.");
    if(!selectedDoctor.available)return setFormError(`${selectedDoctor.name} is currently unavailable. Please choose another doctor.`);
    const clash=appointments.find(a=>String(a.id)!==String(editing)&&String(a.doctorId)===String(form.doctorId)&&a.date===form.date&&a.time===form.time&&a.status!=="Cancelled");
    if(clash)return setFormError("This doctor already has an appointment at that date and time. Choose another time.");
    setSaving(true);
    try{const payload={...form,patientId:String(form.patientId),doctorId:String(form.doctorId),reason:form.reason.trim()};if(editing)await updateItem("appointments",editing,payload);else await createItem("appointments",payload);await refresh();setShowForm(false);notify(editing?"Appointment updated.":"Appointment booked successfully.");}
    catch(err){setFormError(err.message);}finally{setSaving(false);}
  }
  async function changeStatus(a,status){try{await updateItem("appointments",a.id,{...a,status});await refresh();notify(status==="Cancelled"?"Appointment cancelled.":"Appointment status updated.");}catch(e){notify(e.message);}}
  async function remove(a){if(!window.confirm("Permanently delete this appointment record?"))return;try{await deleteItem("appointments",a.id);await refresh();notify("Appointment record deleted.");}catch(e){notify(e.message);}}

  return <div className="page-stack">
    <PageIntro title="Appointments" text="Book visits and track each appointment from booking to completion." action="+ Book appointment" onAction={openNew}/>
    <div className="mini-stat-row"><div className="mini-stat"><span>All appointments</span><strong>{appointments.length}</strong></div><div className="mini-stat"><span>Booked</span><strong>{appointments.filter(a=>a.status==="Booked").length}</strong></div><div className="mini-stat"><span>Confirmed</span><strong>{appointments.filter(a=>a.status==="Confirmed").length}</strong></div><div className="mini-stat"><span>Cancelled</span><strong>{appointments.filter(a=>a.status==="Cancelled").length}</strong></div></div>
    <div className="toolbar appointments-toolbar"><SearchBar value={search} onChange={setSearch} placeholder="Search patient, doctor or reason"/><label className="date-filter">Date <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}/></label><select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All statuses</option><option>Booked</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select><span className="result-count">{filtered.length} results</span></div>
    {showForm&&<div className="panel form-panel"><div className="panel-heading"><div><h3>{editing?"Edit appointment":"Book an appointment"}</h3><p>Choose a patient, an available doctor and a suitable time.</p></div><button className="close-button" onClick={()=>setShowForm(false)}>×</button></div>
      <form className="form-grid" onSubmit={submit}>
        <label>Patient *<select required value={form.patientId} onChange={e=>setForm({...form,patientId:e.target.value})}><option value="">Select patient</option>{patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Doctor *<select required value={form.doctorId} onChange={e=>setForm({...form,doctorId:e.target.value})}><option value="">Select doctor</option>{doctors.map(d=><option key={d.id} value={d.id} disabled={!d.available}>{d.name} — {d.specialization}{d.available?"":" (Unavailable)"}</option>)}</select></label>
        <label>Date *<input required type="date" min={today} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        <label>Time *<input required type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label>
        <label>Reason for visit *<input required value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Brief reason for appointment"/></label>
        <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Booked</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></label>
        {form.doctorId && !doctor(form.doctorId)?.available && <p className="form-error full-width">This doctor is unavailable. Please select another doctor.</p>}
        {formError&&<p className="form-error full-width">{formError}</p>}
        <div className="form-actions full-width"><button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving?"Saving…":editing?"Save changes":"Book appointment"}</button></div>
      </form>
    </div>}
    <div className="panel table-panel"><div className="panel-heading"><div><h3>Appointment schedule</h3><p>Filter by date and status to find a booking.</p></div></div>
      {filtered.length===0?<EmptyState title="No appointments match" text="Change the filters or book a new appointment."/>:
      <div className="table-wrap"><table><thead><tr><th>PATIENT / DOCTOR</th><th>DATE & TIME</th><th>REASON</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filtered.map(a=><tr key={a.id}><td><div className="stacked-cell"><strong>{patientName(a.patientId)}</strong><small>{doctor(a.doctorId)?.name||"Unknown doctor"}</small></div></td><td><div className="stacked-cell"><strong>{a.date}</strong><small>{a.time}</small></div></td><td className="reason-cell">{a.reason}</td><td><StatusBadge status={a.status}/></td><td><div className="action-menu"><button className="table-action" onClick={()=>openEdit(a)}>Edit</button>{a.status!=="Cancelled"&&<select aria-label="Change appointment status" className="status-select" value={a.status} onChange={e=>changeStatus(a,e.target.value)}><option>Booked</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select>}<button className="table-action danger-text" onClick={()=>remove(a)}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}

function PageIntro({title,text,action,onAction}) {
  return <section className="page-intro"><div><div className="eyebrow">HOSPITAL MANAGEMENT</div><h2>{title}</h2><p>{text}</p></div><button className="btn btn-primary" onClick={onAction}>{action}</button></section>;
}

/* React Router parameter route: load one record by ID and show a clear message.
   The regular Edit buttons use the same GET-by-ID service before opening their form. */
function EditRecordRoute({refresh,notify}) {
  const {section,id}=useParams();
  const navigate=useNavigate();
  useEffect(()=>{
    const collection={doctors:"doctors",patients:"patients",appointments:"appointments"}[section];
    if(!collection){navigate("/dashboard");return;}
    getById(collection,id).then(()=>notify("Record loaded from the API. Use Edit on its list to update it."))
      .catch(()=>notify("That record could not be found."));
    navigate(`/${collection}`,{replace:true});
  },[section,id,navigate,notify]);
  return null;
}

export default App;
