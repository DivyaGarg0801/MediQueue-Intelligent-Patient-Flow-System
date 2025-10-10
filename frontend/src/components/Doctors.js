import React, { useState, useEffect } from 'react';
import { doctorAPI, appointmentAPI, patientAPI } from '../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    d_name: '',
    specialization: '',
    availability: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [doctorsRes, appointmentsRes, patientsRes] = await Promise.all([
        doctorAPI.getAll(),
        appointmentAPI.getAll(),
        patientAPI.getAll()
      ]);
      setDoctors(doctorsRes.data);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await doctorAPI.update(editingDoctor.d_id, formData);
      } else {
        await doctorAPI.create(formData);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving doctor:', error);
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      d_name: doctor.d_name,
      specialization: doctor.specialization,
      availability: doctor.availability
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await doctorAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting doctor:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      d_name: '',
      specialization: '',
      availability: ''
    });
    setEditingDoctor(null);
    setShowForm(false);
  };

  const getDoctorAppointments = (doctorId) => {
    return appointments.filter(appointment => appointment.d_id === doctorId);
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.p_id === patientId);
    return patient ? patient.p_name : 'Unknown';
  };

  const toggleDoctorExpansion = (doctorId) => {
    setExpandedDoctor(expandedDoctor === doctorId ? null : doctorId);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Doctors Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Add New Doctor
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={formData.d_name}
                onChange={(e) => setFormData({...formData, d_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Specialization:</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Availability:</label>
              <input
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                placeholder="e.g., Mon-Fri 9am-5pm"
                required
              />
            </div>
            <button type="submit" className="btn btn-success">
              {editingDoctor ? 'Update' : 'Add'} Doctor
            </button>
            <button type="button" className="btn btn-danger" onClick={resetForm}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Doctors List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Specialization</th>
              <th>Availability</th>
              <th>Patients</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(doctor => {
              const doctorAppointments = getDoctorAppointments(doctor.d_id);
              const isExpanded = expandedDoctor === doctor.d_id;
              
              return (
                <React.Fragment key={doctor.d_id}>
                  <tr>
                    <td>{doctor.d_id}</td>
                    <td>{doctor.d_name}</td>
                    <td>{doctor.specialization}</td>
                    <td>{doctor.availability}</td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => toggleDoctorExpansion(doctor.d_id)}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        {doctorAppointments.length} patient{doctorAppointments.length !== 1 ? 's' : ''}
                        {isExpanded ? ' ▼' : ' ▶'}
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-warning" onClick={() => handleEdit(doctor)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(doctor.d_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan="6" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                        <div style={{ padding: '15px', borderTop: '1px solid #dee2e6' }}>
                          <h4 style={{ marginBottom: '10px', color: '#495057' }}>
                            Patients for {doctor.d_name}
                          </h4>
                          {doctorAppointments.length > 0 ? (
                            <table className="table" style={{ marginBottom: '0', fontSize: '14px' }}>
                              <thead>
                                <tr>
                                  <th>Appointment ID</th>
                                  <th>Patient Name</th>
                                  <th>Date</th>
                                  <th>Time</th>
                                  <th>Priority</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {doctorAppointments.map(appointment => (
                                  <tr key={appointment.a_id}>
                                    <td>{appointment.a_id}</td>
                                    <td>{getPatientName(appointment.p_id)}</td>
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
                              No patients scheduled with this doctor.
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

export default Doctors;
