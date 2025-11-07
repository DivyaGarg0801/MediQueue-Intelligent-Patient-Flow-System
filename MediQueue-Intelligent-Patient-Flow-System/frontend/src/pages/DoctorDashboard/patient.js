import React, { useEffect, useState } from "react";

const Patient = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5050/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error("Error fetching patients:", err));
  }, []);

  return (
    <div>
      <h1>Patients List</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
          {patients.length > 0 ? (
            patients.map((p) => (
              <tr key={p.p_id}>
                <td>{p.p_id}</td>
                <td>{p.p_name}</td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>{p.contact}</td>

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">Loading patients...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Patient;
