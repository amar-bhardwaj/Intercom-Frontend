import { useEffect, useState } from "react";
import API from "../services/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    department: "",
    role: "employee"
  });

  const [managerForm, setManagerForm] = useState({
    userId: "",
    departmentId: ""
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  // ✅ FETCH USERS
  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data || []);
    } catch {
      console.error("Error fetching users");
    }
  };

  // ✅ FETCH DEPARTMENTS
  const fetchDepartments = async () => {
    try {
      const res = await API.get("/admin/departments");
      setDepartments(res.data || []);
    } catch {
      console.error("Error fetching departments");
    }
  };

  // ✅ CREATE USER
  const createUser = async () => {
    if (!form.fullName || !form.username || !form.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      await API.post("/auth/register", form);

      alert("User created successfully");

      setForm({
        fullName: "",
        username: "",
        password: "",
        department: "",
        role: "employee"
      });

      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating user");
    }
  };

  // ✅ DELETE USER
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await API.delete(`/admin/delete-user/${id}`);
      fetchUsers();
    } catch {
      alert("Error deleting user");
    }
  };

  // ✅ ASSIGN MANAGER
  const assignManager = async () => {
    if (!managerForm.userId || !managerForm.departmentId) {
      alert("Select user and department");
      return;
    }

    try {
      await API.post("/admin/assign-manager", managerForm);

      alert("Manager assigned successfully");

      setManagerForm({
        userId: "",
        departmentId: ""
      });

      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Error assigning manager");
    }
  };

  // ✅ REMOVE MANAGER
  const removeManager = async (userId) => {
    if (!window.confirm("Make this user an employee again?")) return;

    try {
      await API.post("/admin/remove-manager", { userId });

      alert("Manager removed");

      fetchUsers();
    } catch {
      alert("Error removing manager");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.fullName
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesDept = selectedDept
      ? u.department?._id === selectedDept
      : true;

    return matchesSearch && matchesDept;
  });

  // Search and filter for All Users section
  const [userListSearch, setUserListSearch] = useState("");
  const [userListDept, setUserListDept] = useState("");

  const filteredUserList = users.filter((u) => {
    const matchesSearch = u.fullName
      ?.toLowerCase()
      .includes(userListSearch.toLowerCase());

    const matchesDept = userListDept
      ? u.department?._id === userListDept
      : true;

    return matchesSearch && matchesDept;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUserList.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUserList.length / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userListSearch, userListDept]);

  return (
    <div>

      <div style={{ marginBottom: "15px" }}>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTER */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

      </div>
      <h2>👥 Users Management</h2>

      {/* 🔥 CREATE USER */}
      <div className="adminCard">
        <h3>Create New User</h3>

        <input
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) =>
            setForm({ ...form, fullName: e.target.value })
          }
        />

        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <select
          value={form.department}
          onChange={(e) =>
            setForm({ ...form, department: e.target.value })
          }
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>

        <button onClick={createUser}>Create User</button>
      </div>

      {/* 🔥 ASSIGN MANAGER */}
      <div className="adminCard">
        <h3>Assign Manager</h3>

        <select
          value={managerForm.userId}
          onChange={(e) =>
            setManagerForm({ ...managerForm, userId: e.target.value })
          }
        >
          <option value="">Select User</option>
          {filteredUsers.map((u) => (
            <option key={u._id} value={u._id}>
              {u.fullName}
            </option>
          ))}
        </select>

        <select
          value={managerForm.departmentId}
          onChange={(e) =>
            setManagerForm({
              ...managerForm,
              departmentId: e.target.value
            })
          }
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        <button onClick={assignManager}>
          Assign Manager
        </button>
      </div>

      {/* 🔥 USERS LIST */}
      <div className="adminCard">
        <h3>All Users</h3>

        {/* Search and Filter for All Users section */}
        <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="🔍 Search users by name..."
            value={userListSearch}
            onChange={(e) => setUserListSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            value={userListDept}
            onChange={(e) => setUserListDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show total count */}
        <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
          Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUserList.length)} of {filteredUserList.length} users
        </div>

        {currentUsers.length === 0 && <p>No users found</p>}

        {currentUsers.map((u) => (
          <div key={u._id} className="adminRow">
            <div>
              <strong>{u.fullName}</strong> ({u.username}) <br />

              <small>
                {u.role === "manager" ? "👨‍💼 Manager" : "👤 Employee"} |{" "}
                {u.department?.name || "No Department"}
              </small>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {/* 🔥 REMOVE MANAGER BUTTON */}
              {u.role === "manager" && (
                <button onClick={() => removeManager(u._id)}>
                  Remove Manager
                </button>
              )}

              <button onClick={() => deleteUser(u._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Pagination Controls */}
        {filteredUserList.length > usersPerPage && (
          <div style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap"
          }}>
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              style={{
                padding: "8px 16px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
                backgroundColor: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px"
              }}
            >
              ← Previous
            </button>
            
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center" }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    style={{
                      padding: "8px 14px",
                      cursor: "pointer",
                      backgroundColor: currentPage === pageNum ? "#764ba2" : "#e0e0e0",
                      color: currentPage === pageNum ? "white" : "#333",
                      border: "none",
                      borderRadius: "6px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = "#667eea";
                        e.currentTarget.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = "#e0e0e0";
                        e.currentTarget.style.color = "#333";
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span style={{ padding: "8px 5px" }}>...</span>
              )}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <button
                  onClick={() => paginate(totalPages)}
                  style={{
                    padding: "8px 14px",
                    cursor: "pointer",
                    backgroundColor: "#e0e0e0",
                    color: "#333",
                    border: "none",
                    borderRadius: "6px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#667eea";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#e0e0e0";
                    e.currentTarget.style.color = "#333";
                  }}
                >
                  {totalPages}
                </button>
              )}
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 16px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
                backgroundColor: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px"
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;