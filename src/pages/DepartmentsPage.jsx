import { useEffect, useState } from "react";
import API from "../services/api";

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const res = await API.get("/admin/departments");
    setDepartments(res.data || []);
  };

  const createDept = async () => {
    await API.post("/admin/create-department", { name });
    setName("");
    fetchDepartments();
  };

  return (
    <div className="adminPage">
      <h2>🏢 Departments</h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New Department"
      />
      <button onClick={createDept}>Create</button>

      {departments.map((d) => (
        <div key={d._id} className="card">
          {d.name}
        </div>
      ))}
    </div>
  );
};

export default DepartmentsPage;