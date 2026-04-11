import { useEffect, useState, useRef } from "react";
import socket from "../services/socket";
import API from "../services/api";
import MessageInput from "./MessageInput";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [menu, setMenu] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [unread, setUnread] = useState({});

  const [notifications, setNotifications] = useState([]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [managerMsg, setManagerMsg] = useState("");
  const [managerFile, setManagerFile] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);


  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const userDept = localStorage.getItem("department");

  const user = {
    _id: userId,
    role,
    department: userDept
  };

  const departmentId = role === "admin" ? selectedDept : userDept;

  const bottomRef = useRef(null);
  const messageRefs = useRef({});
  const notificationSoundRef = useRef(null);
  const messageSoundRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    notificationSoundRef.current = new Audio("/warning.wav");
    messageSoundRef.current = new Audio("/notification.wav");
  }, []);

  // Download handler that preserves original filename
  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const link = document.createElement("a");
      const objectUrl = window.URL.createObjectURL(blob);

      link.href = objectUrl;
      const downloadName = fileName || url.split('/').pop().split('?')[0] || 'download';
      link.download = downloadName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download file. Please try again.");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menu && !e.target.closest('.context-menu')) {
        setMenu(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [menu]);

  useEffect(() => {
    if (role === "admin") {

      API.get("/admin/departments")
        .then((res) => {
          const data = res.data || [];
          setDepartments(data);
          if (data.length > 0 && !selectedDept) {
            setSelectedDept(data[0]._id);
          }
        })
        .catch(() => setDepartments([]));
    }
  }, []);

  useEffect(() => {
    if (!departmentId) return;

    setMessages([]);
    socket.emit("userOnline", userId);

    if (role === "admin") {
      socket.emit("joinAllDepartments");
      socket.emit("joinDepartment", { departmentId, user });
    } else {
      socket.emit("joinDepartment", { departmentId, user });
    }

    fetchMessages();

    socket.on("receiveMessage", (msg) => {
      if (role === "admin") {
        if (msg.department === departmentId) {
          setMessages((prev) => [...prev, msg]);
        } else {
          setUnread((prev) => ({
            ...prev,
            [msg.department]: (prev[msg.department] || 0) + 1
          }));
        }
      } else {
        setMessages((prev) => [...prev, msg]);
      }

      if (msg.sender?._id?.toString() !== userId?.toString()) {
        messageSoundRef.current?.play().catch(() => { });
      }
    });

    socket.on("messageDeleted", (id) => {
      setMessages((prev) =>
        prev.filter((m) => m._id.toString() !== id.toString())
      );
    });

    socket.on("messageEdited", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === updatedMsg._id ? updatedMsg : m
        )
      );
    });

    socket.on("typing", (name) => {
      setTypingUser(name);
      setTimeout(() => setTypingUser(""), 1500);
    });

    socket.on("notification", (msg) => {
      setNotifications((prev) => [
        { id: Date.now(), message: msg, read: false },
        ...prev
      ]);

      notificationSoundRef.current?.play().catch(() => { });
    });


    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("messageDeleted");
      socket.off("messageEdited");
      socket.off("notification");
    };
  }, [departmentId]);

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/messages/${departmentId}`);
      setMessages(res.data || []);
    } catch {
      console.error("Error fetching messages");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages.filter((m) =>
      m.text?.toLowerCase().includes(searchText.toLowerCase())
    );

    setSearchResults(results);
    setCurrentIndex(0);
  }, [searchText, messages]);



  useEffect(() => {
    if (searchResults.length > 0) {
      scrollToMessage(searchResults[0]._id);
    }
  }, [searchResults]);



  const scrollToMessage = (msgId) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      el.style.transition = "background 0.5s";
      el.style.background = "#ffe58f";

      setTimeout(() => {
        el.style.background = "";
      }, 1500);
    }
  };


  const goToNext = () => {
    if (searchResults.length === 0) return;

    const nextIndex = (currentIndex + 1) % searchResults.length;
    setCurrentIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex]._id);
  };

  const goToPrev = () => {
    if (searchResults.length === 0) return;

    const prevIndex =
      (currentIndex - 1 + searchResults.length) % searchResults.length;

    setCurrentIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex]._id);
  };



  const editMessage = (msg) => {
    setEditingId(msg._id);
    setEditText(msg.text);
    setMenu(null);
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;

    try {
      await API.put(`/messages/edit/${editingId}`, {
        text: editText
      });
      setEditingId(null);
      setEditText("");
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const deleteMessage = async (msg) => {
    try {
      await API.delete(`/messages/delete/${msg._id}`);
      setMenu(null);
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };


  const replyMessage = (msg) => {
    setReplyTo({
      _id: msg._id,
      text: msg.text,
      sender: msg.sender?.fullName
    });
    setMenu(null);
  };

  // Context menu positioning near mouse pointer
  const handleRightClick = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();

    let x = e.clientX;
    let y = e.clientY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const menuWidth = 180;
    const menuHeight = 80;

    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }

    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    x = Math.max(10, x);
    y = Math.max(10, y);

    setMenu({ x, y, msg });
  };

  const getFileIcon = (url = "") => {
    if (url.match(/\.(jpg|jpeg|png|gif)$/i)) return "🖼️";
    if (url.match(/\.pdf$/i)) return "📄";
    if (url.match(/\.(doc|docx)$/i)) return "📘";
    if (url.match(/\.(xls|xlsx)$/i)) return "📊";
    return "📎";
  };

  // Styles - IMPROVED BACKGROUND IMAGE QUALITY
  const styles = {
    container: {
      // FIXED: Better background image rendering
      backgroundImage: "url('/bg.jpeg?t=" + Date.now() + "')", // Add cache buster
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      // backgroundAttachment: "fixed",
      // Removed any filters that could affect quality
      imageRendering: "auto",
      WebkitFontSmoothing: "antialiased",
      width: "100%",
      flex: 1,
      minWidth: 0,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflow: "hidden"
    },
    adminBar: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      padding: "12px 20px",
      borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      flexShrink: 0
    },
    deptSelect: {
      width: "100%",
      maxWidth: "300px",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "14px",
      cursor: "pointer",
      background: "white"
    },
    messagesArea: {
      display: "flex",
      flexDirection: "column",
      padding: "20px",
      overflowY: "auto",
      flex: 1,
      gap: "12px",
      minHeight: 0
    },
    messageWrapper: (isMe) => ({
      display: "flex",
      justifyContent: isMe ? "flex-end" : "flex-start",
      animation: "fadeIn 0.3s ease"
    }),
    messageBubble: (isMe) => ({
      maxWidth: "70%",
      minWidth: "120px",
      padding: "12px 16px",
      borderRadius: "18px",
      background: isMe ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "white",
      color: isMe ? "white" : "#333",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      position: "relative",
      cursor: "context-menu"
    }),
    senderName: {
      fontSize: "12px",
      fontWeight: "bold",
      marginBottom: "4px",
      opacity: 0.9
    },
    messageText: {
      fontSize: "14px",
      lineHeight: "1.4",
      wordWrap: "break-word",
      marginTop: "4px"
    },
    editContainer: {
      marginTop: "4px"
    },
    editInput: {
      width: "100%",
      padding: "8px",
      borderRadius: "8px",
      border: "2px solid #667eea",
      fontSize: "14px",
      fontFamily: "inherit",
      marginBottom: "8px"
    },
    editButtons: {
      display: "flex",
      gap: "8px"
    },
    saveBtn: {
      padding: "4px 12px",
      borderRadius: "6px",
      border: "none",
      background: "#4caf50",
      color: "white",
      cursor: "pointer",
      fontSize: "12px"
    },
    cancelBtn: {
      padding: "4px 12px",
      borderRadius: "6px",
      border: "none",
      background: "#f44336",
      color: "white",
      cursor: "pointer",
      fontSize: "12px"
    },
    fileBtn: (isMe) => ({
      background: isMe ? "rgba(255, 255, 255, 0.2)" : "#f0f0f0",
      border: "none",
      padding: "6px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      marginTop: "6px",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      transition: "all 0.2s",
      color: isMe ? "white" : "#333"
    }),
    timeStamp: {
      fontSize: "10px",
      opacity: 0.7,
      marginTop: "6px",
      display: "block"
    },
    typingIndicator: {
      padding: "8px 16px",
      background: "rgba(255, 255, 255, 0.9)",
      borderRadius: "20px",
      width: "fit-content",
      fontSize: "12px",
      color: "#666",
      animation: "pulse 1.5s infinite"
    },
    contextMenu: {
      position: "fixed",
      background: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      padding: "8px 0",
      minWidth: "160px",
      zIndex: 10000,
      animation: "menuFadeIn 0.2s ease"
    },
    contextItem: {
      padding: "10px 16px",
      cursor: "pointer",
      transition: "background 0.2s",
      fontSize: "14px",
      color: "#333"
    },
    contextItemDelete: {
      padding: "10px 16px",
      cursor: "pointer",
      transition: "background 0.2s",
      fontSize: "14px",
      color: "#f44336"
    }
  };

  return (
    <div style={styles.container} ref={chatContainerRef}>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
          
          @keyframes menuFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .messages-area::-webkit-scrollbar {
            width: 6px;
          }
          
          .messages-area::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }
          
          .messages-area::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
          }
          
          .messages-area::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.5);
          }
          
          /* Ensure background image renders at full quality */
          body {
            margin: 0;
            padding: 0;
          }
        `}
      </style>

      {/* Admin Department Selector */}
      {role === "admin" && (
        <div style={styles.adminBar}>
          <select
            style={styles.deptSelect}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                📋 {dept.name} {unread[dept._id] ? `(${unread[dept._id]} new)` : ""}
              </option>
            ))}
          </select>
        </div>
      )}



      {/* Search Bar */}
      <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.9)" }}>
        {!showSearch ? (
          <button onClick={() => setShowSearch(true)}>🔍 Search</button>
        ) : (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ padding: "6px", flex: 1 }}
            />

            <button onClick={goToPrev}>⬆</button>
            <button onClick={goToNext}>⬇</button>

            <span style={{ fontSize: "12px" }}>
              {searchResults.length > 0
                ? `${currentIndex + 1}/${searchResults.length}`
                : "0 results"}
            </span>

            <button
              onClick={() => {
                setShowSearch(false);
                setSearchText("");
                setSearchResults([]);
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="messages-area" style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>💬</div>
            <p style={{ fontSize: "16px", marginBottom: "8px", color: "#666" }}>No messages yet</p>
            <small style={{ fontSize: "12px", color: "#999" }}>Be the first to start the conversation!</small>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id?.toString() === userId?.toString();

            return (
              <div
                key={msg._id}
                ref={(el) => (messageRefs.current[msg._id] = el)}
                onContextMenu={(e) => handleRightClick(e, msg)}
                style={styles.messageWrapper(isMe)}
              >
                <div style={styles.messageBubble(isMe)}>
                  <div style={styles.senderName}>
                    {msg.sender?.fullName}
                  </div>


                  {msg.replyTo && (
                    <div
                      onClick={() => {
                        const el = messageRefs.current[msg.replyTo._id];
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.style.transition = "background 0.5s";
                          el.style.background = "#fff3cd";
                          setTimeout(() => {
                            el.style.background = "";
                          }, 1500);
                        }
                      }}
                      style={{
                        borderLeft: "3px solid #667eea",
                        paddingLeft: "8px",
                        marginBottom: "6px",
                        fontSize: "12px",
                        opacity: 0.8,
                        cursor: "pointer"
                      }}
                    >
                      <strong>{msg.replyTo.sender}</strong>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {msg.replyTo.text}
                      </div>
                    </div>
                  )}

                  {editingId === msg._id ? (
                    <div style={styles.editContainer}>
                      <input
                        style={styles.editInput}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                      />
                      <div style={styles.editButtons}>
                        <button style={styles.saveBtn} onClick={saveEdit}>✓ Save</button>
                        <button style={styles.cancelBtn} onClick={cancelEdit}>✗ Cancel</button>
                      </div>
                    </div>
                  ) : (
                    msg.text && <div style={styles.messageText}>{msg.text}</div>
                  )}

                  {msg.fileUrl && (
                    <button
                      style={styles.fileBtn(isMe)}
                      onClick={() => handleDownload(msg.fileUrl, msg.fileName)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {getFileIcon(msg.fileUrl)} {msg.fileName || "Download File"}
                    </button>
                  )}

                  <small style={styles.timeStamp}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />

        {typingUser && (
          <div style={styles.typingIndicator}>
            <span>✍️ {typingUser} is typing...</span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {menu && (
        <div
          className="context-menu"
          style={{
            ...styles.contextMenu,
            top: `${menu.y}px`,
            left: `${menu.x}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={styles.contextItem}
            onClick={() => replyMessage(menu.msg)}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
          >
            ↩️ Reply
          </div>
          {menu.msg.sender?._id === userId && (
            <div
              style={styles.contextItem}
              onClick={() => editMessage(menu.msg)}

              onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              ✏️ Edit Message
            </div>
          )}

          {(role === "admin" || menu.msg.sender?._id === userId) && (
            <div
              style={styles.contextItemDelete}
              onClick={() => deleteMessage(menu.msg)}
              onMouseEnter={(e) => e.currentTarget.style.background = "#ffebee"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              🗑 Delete Message
            </div>
          )}
        </div>
      )}

      {departmentId && (
        <MessageInput
          departmentId={departmentId}
          replyTo={replyTo}
          clearReply={() => setReplyTo(null)}
        />
      )}
    </div>
  );
};

export default Chat;







// import { useEffect, useState, useRef } from "react";
// import socket from "../services/socket";
// import API from "../services/api";
// import MessageInput from "./MessageInput";

// const Chat = () => {
//   const [messages, setMessages] = useState([]);
//   const [typingUser, setTypingUser] = useState("");
//   const [menu, setMenu] = useState(null);
//   const [departments, setDepartments] = useState([]);
//   const [selectedDept, setSelectedDept] = useState("");
//   const [unread, setUnread] = useState({});

//   const [notifications, setNotifications] = useState([]);

//   const [showNotifications, setShowNotifications] = useState(false);
//   const [managerMsg, setManagerMsg] = useState("");
//   const [managerFile, setManagerFile] = useState(null);
//   const [searchText, setSearchText] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [showSearch, setShowSearch] = useState(false);


//   const [editingId, setEditingId] = useState(null);
//   const [editText, setEditText] = useState("");
//   const [replyTo, setReplyTo] = useState(null);

//   const role = localStorage.getItem("role");
//   const userId = localStorage.getItem("userId");
//   const userDept = localStorage.getItem("department");

//   const user = {
//     _id: userId,
//     role,
//     department: userDept
//   };

//   const departmentId = role === "admin" ? selectedDept : userDept;

//   const bottomRef = useRef(null);
//   const messageRefs = useRef({});
//   const notificationSoundRef = useRef(null);
//   const messageSoundRef = useRef(null);
//   const chatContainerRef = useRef(null);

//   useEffect(() => {
//     notificationSoundRef.current = new Audio("/warning.wav");
//     messageSoundRef.current = new Audio("/notification.wav");
//   }, []);

//   // Download handler that preserves original filename
//   const handleDownload = async (url, fileName) => {
//     try {
//       const response = await fetch(url);
//       const blob = await response.blob();

//       const link = document.createElement("a");
//       const objectUrl = window.URL.createObjectURL(blob);

//       link.href = objectUrl;
//       const downloadName = fileName || url.split('/').pop().split('?')[0] || 'download';
//       link.download = downloadName;

//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       window.URL.revokeObjectURL(objectUrl);
//     } catch (err) {
//       console.error("Download failed", err);
//       alert("Failed to download file. Please try again.");
//     }
//   };



  



//   // Close menu when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (menu && !e.target.closest('.context-menu')) {
//         setMenu(null);
//       }
//     };
//     window.addEventListener("click", handleClickOutside);
//     return () => window.removeEventListener("click", handleClickOutside);
//   }, [menu]);

//   useEffect(() => {
//     if (role === "admin") {

//       API.get("/admin/departments")
//         .then((res) => {
//           const data = res.data || [];
//           setDepartments(data);
//           if (data.length > 0 && !selectedDept) {
//             setSelectedDept(data[0]._id);
//           }
//         })
//         .catch(() => setDepartments([]));
//     }
//   }, []);

//   useEffect(() => {
//     if (!departmentId) return;

//     setMessages([]);
//     socket.emit("userOnline", userId);

//     if (role === "admin") {
//       socket.emit("joinAllDepartments");
//       socket.emit("joinDepartment", { departmentId, user });
//     } else {
//       socket.emit("joinDepartment", { departmentId, user });
//     }

//     fetchMessages();

//     socket.on("receiveMessage", (msg) => {
//       if (role === "admin") {
//         if (msg.department === departmentId) {
//           setMessages((prev) => [...prev, msg]);
//         } else {
//           setUnread((prev) => ({
//             ...prev,
//             [msg.department]: (prev[msg.department] || 0) + 1
//           }));
//         }
//       } else {
//         setMessages((prev) => [...prev, msg]);
//       }

//       if (msg.sender?._id?.toString() !== userId?.toString()) {
//         messageSoundRef.current?.play().catch(() => { });
//       }
//     });

//     socket.on("messageDeleted", (id) => {
//       setMessages((prev) =>
//         prev.filter((m) => m._id.toString() !== id.toString())
//       );
//     });

//     socket.on("messageEdited", (updatedMsg) => {
//       setMessages((prev) =>
//         prev.map((m) =>
//           m._id === updatedMsg._id ? updatedMsg : m
//         )
//       );
//     });

//     socket.on("typing", (name) => {
//       setTypingUser(name);
//       setTimeout(() => setTypingUser(""), 1500);
//     });

//     socket.on("notification", (msg) => {
//       setNotifications((prev) => [
//         { id: Date.now(), message: msg, read: false },
//         ...prev
//       ]);

//       notificationSoundRef.current?.play().catch(() => { });
//     });


//     return () => {
//       socket.off("receiveMessage");
//       socket.off("typing");
//       socket.off("messageDeleted");
//       socket.off("messageEdited");
//       socket.off("notification");
//     };
//   }, [departmentId]);

//   const fetchMessages = async () => {
//     try {
//       const res = await API.get(`/messages/${departmentId}`);
//       setMessages(res.data || []);
//     } catch {
//       console.error("Error fetching messages");
//     }
//   };

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);


//   useEffect(() => {
//     if (!searchText.trim()) {
//       setSearchResults([]);
//       return;
//     }

//     const results = messages.filter((m) =>
//       m.text?.toLowerCase().includes(searchText.toLowerCase())
//     );

//     setSearchResults(results);
//     setCurrentIndex(0);
//   }, [searchText, messages]);



//   useEffect(() => {
//     if (searchResults.length > 0) {
//       scrollToMessage(searchResults[0]._id);
//     }
//   }, [searchResults]);



//   const scrollToMessage = (msgId) => {
//     const el = messageRefs.current[msgId];
//     if (el) {
//       el.scrollIntoView({ behavior: "smooth", block: "center" });

//       el.style.transition = "background 0.5s";
//       el.style.background = "#ffe58f";

//       setTimeout(() => {
//         el.style.background = "";
//       }, 1500);
//     }
//   };


//   const goToNext = () => {
//     if (searchResults.length === 0) return;

//     const nextIndex = (currentIndex + 1) % searchResults.length;
//     setCurrentIndex(nextIndex);
//     scrollToMessage(searchResults[nextIndex]._id);
//   };

//   const goToPrev = () => {
//     if (searchResults.length === 0) return;

//     const prevIndex =
//       (currentIndex - 1 + searchResults.length) % searchResults.length;

//     setCurrentIndex(prevIndex);
//     scrollToMessage(searchResults[prevIndex]._id);
//   };



//   const editMessage = (msg) => {
//     setEditingId(msg._id);
//     setEditText(msg.text);
//     setMenu(null);
//   };

//   const saveEdit = async () => {
//     if (!editText.trim()) return;

//     try {
//       await API.put(`/messages/edit/${editingId}`, {
//         text: editText
//       });
//       setEditingId(null);
//       setEditText("");
//     } catch (err) {
//       alert(err.response?.data?.message);
//     }
//   };

//   const cancelEdit = () => {
//     setEditingId(null);
//     setEditText("");
//   };

//   const deleteMessage = async (msg) => {
//     try {
//       await API.delete(`/messages/delete/${msg._id}`);
//       setMenu(null);
//     } catch (err) {
//       alert(err.response?.data?.message);
//     }
//   };


//   const replyMessage = (msg) => {
//     setReplyTo({
//       _id: msg._id,
//       text: msg.text,
//       sender: msg.sender?.fullName
//     });
//     setMenu(null);
//   };

//   // Context menu positioning near mouse pointer
//   const handleRightClick = (e, msg) => {
//     e.preventDefault();
//     e.stopPropagation();

//     let x = e.clientX;
//     let y = e.clientY;

//     const viewportWidth = window.innerWidth;
//     const viewportHeight = window.innerHeight;

//     const menuWidth = 180;
//     const menuHeight = 80;

//     if (x + menuWidth > viewportWidth) {
//       x = viewportWidth - menuWidth - 10;
//     }

//     if (y + menuHeight > viewportHeight) {
//       y = viewportHeight - menuHeight - 10;
//     }

//     x = Math.max(10, x);
//     y = Math.max(10, y);

//     setMenu({ x, y, msg });
//   };

//   const getFileIcon = (url = "") => {
//     if (url.match(/\.(jpg|jpeg|png|gif)$/i)) return "🖼️";
//     if (url.match(/\.pdf$/i)) return "📄";
//     if (url.match(/\.(doc|docx)$/i)) return "📘";
//     if (url.match(/\.(xls|xlsx)$/i)) return "📊";
//     return "📎";
//   };

//   // Styles - FIXED: Removed position fixed and width 100vw to not interfere with sidebar
//   const styles = {
//     container: {
//       backgroundImage: "url('/bg.jpeg')",
//       backgroundSize: "cover",
//       backgroundPosition: "center",
//       backgroundRepeat: "no-repeat",
//       backgroundAttachment: "fixed",

//       width: "100%",
//       flex: 1,
//       minWidth: 0,

//       height: "100vh",
//       display: "flex",
//       flexDirection: "column",
//       fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
//       overflow: "hidden"
//     },
//     adminBar: {
//       background: "rgba(255, 255, 255, 0.95)",
//       backdropFilter: "blur(10px)",
//       padding: "12px 20px",
//       borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
//       boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
//       flexShrink: 0
//     },
//     deptSelect: {
//       width: "100%",
//       maxWidth: "300px",
//       padding: "8px 12px",
//       borderRadius: "8px",
//       border: "1px solid #ddd",
//       fontSize: "14px",
//       cursor: "pointer",
//       background: "white"
//     },
//     messagesArea: {
//       display: "flex",
//       flexDirection: "column",
//       padding: "20px",
//       overflowY: "auto",
//       flex: 1,
//       gap: "12px",
//       minHeight: 0
//     },
//     messageWrapper: (isMe) => ({
//       display: "flex",
//       justifyContent: isMe ? "flex-end" : "flex-start",
//       animation: "fadeIn 0.3s ease"
//     }),
//     messageBubble: (isMe) => ({
//       maxWidth: "70%",
//       minWidth: "120px",
//       padding: "12px 16px",
//       borderRadius: "18px",
//       background: isMe ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "white",
//       color: isMe ? "white" : "#333",
//       boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
//       position: "relative",
//       cursor: "context-menu"
//     }),
//     senderName: {
//       fontSize: "12px",
//       fontWeight: "bold",
//       marginBottom: "4px",
//       opacity: 0.9
//     },
//     messageText: {
//       fontSize: "14px",
//       lineHeight: "1.4",
//       wordWrap: "break-word",
//       marginTop: "4px"
//     },
//     editContainer: {
//       marginTop: "4px"
//     },
//     editInput: {
//       width: "100%",
//       padding: "8px",
//       borderRadius: "8px",
//       border: "2px solid #667eea",
//       fontSize: "14px",
//       fontFamily: "inherit",
//       marginBottom: "8px"
//     },
//     editButtons: {
//       display: "flex",
//       gap: "8px"
//     },
//     saveBtn: {
//       padding: "4px 12px",
//       borderRadius: "6px",
//       border: "none",
//       background: "#4caf50",
//       color: "white",
//       cursor: "pointer",
//       fontSize: "12px"
//     },
//     cancelBtn: {
//       padding: "4px 12px",
//       borderRadius: "6px",
//       border: "none",
//       background: "#f44336",
//       color: "white",
//       cursor: "pointer",
//       fontSize: "12px"
//     },
//     fileBtn: (isMe) => ({
//       background: isMe ? "rgba(255, 255, 255, 0.2)" : "#f0f0f0",
//       border: "none",
//       padding: "6px 12px",
//       borderRadius: "8px",
//       cursor: "pointer",
//       fontSize: "12px",
//       marginTop: "6px",
//       display: "inline-flex",
//       alignItems: "center",
//       gap: "6px",
//       transition: "all 0.2s",
//       color: isMe ? "white" : "#333"
//     }),
//     timeStamp: {
//       fontSize: "10px",
//       opacity: 0.7,
//       marginTop: "6px",
//       display: "block"
//     },
//     typingIndicator: {
//       padding: "8px 16px",
//       background: "rgba(255, 255, 255, 0.9)",
//       borderRadius: "20px",
//       width: "fit-content",
//       fontSize: "12px",
//       color: "#666",
//       animation: "pulse 1.5s infinite"
//     },
//     contextMenu: {
//       position: "fixed",
//       background: "white",
//       borderRadius: "8px",
//       boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
//       padding: "8px 0",
//       minWidth: "160px",
//       zIndex: 10000,
//       animation: "menuFadeIn 0.2s ease"
//     },
//     contextItem: {
//       padding: "10px 16px",
//       cursor: "pointer",
//       transition: "background 0.2s",
//       fontSize: "14px",
//       color: "#333"
//     },
//     contextItemDelete: {
//       padding: "10px 16px",
//       cursor: "pointer",
//       transition: "background 0.2s",
//       fontSize: "14px",
//       color: "#f44336"
//     }
//   };

//   return (
//     <div style={styles.container} ref={chatContainerRef}>
//       <style>
//         {`
//           @keyframes fadeIn {
//             from {
//               opacity: 0;
//               transform: translateY(10px);
//             }
//             to {
//               opacity: 1;
//               transform: translateY(0);
//             }
//           }
          
//           @keyframes pulse {
//             0%, 100% {
//               opacity: 0.6;
//             }
//             50% {
//               opacity: 1;
//             }
//           }
          
//           @keyframes menuFadeIn {
//             from {
//               opacity: 0;
//               transform: scale(0.95);
//             }
//             to {
//               opacity: 1;
//               transform: scale(1);
//             }
//           }
          
//           .messages-area::-webkit-scrollbar {
//             width: 6px;
//           }
          
//           .messages-area::-webkit-scrollbar-track {
//             background: rgba(0, 0, 0, 0.1);
//             border-radius: 10px;
//           }
          
//           .messages-area::-webkit-scrollbar-thumb {
//             background: rgba(0, 0, 0, 0.3);
//             border-radius: 10px;
//           }
          
//           .messages-area::-webkit-scrollbar-thumb:hover {
//             background: rgba(0, 0, 0, 0.5);
//           }
//         `}
//       </style>

//       {/* Admin Department Selector */}
//       {role === "admin" && (
//         <div style={styles.adminBar}>
//           <select
//             style={styles.deptSelect}
//             value={selectedDept}
//             onChange={(e) => setSelectedDept(e.target.value)}
//           >
//             {departments.map((dept) => (
//               <option key={dept._id} value={dept._id}>
//                 📋 {dept.name} {unread[dept._id] ? `(${unread[dept._id]} new)` : ""}
//               </option>
//             ))}
//           </select>
//         </div>
//       )}



//       {/* Search Bar */}
//       <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.9)" }}>
//         {!showSearch ? (
//           <button onClick={() => setShowSearch(true)}>🔍 Search</button>
//         ) : (
//           <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//             <input
//               type="text"
//               placeholder="Search messages..."
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               style={{ padding: "6px", flex: 1 }}
//             />

//             <button onClick={goToPrev}>⬆</button>
//             <button onClick={goToNext}>⬇</button>

//             <span style={{ fontSize: "12px" }}>
//               {searchResults.length > 0
//                 ? `${currentIndex + 1}/${searchResults.length}`
//                 : "0 results"}
//             </span>

//             <button
//               onClick={() => {
//                 setShowSearch(false);
//                 setSearchText("");
//                 setSearchResults([]);
//               }}
//             >
//               ✕
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Messages Area */}
//       <div className="messages-area" style={styles.messagesArea}>
//         {messages.length === 0 ? (
//           <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
//             <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>💬</div>
//             <p style={{ fontSize: "16px", marginBottom: "8px", color: "#666" }}>No messages yet</p>
//             <small style={{ fontSize: "12px", color: "#999" }}>Be the first to start the conversation!</small>
//           </div>
//         ) : (
//           messages.map((msg) => {
//             const isMe = msg.sender?._id?.toString() === userId?.toString();

//             return (
//               <div
//                 key={msg._id}
//                 ref={(el) => (messageRefs.current[msg._id] = el)}
//                 onContextMenu={(e) => handleRightClick(e, msg)}
//                 style={styles.messageWrapper(isMe)}
//               >
//                 <div style={styles.messageBubble(isMe)}>
//                   <div style={styles.senderName}>
//                     {msg.sender?.fullName}
//                   </div>


//                   {msg.replyTo && (
//                     <div
//                       onClick={() => {
//                         const el = messageRefs.current[msg.replyTo._id];
//                         if (el) {
//                           el.scrollIntoView({ behavior: "smooth", block: "center" });
//                           el.style.transition = "background 0.5s";
//                           el.style.background = "#fff3cd";
//                           setTimeout(() => {
//                             el.style.background = "";
//                           }, 1500);
//                         }
//                       }}
//                       style={{
//                         borderLeft: "3px solid #667eea",
//                         paddingLeft: "8px",
//                         marginBottom: "6px",
//                         fontSize: "12px",
//                         opacity: 0.8,
//                         cursor: "pointer"
//                       }}
//                     >
//                       <strong>{msg.replyTo.sender}</strong>
//                       <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//                         {msg.replyTo.text}
//                       </div>
//                     </div>
//                   )}

//                   {editingId === msg._id ? (
//                     <div style={styles.editContainer}>
//                       <input
//                         style={styles.editInput}
//                         value={editText}
//                         onChange={(e) => setEditText(e.target.value)}
//                         onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
//                         autoFocus
//                       />
//                       <div style={styles.editButtons}>
//                         <button style={styles.saveBtn} onClick={saveEdit}>✓ Save</button>
//                         <button style={styles.cancelBtn} onClick={cancelEdit}>✗ Cancel</button>
//                       </div>
//                     </div>
//                   ) : (
//                     msg.text && <div style={styles.messageText}>{msg.text}</div>
//                   )}

//                   {msg.fileUrl && (
//                     <button
//                       style={styles.fileBtn(isMe)}
//                       onClick={() => handleDownload(msg.fileUrl, msg.fileName)}
//                       onMouseEnter={(e) => {
//                         e.currentTarget.style.transform = "scale(1.05)";
//                       }}
//                       onMouseLeave={(e) => {
//                         e.currentTarget.style.transform = "scale(1)";
//                       }}
//                     >
//                       {getFileIcon(msg.fileUrl)} {msg.fileName || "Download File"}
//                     </button>
//                   )}

//                   <small style={styles.timeStamp}>
//                     {new Date(msg.createdAt).toLocaleString()}
//                   </small>
//                 </div>
//               </div>
//             );
//           })
//         )}

//         <div ref={bottomRef} />

//         {typingUser && (
//           <div style={styles.typingIndicator}>
//             <span>✍️ {typingUser} is typing...</span>
//           </div>
//         )}
//       </div>

//       {/* Context Menu */}
//       {menu && (
//         <div
//           className="context-menu"
//           style={{
//             ...styles.contextMenu,
//             top: `${menu.y}px`,
//             left: `${menu.x}px`
//           }}
//           onClick={(e) => e.stopPropagation()}
//         >
//           <div
//             style={styles.contextItem}
//             onClick={() => replyMessage(menu.msg)}
//             onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
//             onMouseLeave={(e) => e.currentTarget.style.background = "white"}
//           >
//             ↩️ Reply
//           </div>
//           {menu.msg.sender?._id === userId && (
//             <div
//               style={styles.contextItem}
//               onClick={() => editMessage(menu.msg)}

//               onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
//               onMouseLeave={(e) => e.currentTarget.style.background = "white"}
//             >
//               ✏️ Edit Message
//             </div>
//           )}

//           {(role === "admin" || menu.msg.sender?._id === userId) && (
//             <div
//               style={styles.contextItemDelete}
//               onClick={() => deleteMessage(menu.msg)}
//               onMouseEnter={(e) => e.currentTarget.style.background = "#ffebee"}
//               onMouseLeave={(e) => e.currentTarget.style.background = "white"}
//             >
//               🗑 Delete Message
//             </div>
//           )}
//         </div>
//       )}

//       {departmentId && (
//         <MessageInput
//           departmentId={departmentId}
//           replyTo={replyTo}
//           clearReply={() => setReplyTo(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default Chat;












