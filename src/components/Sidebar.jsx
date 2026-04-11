import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../services/socket";

const Sidebar = ({ setPage }) => {
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const role = localStorage.getItem("role");
  const departmentId = localStorage.getItem("department");
  const userName = localStorage.getItem("userName");

  useEffect(() => {
    fetchUsers();
  }, []);


  useEffect(() => {
    socket.on("onlineUsers", (list) => {
      setOnlineUsers(list);
    });

    return () => socket.off("onlineUsers");
  }, []);



  // 👥 USERS
  const fetchUsers = async () => {
    try {
      const res = await API.get(`/admin/users/${departmentId}`);
      setUsers(
        role === "admin"
          ? res.data || []
          : (res.data || []).filter(
            (u) => u.department?._id === departmentId
          )
      );
    } catch {
      setUsers([]);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };



  return (
    <div className="sidebar">
      <h3
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setShowUsers(!showUsers)}
      >
        👥 Team {showUsers ? "▼" : "▶"}
      </h3>

      <p>Logged in as:</p>
      <strong>{userName}</strong>

      <hr />

      {/* 🔥 EMPLOYEE NAV */}
      {role !== "admin" && (
        <>
          <div className="navItem" onClick={() => setPage("chat")}>
            💬 Chat
          </div>

          <div className="navItem" onClick={() => setPage("notifications")}>
            🔔 Notifications
          </div>

          <hr />
        </>
      )}

      {/* 🔥 ADMIN NAV */}
      {role === "admin" && (
        <>
          <div className="navItem" onClick={() => setPage("chat")}>
            💬 Chat
          </div>

          <div className="navItem" onClick={() => setPage("users")}>
            👥 Users
          </div>

          <div className="navItem" onClick={() => setPage("departments")}>
            🏢 Departments
          </div>

          <div className="navItem" onClick={() => setPage("notifications")}>
            🔔 Notifications
          </div>

          <hr />
        </>
      )}

      {/* 👥 USERS LIST */}
      {showUsers &&
        users.filter((u) => {
          // ✅ ADMIN sees all online users
          if (role === "admin") {
            return onlineUsers.includes(u._id.toString());
          }

          // ✅ EMPLOYEE sees ONLY:
          // 1. Same department
          // 2. Only ONLINE users
          return (
            u.department?._id === departmentId &&
            onlineUsers.includes(u._id.toString())
          );
        })
          .map((u) => (
            <div key={u._id} className="userItem" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: onlineUsers.includes(u._id) ? "green" : "gray"
                }}
              ></span>
              {u.fullName}
            </div>
          ))}

      {showUsers &&
        users.filter((u) =>
          onlineUsers.includes(u._id.toString())
        ).length === 0 && (
          <p style={{ fontSize: "12px", color: "gray" }}>
            No users online
          </p>
        )}

      <button className="logoutBtn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Sidebar;




// import { useEffect, useState, useRef } from "react";
// import API from "../services/api";
// import socket from "../services/socket";

// const Sidebar = ({ setPage }) => {
//   const [users, setUsers] = useState([]);

//   // 🔔 NOTIFICATION STATES
//   const [notifications, setNotifications] = useState([]);
//   const [showNotifications, setShowNotifications] = useState(false);

//   const role = localStorage.getItem("role");
//   const departmentId = localStorage.getItem("department");
//   const userName = localStorage.getItem("userName");
//   const userId = localStorage.getItem("userId");

//   const audioRef = useRef(null);

//   useEffect(() => {
//     audioRef.current = new Audio("/warning.wav");
//   }, []);

//   useEffect(() => {
//     fetchUsers();
//     fetchNotifications();
//   }, []);

//   // 👥 USERS
//   const fetchUsers = async () => {
//     try {
//       const res = await API.get(`/admin/users/${departmentId}`);
//       setUsers(res.data || []);
//     } catch {
//       setUsers([]);
//     }
//   };

//   // 🔔 FETCH NOTIFICATIONS (FROM DB)
//   const fetchNotifications = async () => {
//     try {
//       const res = await API.get(
//         `/messages/notifications/${departmentId}`
//       );
//       setNotifications(res.data || []);
//     } catch {
//       setNotifications([]);
//     }
//   };

//   // 🔔 REALTIME NOTIFICATIONS
//   useEffect(() => {
//     socket.on("notification", (data) => {
//       setNotifications((prev) => [data, ...prev]);

//       // 🔊 SOUND
//       audioRef.current?.play().catch(() => { });
//     });

//     return () => {
//       socket.off("notification");
//     };
//   }, []);

//   const logout = () => {
//     localStorage.clear();
//     window.location.reload();
//   };

//   return (
//     <div className="sidebar">
//       <h3>👥 Team</h3>

//       <p>Logged in as:</p>
//       <strong>{userName}</strong>

//       <hr />

//       {/* 🔔 NOTIFICATION BUTTON */}
//       <div
//         className="navItem"
//         onClick={() => setShowNotifications(!showNotifications)}
//       >
//         🔔 Notifications ({notifications.length})
//       </div>

//       {/* 🔔 NOTIFICATION PANEL */}
//       {showNotifications && (
//         <div
//           style={{
//             maxHeight: "200px",
//             overflowY: "auto",
//             background: "#ffffff",
//             border: "1px solid #ccc",
//             marginBottom: "10px",
//             padding: "5px"
//           }}
//         >
//           {notifications.length === 0 && <p>No notifications</p>}

//           {notifications.map((n) => (
//             <div
//               key={n._id}
//               style={{
//                 padding: "8px",
//                 marginBottom: "5px",
//                 background: "#15a6e9",
//                 borderRadius: "5px"
//               }}
//             >
//               <strong>🔔 {n.message}</strong>

//               <div style={{ fontSize: "12px", color: "white" }}>
//                 {new Date(n.createdAt).toLocaleString()}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* 🔥 ADMIN NAV */}
//       {role === "admin" && (
//         <>
//           <div className="navItem" onClick={() => setPage("chat")}>
//             💬 Chat
//           </div>
//           <div className="navItem" onClick={() => setPage("users")}>
//             👥 Users
//           </div>
//           <div className="navItem" onClick={() => setPage("departments")}>
//             🏢 Departments
//           </div>

//           <hr />
//         </>
//       )}

//       {/* 👥 USERS LIST */}
//       {users.map((u) => (
//         <div key={u._id} className="userItem">
//           {u.fullName}
//         </div>
//       ))}

//       <button className="logoutBtn" onClick={logout}>
//         Logout
//       </button>
//     </div>
//   );
// };

// export default Sidebar;