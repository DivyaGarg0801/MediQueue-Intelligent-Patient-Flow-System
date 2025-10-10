import React, { useState, useEffect } from 'react';
import { patientAPI, doctorAPI, appointmentAPI, billingAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    revenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, doctorsRes, appointmentsRes, billingRes] = await Promise.all([
          patientAPI.getAll(),
          doctorAPI.getAll(),
          appointmentAPI.getAll(),
          billingAPI.getAll()
        ]);

        const totalRevenue = billingRes.data
          .filter(bill => bill.payment_status === 'Paid')
          .reduce((sum, bill) => sum + parseFloat(bill.amount), 0);

        setStats({
          patients: patientsRes.data.length,
          doctors: doctorsRes.data.length,
          appointments: appointmentsRes.data.length,
          revenue: totalRevenue
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <h3>Total Patients</h3>
          <h2 style={{ color: '#007bff', fontSize: '2em' }}>{stats.patients}</h2>
        </div>
        <div className="card">
          <h3>Total Doctors</h3>
          <h2 style={{ color: '#28a745', fontSize: '2em' }}>{stats.doctors}</h2>
        </div>
        <div className="card">
          <h3>Total Appointments</h3>
          <h2 style={{ color: '#ffc107', fontSize: '2em' }}>{stats.appointments}</h2>
        </div>
        <div className="card">
          <h3>Total Revenue</h3>
          <h2 style={{ color: '#dc3545', fontSize: '2em' }}>₹{stats.revenue.toLocaleString()}</h2>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
