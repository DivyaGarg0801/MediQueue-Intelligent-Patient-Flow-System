import React, { useEffect, useState } from "react";
import { fetchQueue } from "../../api";
import Table from "../../components/table";

const RegistrationDesk = () => {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    fetchQueue().then((data) => setQueue(data));
  }, []);

  const columns = ["q_id", "a_id", "q_status"];

  return (
    <div>
      <h1>Registration Desk</h1>
      <Table data={queue} columns={columns} />
    </div>
  );
};

export default RegistrationDesk;
