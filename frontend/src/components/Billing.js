import React, { useState, useEffect } from 'react';
import { billingAPI, appointmentAPI } from '../services/api';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({
    a_id: '',
    billing_date: '',
    amount: '',
    payment_status: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [billsRes, appointmentsRes] = await Promise.all([
        billingAPI.getAll(),
        appointmentAPI.getAll()
      ]);
      setBills(billsRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBill) {
        await billingAPI.update(editingBill.b_id, formData);
      } else {
        await billingAPI.create(formData);
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving bill:', error);
    }
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setFormData({
      a_id: bill.a_id,
      billing_date: bill.billing_date,
      amount: bill.amount,
      payment_status: bill.payment_status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await billingAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      a_id: '',
      billing_date: '',
      amount: '',
      payment_status: ''
    });
    setEditingBill(null);
    setShowForm(false);
  };

  const getAppointmentInfo = (aId) => {
    const appointment = appointments.find(a => a.a_id === aId);
    return appointment ? `Appointment #${appointment.a_id}` : 'Unknown';
  };

  const totalRevenue = bills
    .filter(bill => bill.payment_status === 'Paid')
    .reduce((sum, bill) => sum + parseFloat(bill.amount), 0);

  const pendingAmount = bills
    .filter(bill => bill.payment_status === 'Pending')
    .reduce((sum, bill) => sum + parseFloat(bill.amount), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Billing Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Create New Bill
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h4>Total Revenue</h4>
          <h3 style={{ color: '#28a745' }}>₹{totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="card">
          <h4>Pending Amount</h4>
          <h3 style={{ color: '#ffc107' }}>₹{pendingAmount.toLocaleString()}</h3>
        </div>
        <div className="card">
          <h4>Total Bills</h4>
          <h3 style={{ color: '#007bff' }}>{bills.length}</h3>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingBill ? 'Edit Bill' : 'Create New Bill'}</h3>
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
                    Appointment #{appointment.a_id} - {appointment.date}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Billing Date:</label>
              <input
                type="date"
                value={formData.billing_date}
                onChange={(e) => setFormData({...formData, billing_date: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Amount (₹):</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Payment Status:</label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                required
              >
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="btn btn-success">
              {editingBill ? 'Update' : 'Create'} Bill
            </button>
            <button type="button" className="btn btn-danger" onClick={resetForm}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Bills List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Appointment</th>
              <th>Billing Date</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.b_id}>
                <td>{bill.b_id}</td>
                <td>{getAppointmentInfo(bill.a_id)}</td>
                <td>{bill.billing_date}</td>
                <td>₹{parseFloat(bill.amount).toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${bill.payment_status.toLowerCase()}`}>
                    {bill.payment_status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(bill)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(bill.b_id)}>
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

export default Billing;
