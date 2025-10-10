import React, { useState, useEffect } from 'react';
import { appointmentAPI, patientAPI, doctorAPI } from '../services/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({
    p_id: '',
    d_id: '',
    date: '',
    time: '',
    priority: '',
    a_status: ''
  });
  const [patientFormData, setPatientFormData] = useState({
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
      const [appointmentsRes, patientsRes, doctorsRes] = await Promise.all([
        appointmentAPI.getAll(),
        patientAPI.getAll(),
        doctorAPI.getAll()
      ]);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await appointmentAPI.update(editingAppointment.a_id, formData);
      } else {
        await appointmentAPI.create(formData);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      p_id: appointment.p_id,
      d_id: appointment.d_id,
      date: appointment.date,
      time: appointment.time,
      priority: appointment.priority,
      a_status: appointment.a_status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      p_id: '',
      d_id: '',
      date: '',
      time: '',
      priority: '',
      a_status: ''
    });
    setEditingAppointment(null);
    setShowForm(false);
  };

  const resetPatientForm = () => {
    setPatientFormData({
      p_name: '',
      age: '',
      gender: '',
      contact: '',
      address: ''
    });
    setShowPatientForm(false);
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await patientAPI.create(patientFormData);
      // Refresh patients list
      const patientsRes = await patientAPI.getAll();
      setPatients(patientsRes.data);
      
      // Auto-select the newly created patient
      const newPatient = patientsRes.data.find(p => p.p_name === patientFormData.p_name);
      if (newPatient) {
        setFormData({...formData, p_id: newPatient.p_id});
      }
      
      resetPatientForm();
      alert('Patient added successfully! You can now schedule their appointment.');
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Error saving patient. Please try again.');
    }
  };

  const getPatientName = (pId) => {
    const patient = patients.find(p => p.p_id === pId);
    return patient ? patient.p_name : 'Unknown';
  };

  const getDoctorName = (dId) => {
    const doctor = doctors.find(d => d.d_id === dId);
    return doctor ? doctor.d_name : 'Unknown';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Appointments Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Schedule New Appointment
        </button>
      </div>

      {showPatientForm && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#e3f2fd' }}>
          <h3>Add New Patient</h3>
          <form onSubmit={handlePatientSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={patientFormData.p_name}
                onChange={(e) => setPatientFormData({...patientFormData, p_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Age:</label>
              <input
                type="number"
                value={patientFormData.age}
                onChange={(e) => setPatientFormData({...patientFormData, age: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select
                value={patientFormData.gender}
                onChange={(e) => setPatientFormData({...patientFormData, gender: e.target.value})}
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
                value={patientFormData.contact}
                onChange={(e) => setPatientFormData({...patientFormData, contact: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Address:</label>
              <textarea
                value={patientFormData.address}
                onChange={(e) => setPatientFormData({...patientFormData, address: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn btn-success">
              Add Patient & Continue
            </button>
            <button type="button" className="btn btn-danger" onClick={resetPatientForm}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>{editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Patient:</label>
              <select
                value={formData.p_id}
                onChange={(e) => {
                  if (e.target.value === 'new_patient') {
                    setShowPatientForm(true);
                  } else {
                    setFormData({...formData, p_id: e.target.value});
                  }
                }}
                required
              >
                <option value="">Select Patient</option>
                {patients.map(patient => (
                  <option key={patient.p_id} value={patient.p_id}>
                    {patient.p_name}
                  </option>
                ))}
                <option value="new_patient" style={{ fontWeight: 'bold', color: '#007bff' }}>
                  Add New Patient
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Doctor:</label>
              <select
                value={formData.d_id}
                onChange={(e) => setFormData({...formData, d_id: e.target.value})}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.d_id} value={doctor.d_id}>
                    {doctor.d_name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Time:</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Priority:</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                required
              >
                <option value="">Select Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={formData.a_status}
                onChange={(e) => setFormData({...formData, a_status: e.target.value})}
                required
              >
                <option value="">Select Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="btn btn-success">
              {editingAppointment ? 'Update' : 'Schedule'} Appointment
            </button>
            <button type="button" className="btn btn-danger" onClick={resetForm}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Appointments List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appointment => (
              <tr key={appointment.a_id}>
                <td>{appointment.a_id}</td>
                <td>{getPatientName(appointment.p_id)}</td>
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
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(appointment)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(appointment.a_id)}>
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

export default Appointments;
