import React, { useEffect, useState } from "react";
import { fetchDoctors } from "../../api";
import Table from "../../components/table";

const DoctorDashboard = () => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchDoctors().then((data) => setDoctors(data));
  }, []);

  const columns = ["d_id", "d_name", "specialization", "availability"];

  return (
    <div>
      <h1>Doctor Dashboard</h1>
      <Table data={doctors} columns={columns} />
    </div>
  );
};

export default DoctorDashboard;
