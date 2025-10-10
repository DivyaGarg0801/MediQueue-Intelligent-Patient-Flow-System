import React, { useState, useEffect } from 'react';
import { consultationAPI, appointmentAPI } from '../services/api';

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [formData, setFormData] = useState({
    a_id: '',
    symptoms: '',
    prescription: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [consultationsRes, appointmentsRes] = await Promise.all([
        consultationAPI.getAll(),
        appointmentAPI.getAll()
      ]);
      setConsultations(consultationsRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingConsultation) {
        await consultationAPI.update(editingConsultation.c_id, formData);
      } else {
        await consultationAPI.create(formData);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving consultation:', error);
    }
  };

  const handleEdit = (consultation) => {
    setEditingConsultation(consultation);
    setFormData({
      a_id: consultation.a_id,
      symptoms: consultation.symptoms,
      prescription: consultation.prescription
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this consultation?')) {
      try {
        await consultationAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting consultation:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      a_id: '',
      symptoms: '',
      prescription: ''
    });
    setEditingConsultation(null);
    setShowForm(false);
  };

  const getAppointmentInfo = (aId) => {
    const appointment = appointments.find(a => a.a_id === aId);
    return appointment ? `Appointment #${appointment.a_id}` : 'Unknown';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Consultations Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Add New Consultation
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingConsultation ? 'Edit Consultation' : 'Add New Consultation'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Appointment:</label>
              <select
                value={formData.a_id}
                onChange={(e) => setFormData({...formData, a_id: e.target.value})}
                required
              >
                <option value="">Select Appointment</option>
                {appointments.map(appointment => (
                  <option key={appointment.a_id} value={appointment.a_id}>
                    Appointment #{appointment.a_id} - {appointment.date} {appointment.time}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Symptoms:</label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label>Prescription:</label>
              <textarea
                value={formData.prescription}
                onChange={(e) => setFormData({...formData, prescription: e.target.value})}
                rows="4"
                required
              />
            </div>
            <button type="submit" className="btn btn-success">
              {editingConsultation ? 'Update' : 'Add'} Consultation
            </button>
            <button type="button" className="btn btn-danger" onClick={resetForm}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Consultations List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Appointment</th>
              <th>Symptoms</th>
              <th>Prescription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map(consultation => (
              <tr key={consultation.c_id}>
                <td>{consultation.c_id}</td>
                <td>{getAppointmentInfo(consultation.a_id)}</td>
                <td>{consultation.symptoms}</td>
                <td>{consultation.prescription}</td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(consultation)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(consultation.c_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Consultations;
