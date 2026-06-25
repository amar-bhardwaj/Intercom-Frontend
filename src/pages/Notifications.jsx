import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import socket from "../services/socket";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const perPage = 10;

    const role = localStorage.getItem("role");

    const departmentId = localStorage.getItem("department");
    const userId = localStorage.getItem("userId"); // ✅ NEW

    const audioRef = useRef(null);

    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;

    const [notificationMsg, setNotificationMsg] = useState("");
    const [file, setFile] = useState(null);

    const currentNotifications = notifications.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(notifications.length / perPage);

    useEffect(() => {
        audioRef.current = new Audio("/warning.wav");
    }, []);

    useEffect(() => {
        fetchNotifications();

        // 🔔 REALTIME ADD
        socket.on("notification", (data) => {
            setNotifications((prev) => [data, ...prev]);

            const senderId =
                typeof data.sender === "object"
                    ? data.sender?._id
                    : data.sender;

            if (senderId !== userId) {
                audioRef.current?.play().catch(() => { });
            }
        });

        // 🗑 REALTIME DELETE
        socket.on("notificationDeleted", (id) => {
            setNotifications((prev) =>
                prev.filter((n) => n._id !== id)
            );
        });

        return () => {
            socket.off("notification");
            socket.off("notificationDeleted");
        };
    }, []);

    // 🔄 FETCH
    const fetchNotifications = async () => {
        try {
            let res;

            if (role === "admin") {
                res = await API.get("/admin/notifications"); // ✅ ensure backend returns ALL
            } else {
                res = await API.get(
                    `/messages/notifications/${departmentId}`
                );
            }

            setNotifications(res.data || []);
            setCurrentPage(1);
        } catch {
            setNotifications([]);
        }
    };

    // 🗑 DELETE
    const deleteNotification = async (id) => {
        if (!window.confirm("Delete this notification?")) return;

        try {
            await API.delete(`/admin/notification/${id}`);
        } catch {
            alert("Error deleting notification");
        }
    };






    // ✅ MARK AS READ (NEW)
    const markAsRead = async (id) => {
        try {
            await API.put(`/admin/notification/read/${id}`);

            // update UI instantly
            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === id
                        ? { ...n, readBy: [...(n.readBy || []), userId] }
                        : n
                )
            );
        } catch {
            console.error("Failed to mark as read");
        }
    };


    //Notifications Fixed
    const sendNotification = async () => {
        if (!notificationMsg.trim()) {
            alert("Enter notification message");
            return;
        }

        let fileUrl = "";

        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const uploadRes = await API.post("/upload", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                });

                fileUrl = uploadRes.data.fileUrl;
            } catch (err) {
                alert("File upload failed");
                return;
            }
        }

        socket.emit("sendNotification", {
            message: notificationMsg,
            sender: userId,
            departmentId,
            fileUrl
        });

        alert("Notification sent");

        setNotificationMsg("");
        setFile(null);
    };



    return (
        <div style={{ padding: "20px" }}>
            <h2>🔔 Notifications</h2>
            {role === "manager" && (
                <div
                    style={{
                        background: "#f5f5f5",
                        padding: "15px",
                        borderRadius: "8px",
                        marginBottom: "20px"
                    }}
                >
                    <h3>Send Notification</h3>

                    <textarea
                        value={notificationMsg}
                        onChange={(e) => setNotificationMsg(e.target.value)}
                        placeholder="Enter notification..."
                        style={{
                            width: "100%",
                            height: "80px"
                        }}
                    />

                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{ marginTop: "10px" }}
                    />

                    <button
                        onClick={sendNotification}
                        style={{ marginTop: "10px" }}
                    >
                        Send Notification
                    </button>

                    <p
                        style={{
                            fontSize: "12px",
                            color: "gray",
                            marginTop: "5px"
                        }}
                    >
                        Notification will be sent only to your department.
                    </p>
                </div>
            )}

            {notifications.length === 0 && <p>No notifications</p>}

            {currentNotifications.map((n) => {

                // ✅ CHECK READ STATUS
                const isRead = n.readBy?.includes(userId);

                return (
                    <div
                        key={n._id}
                        onClick={() => markAsRead(n._id)} // ✅ CLICK TO READ
                        style={{
                            background: isRead ? "#f5f5f5" : "#e3f2fd", // 🔥 highlight unread
                            padding: "15px",
                            marginBottom: "10px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            borderLeft: isRead ? "none" : "4px solid #2196f3"
                        }}
                    >
                        <strong>🔔 {n.message}</strong>

                        {/* 📎 FILE */}
                        {n.fileUrl && (
                            <div style={{ marginTop: "5px" }}>
                                <a href={n.fileUrl} target="_blank" rel="noreferrer">
                                    📎 Download Attachment
                                </a>
                            </div>
                        )}

                        {/* 🧑 SENDER */}
                        <div style={{ fontSize: "12px", color: "gray" }}>
                            By: {n.sender?.fullName || "Admin"}
                        </div>

                        {/* 🕒 TIME */}
                        <div style={{ fontSize: "12px", color: "gray" }}>
                            {n.createdAt
                                ? new Date(n.createdAt).toLocaleString()
                                : "Time not available"}
                        </div>

                        <div style={{ fontSize: "11px", marginTop: "5px" }}>
                            {isRead ? "✔ Read" : "● Unread"}
                        </div>

                        {/* ✅ READ STATUS */}
                        {/* <div style={{ fontSize: "11px", marginTop: "5px", color: isRead ? "green" : "red" }}>
                            {isRead ? "✔ Read" : "● Unread"}
                        </div> */}

                        {/* 🗑 ADMIN DELETE */}
                        {role === "admin" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(n._id);
                                }}
                            >
                                Delete
                            </button>
                        )}
                    </div>
                );
            })}
            {/* PAGINATION */}
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                    ⬅ Prev
                </button>

                <span>
                    Page {currentPage} of {totalPages || 1}
                </span>

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                    Next ➡
                </button>
            </div>
        </div>
    );
};

export default Notifications;