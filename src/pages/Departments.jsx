// import { useEffect, useState } from "react";
// import API from "../services/api";

// const Departments = () => {
//   const [departments, setDepartments] = useState([]);
//   const [name, setName] = useState("");

//   useEffect(() => {
//     fetchDepartments();
//   }, []);

//   const fetchDepartments = async () => {
//     const res = await API.get("/admin/departments");
//     setDepartments(res.data);
//   };

//   // ✅ CREATE
//   const createDept = async () => {
//     await API.post("/admin/create-department", { name });
//     setName("");
//     fetchDepartments();
//   };

//   // ✅ DELETE
//   const deleteDept = async (name) => {
//     await API.delete("/admin/delete-department", {
//       data: { name }
//     });
//     fetchDepartments();
//   };

//   return (
//     <div>
//       <h2>🏢 Departments</h2>

//       <div style={{ marginBottom: "20px" }}>
//         <input
//           value={name}
//           placeholder="Department name"
//           onChange={(e) => setName(e.target.value)}
//         />

//         <button onClick={createDept}>Create</button>
//       </div>

//       {departments.map((d) => (
//         <div key={d._id} className="userItem">
//           {d.name}

//           <button onClick={() => {
//             if (window.confirm("Are you sure you want to delete this department?")) {
//               deleteDepartment(dept._id);
//             }
//           }}>
//             Delete
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default Departments;





import { useEffect, useState } from "react";
import API from "../services/api";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const res = await API.get("/admin/departments");
    setDepartments(res.data);
  };

  // ✅ CREATE
  const createDept = async () => {
    await API.post("/admin/create-department", { name });
    setName("");
    fetchDepartments();
  };

  // ✅ DELETE
  const deleteDept = async (name) => {
    await API.delete("/admin/delete-department", {
      data: { name }
    });
    fetchDepartments();
  };

  const styles = {
    container: {
      padding: "24px",
      maxWidth: "1200px",
      margin: "0 auto",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    },
    header: {
      marginBottom: "32px",
    },
    title: {
      fontSize: "clamp(24px, 5vw, 32px)",
      fontWeight: "700",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "8px",
    },
    subtitle: {
      fontSize: "14px",
      color: "#666",
      marginTop: "-8px",
    },
    inputSection: {
      background: "white",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "32px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "8px",
      color: "#333",
    },
    inputWrapper: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
    },
    input: {
      flex: 1,
      minWidth: "200px",
      padding: "12px 16px",
      border: "2px solid #e0e0e0",
      borderRadius: "12px",
      fontSize: "14px",
      transition: "all 0.3s ease",
      outline: "none",
    },
    button: {
      padding: "12px 24px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    statsBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "12px",
    },
    statsText: {
      fontSize: "14px",
      color: "#666",
      fontWeight: "500",
    },
    refreshBtn: {
      padding: "8px 16px",
      background: "white",
      border: "1px solid #ddd",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      transition: "all 0.2s ease",
    },
    departmentsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "16px",
    },
    card: {
      background: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      transition: "all 0.3s ease",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
    },
    cardContent: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flex: 1,
    },
    cardIcon: {
      fontSize: "24px",
    },
    cardName: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
      margin: 0,
    },
    deleteBtn: {
      padding: "8px 16px",
      background: "#ff4757",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
    loadingState: {
      textAlign: "center",
      padding: "40px",
      color: "#666",
    },
    emptyState: {
      textAlign: "center",
      padding: "60px",
      background: "white",
      borderRadius: "12px",
      color: "#999",
    },
    emptyIcon: {
      fontSize: "48px",
      marginBottom: "16px",
      opacity: 0.5,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏢 Departments</h1>
        <p style={styles.subtitle}>Manage all departments</p>
      </div>

      {/* Create Department Section */}
      <div style={styles.inputSection}>
        <label style={styles.label}>Create New Department</label>
        <div style={styles.inputWrapper}>
          <input
            style={{
              ...styles.input,
              ...(name && { borderColor: "#667eea" }),
            }}
            value={name}
            placeholder="Department name"
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            onBlur={(e) => !name && (e.target.style.borderColor = "#e0e0e0")}
          />
          <button
            style={styles.button}
            onClick={createDept}
            onMouseEnter={(e) => {
              if (name.trim()) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            + Create Department
          </button>
        </div>
      </div>

      {/* Stats and Refresh */}
      <div style={styles.statsBar}>
        <div style={styles.statsText}>
          📊 Total Departments: {departments?.length || 0}
        </div>
        <button
          style={styles.refreshBtn}
          onClick={fetchDepartments}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f5f5";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Departments List */}
      {!departments ? (
        <div style={styles.loadingState}>
          <div>⏳ Loading departments...</div>
        </div>
      ) : departments.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏢</div>
          <p>No departments yet</p>
          <small>Create your first department using the form above</small>
        </div>
      ) : (
        <div style={styles.departmentsGrid}>
          {departments.map((d, index) => (
            <div
              key={d._id}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              }}
            >
              <div style={styles.cardContent}>
                <div style={styles.cardIcon}>
                  {index % 6 === 0 ? "🏢" : index % 6 === 1 ? "💼" : index % 6 === 2 ? "📊" : index % 6 === 3 ? "⚙️" : index % 6 === 4 ? "🎯" : "📈"}
                </div>
                <p style={styles.cardName}>{d.name}</p>
              </div>
              <button
                style={styles.deleteBtn}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${d.name}" department?`)) {
                    deleteDept(d.name);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e84118";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ff4757";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Departments;