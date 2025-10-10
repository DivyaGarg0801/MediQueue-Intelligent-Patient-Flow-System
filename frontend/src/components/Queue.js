import React, { useState, useEffect } from 'react';
import { queueAPI, appointmentAPI } from '../services/api';

const Queue = () => {
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQueue, setEditingQueue] = useState(null);
  const [formData, setFormData] = useState({
    a_id: '',
    q_status: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [queueRes, appointmentsRes] = await Promise.all([
        queueAPI.getAll(),
        appointmentAPI.getAll()
      ]);
      setQueue(queueRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQueue) {
        await queueAPI.update(editingQueue.q_id, formData);
      } else {
        await queueAPI.create(formData);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving queue entry:', error);
    }
  };

  const handleEdit = (queueItem) => {
    setEditingQueue(queueItem);
    setFormData({
      a_id: queueItem.a_id,
      q_status: queueItem.q_status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this queue entry?')) {
      try {
        await queueAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting queue entry:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      a_id: '',
      q_status: ''
    });
    setEditingQueue(null);
    setShowForm(false);
  };

  const getAppointmentInfo = (aId) => {
    const appointment = appointments.find(a => a.a_id === aId);
    return appointment ? `Appointment #${appointment.a_id}` : 'Unknown';
  };

  const waitingCount = queue.filter(item => item.q_status === 'Waiting').length;
  const inProgressCount = queue.filter(item => item.q_status === 'In Progress').length;
  const completedCount = queue.filter(item => item.q_status === 'Completed').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Queue Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Add to Queue
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h4>Waiting</h4>
          <h3 style={{ color: '#ffc107' }}>{waitingCount}</h3>
        </div>
        <div className="card">
          <h4>In Progress</h4>
          <h3 style={{ color: '#007bff' }}>{inProgressCount}</h3>
        </div>
        <div className="card">
          <h4>Completed</h4>
          <h3 style={{ color: '#28a745' }}>{completedCount}</h3>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingQueue ? 'Edit Queue Entry' : 'Add to Queue'}</h3>
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
              <label>Queue Status:</label>
              <select
                value={formData.q_status}
                onChange={(e) => setFormData({...formData, q_status: e.target.value})}
                required
              >
                <option value="">Select Status</option>
                <option value="Waiting">Waiting</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="btn btn-success">
              {editingQueue ? 'Update' : 'Add'} Queue Entry
            </button>
            <button type="button" className="btn btn-danger" onClick={resetForm}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Queue List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Appointment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.map(queueItem => (
              <tr key={queueItem.q_id}>
                <td>{queueItem.q_id}</td>
                <td>{getAppointmentInfo(queueItem.a_id)}</td>
                <td>
                  <span className={`status-badge status-${queueItem.q_status.toLowerCase().replace(' ', '-')}`}>
                    {queueItem.q_status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(queueItem)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(queueItem.q_id)}>
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

export default Queue;
