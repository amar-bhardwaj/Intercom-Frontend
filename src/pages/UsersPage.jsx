import { useEffect, useState } from "react";
import API from "../services/api";

const UsersPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await API.get("/admin/users");
    setUsers(res.data || []);
  };

  const deleteUser = async (id) => {
    await API.delete(`/admin/delete-user/${id}`);
    fetchUsers();
  };

  return (
    <div className="adminPage">
      <h2>👥 Manage Users</h2>

      {users.map((u) => (
        <div key={u._id} className="card">
          {u.fullName} ({u.role})
          <button onClick={() => deleteUser(u._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default UsersPage;