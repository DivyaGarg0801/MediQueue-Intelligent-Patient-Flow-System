import React, { useState, useEffect } from 'react';
import { patientAPI, appointmentAPI, doctorAPI } from '../services/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [formData, setFormData] = useState({
    p_name: '',
    age: '',
    gender: '',
    contact: '',
    address: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, appointmentsRes, doctorsRes] = await Promise.all([
        patientAPI.getAll(),
        appointmentAPI.getAll(),
        doctorAPI.getAll()
      ]);
      setPatients(patientsRes.data);
      setAppointments(appointmentsRes.data);
      setDoctors(doctorsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await patientAPI.update(editingPatient.p_id, formData);
      } else {
        await patientAPI.create(formData);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      p_name: patient.p_name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      address: patient.address
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      p_name: '',
      age: '',
      gender: '',
      contact: '',
      address: ''
    });
    setEditingPatient(null);
    setShowForm(false);
  };

  const getPatientAppointments = (patientId) => {
    return appointments.filter(appointment => appointment.p_id === patientId);
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.d_id === doctorId);
    return doctor ? doctor.d_name : 'Unknown';
  };

  const togglePatientExpansion = (patientId) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Patients Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Add New Patient
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={formData.p_name}
                onChange={(e) => setFormData({...formData, p_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Age:</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Contact:</label>
              <input
                type="tel"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Address:</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn btn-success">
              {editingPatient ? 'Update' : 'Add'} Patient
            </button>
            <button type="button" className="btn btn-danger" onClick={resetForm}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Patients List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Appointments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => {
              const patientAppointments = getPatientAppointments(patient.p_id);
              const isExpanded = expandedPatient === patient.p_id;
              
              return (
                <React.Fragment key={patient.p_id}>
                  <tr>
                    <td>{patient.p_id}</td>
                    <td>{patient.p_name}</td>
                    <td>{patient.age}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.contact}</td>
                    <td>{patient.address}</td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => togglePatientExpansion(patient.p_id)}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        {patientAppointments.length} appointment{patientAppointments.length !== 1 ? 's' : ''}
                        {isExpanded ? ' ▼' : ' ▶'}
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-warning" onClick={() => handleEdit(patient)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(patient.p_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan="8" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                        <div style={{ padding: '15px', borderTop: '1px solid #dee2e6' }}>
                          <h4 style={{ marginBottom: '10px', color: '#495057' }}>
                            Appointments for {patient.p_name}
                          </h4>
                          {patientAppointments.length > 0 ? (
                            <table className="table" style={{ marginBottom: '0', fontSize: '14px' }}>
                              <thead>
                                <tr>
                                  <th>Appointment ID</th>
                                  <th>Doctor</th>
                                  <th>Date</th>
                                  <th>Time</th>
                                  <th>Priority</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {patientAppointments.map(appointment => (
                                  <tr key={appointment.a_id}>
                                    <td>{appointment.a_id}</td>
                                    <td>{getDoctorName(appointment.d_id)}</td>
                                    <td>{appointment.date}</td>
                                    <td>{appointment.time}</td>
                                    <td>
                                      <span className={`status-badge priority-${appointment.priority.toLowerCase()}`}>
                                        {appointment.priority}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`status-badge status-${appointment.a_status.toLowerCase()}`}>
                                        {appointment.a_status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p style={{ color: '#6c757d', fontStyle: 'italic', margin: '0' }}>
                              No appointments scheduled for this patient.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Patients;
