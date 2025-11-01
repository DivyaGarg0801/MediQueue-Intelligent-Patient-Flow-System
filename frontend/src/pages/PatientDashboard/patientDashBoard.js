import React, { useEffect, useState } from "react";
import { fetchPatients } from "../../api";
import Table from "../../components/table";
import Form from "../../components/form";

const PatientDashboard = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    const data = await fetchPatients();
    setPatients(data);
  };

  const handleAdd = async (newPatient) => {
    await fetch("http://127.0.0.1:5000/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPatient),
    });
    loadPatients(); // refresh table
  };

  const columns = ["p_id", "p_name", "age", "gender", "contact"];

  const fields = [
    { name: "p_name", label: "Name", type: "text" },
    { name: "p_age", label: "Age", type: "number" },
    { name: "p_gender", label: "Gender", type: "text" },
    { name: "p_contact", label: "Contact", type: "text" },
    
  ];

  return (
    <div>
      <h1>Patient Dashboard</h1>
      <h3>Add New Patient</h3>
      <Form fields={fields} onSubmit={handleAdd} />
      <Table data={patients} columns={columns} />
    </div>
  );
};

export default PatientDashboard;
