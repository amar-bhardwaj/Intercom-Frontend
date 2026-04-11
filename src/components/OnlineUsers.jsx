import { useEffect, useState } from "react";
import socket from "../services/socket";
import API from "../services/api";

const OnlineUsers = () => {
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ✅ fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/admin/users");
        setUsers(res.data || []);
      } catch {
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  // ✅ listen online users
  useEffect(() => {
    socket.on("onlineUsers", (list) => {
      setOnlineUsers(list);
    });

    return () => socket.off("onlineUsers");
  }, []);

  // ✅ filter only online users
  const onlineList = users.filter((u) =>
    onlineUsers.includes(u._id.toString())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>🟢 Online Users</h2>

      {onlineList.length === 0 && <p>No users online</p>}

      {onlineList.map((u) => (
        <div
          key={u._id}
          style={{
            background: "#f5f5f5",
            padding: "10px",
            marginBottom: "8px",
            borderRadius: "6px",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <span>
            🟢 {u.fullName}
          </span>

          <small style={{ color: "gray" }}>
            {u.department?.name || "No Department"}
          </small>
        </div>
      ))}
    </div>
  );
};

export default OnlineUsers;