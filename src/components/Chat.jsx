


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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);


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
  const messagesAreaRef = useRef(null);

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

  // Function to convert text with URLs to clickable links
  const convertToClickableLinks = (text) => {
    if (!text) return text;

    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#667eea",
              textDecoration: "underline",
              cursor: "pointer",
              wordBreak: "break-all"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
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
    const container = messagesAreaRef.current;

    if (!container) {
      console.log("❌ messagesAreaRef not found");
      return;
    }

    console.log("✅ Scroll attached");

    const handleScroll = () => {
      console.log("SCROLL DETECTED", container.scrollTop);

      if (container.scrollTop <= 50 && hasMore) {
        console.log("🚀 Loading page:", page + 1);

        const nextPage = page + 1;
        setPage(nextPage);
        fetchMessages(nextPage);
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [page, hasMore]);




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

    setPage(1);
    fetchMessages(1);

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

  const fetchMessages = async (pageNum = 1) => {
    try {
      const res = await API.get(
        `/messages/${departmentId}?page=${pageNum}&limit=20`
      );

      if (pageNum === 1) {
        setMessages(res.data.messages);
      } else {
        setMessages((prev) => [
          ...res.data.messages,
          ...prev
        ]);
      }

      setHasMore(res.data.hasMore);

    } catch {
      console.error("Error fetching messages");
    }
  };

  useEffect(() => {
    if (!showSearch) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showSearch]);


  useEffect(() => {
    const searchMessages = async () => {
      if (!searchText.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await API.get(
          `/messages/search/${departmentId}?query=${searchText}`
        );
        setSearchResults(res.data);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Search error");
      }
    };
    searchMessages();
  }, [searchText, departmentId]);



  useEffect(() => {
    if (searchResults.length > 0) {
      scrollToMessage(searchResults[0]._id);
    }
  }, [searchResults]);



  const scrollToMessage = async (msgId) => {
    let tries = 0;

    while (!messageRefs.current[msgId] && hasMore && tries < 10) {
      const nextPage = page + 1;
      setPage(nextPage);

      await fetchMessages(nextPage);

      tries++;
    }

    const el = messageRefs.current[msgId];

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      el.style.background = "#ffe58f";

      setTimeout(() => {
        el.style.background = "";
      }, 1500);
    }
  };


  const goToNext = async () => {
    if (searchResults.length === 0) return;

    const nextIndex = (currentIndex + 1) % searchResults.length;
    setCurrentIndex(nextIndex);

    await scrollToMessage(searchResults[nextIndex]._id);
  };



  const goToPrev = async () => {
    if (searchResults.length === 0) return;

    const prevIndex =
      (currentIndex - 1 + searchResults.length) % searchResults.length;

    setCurrentIndex(prevIndex);

    await scrollToMessage(searchResults[prevIndex]._id);
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
    const selectedText = window.getSelection().toString();

    // ✅ If user selected text → allow default browser menu
    if (selectedText.length > 0) {
      return;
    }

    // ❌ Otherwise show custom menu
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

  // Premium gradient background - no image, just smooth gradient
  const styles = {
    container: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      width: "100%",
      flex: 1,
      minWidth: 0,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflow: "auto",
      position: "relative"
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
      height: "400px",
      overflowY: "auto",
      flex: 1,
      gap: "12px",
      minHeight: 0,
      background: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(2px)",
      maxHeight: "calc(100vh - 180px)"
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
      cursor: "text"
    }),
    senderName: {
      fontSize: "12px",
      fontWeight: "bold",
      marginBottom: "4px",
      opacity: 0.9,
      cursor: "default"
    },
    messageText: {
      fontSize: "14px",
      lineHeight: "1.4",
      wordWrap: "break-word",
      marginTop: "4px",
      cursor: "text",
      userSelect: "text"
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
      display: "block",
      cursor: "default"
    },
    typingIndicator: {
      padding: "8px 16px",
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "20px",
      width: "fit-content",
      fontSize: "12px",
      color: "#667eea",
      fontWeight: "500",
      animation: "pulse 1.5s infinite",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
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
    },
    searchBar: {
      padding: "10px 20px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(0, 0, 0, 0.1)"
    },
    searchContainer: {
      display: "flex",
      gap: "10px",
      alignItems: "center"
    },
    searchInput: {
      padding: "8px 12px",
      flex: 1,
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none"
    },
    searchButton: {
      padding: "8px 16px",
      background: "#667eea",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px"
    }
  };

  return (
    <div style={styles.container}>
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
              opacity: 0.7;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.02);
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
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          
          .messages-area::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
          }
          
          .messages-area::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.5);
          }
          
          /* Allow text selection in messages */
          .message-text, .message-bubble {
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
          }
          
          /* Link styling */
          a {
            color: inherit;
            text-decoration: underline;
          }
          
          .message-bubble a {
            color: #667eea;
            text-decoration: underline;
          }
          
          .message-bubble a:hover {
            opacity: 0.8;
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
      <div style={styles.searchBar}>
        {!showSearch ? (
          <button style={styles.searchButton} onClick={() => setShowSearch(true)}>
            🔍 Search Messages
          </button>
        ) : (
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />
            <button style={styles.searchButton} onClick={goToPrev}>⬆ Prev</button>
            <button style={styles.searchButton} onClick={goToNext}>Next ⬇</button>
            <span style={{ fontSize: "12px", color: "#666" }}>
              {searchResults.length > 0
                ? `${currentIndex + 1}/${searchResults.length}`
                : "0 results"}
            </span>
            <button
              style={{ ...styles.searchButton, background: "#f44336" }}
              onClick={() => {
                setShowSearch(false);
                setSearchText("");
                setSearchResults([]);
              }}
            >
              ✕ Close
            </button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="messages-area" style={styles.messagesArea} ref={messagesAreaRef}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.8)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.7 }}>💬</div>
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>No messages yet</p>
            <small style={{ fontSize: "12px", opacity: 0.7 }}>Be the first to start the conversation!</small>
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
                    msg.text && (
                      <div className="message-text" style={styles.messageText}>
                        {convertToClickableLinks(msg.text)}
                      </div>
                    )
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