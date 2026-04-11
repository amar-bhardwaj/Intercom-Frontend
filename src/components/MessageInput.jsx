// import { useState } from "react";
// import socket from "../services/socket";
// import API from "../services/api";

// const MessageInput = ({ departmentId }) => {
//   const [text, setText] = useState("");

//   const userName = localStorage.getItem("userName");

//   // ✅ SEND MESSAGE
//   const sendMessage = async () => {
//     if (!text.trim() || !departmentId) return;

//     const msg = {
//       text,
//       department: departmentId
//     };

//     try {
//       // ❌ REMOVE socket.emit
//       await API.post("/messages/send", msg);

//       setText("");
//     } catch (err) {
//       console.error("Send error:", err.response?.data || err.message);
//     }
//   };

//   // ✅ TYPING
//   const handleTyping = (e) => {
//     setText(e.target.value);

//     socket.emit("typing", {
//       departmentId,
//       userName
//     });
//   };

//   // ✅ FILE UPLOAD
//   const handleFile = async (e) => {
//     const file = e.target.files[0];
//     if (!file || !departmentId) return;

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const res = await API.post("/upload", formData);

//       const msg = {
//         text: "",
//         department: departmentId,
//         fileUrl: res.data.fileUrl
//       };

//       // ❌ REMOVE socket.emit
//       await API.post("/messages/send", msg);

//     } catch (err) {
//       console.error("File upload error");
//     }
//   };

//   return (
//     <div className="inputBox">

//       <input
//         value={text}
//         onChange={handleTyping}
//         placeholder={
//           departmentId
//             ? "Type a message..."
//             : "Select department first..."
//         }
//       />

//       <button onClick={sendMessage}>Send</button>

//       <input type="file" onChange={handleFile} />

//     </div>
//   );
// };

// export default MessageInput;


import { useState, useRef, useEffect } from "react";
import socket from "../services/socket";
import API from "../services/api";

const MessageInput = ({ departmentId, replyTo, clearReply }) => {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const userName = localStorage.getItem("userName");

  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);


  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [text]);

  // Send message function
  const sendMessage = async () => {
    if ((!text.trim() && !selectedFile) || !departmentId || isSending) return;

    setIsSending(true);
    try {
      const msg = {
        text: text.trim() || "",
        department: departmentId

      };
      if (replyTo) {
        msg.replyTo = replyTo;
      }


      // If there's a selected file, include it
      if (selectedFile) {
        msg.fileUrl = selectedFile.url;
        msg.fileName = selectedFile.name;
      }

      await API.post("/messages/send", msg);
      setText("");
      setSelectedFile(null);
      setIsTyping(false);
      clearReply && clearReply();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Send error:", err.response?.data || err.message);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing with debounce
  const handleTyping = (e) => {
    const newText = e.target.value;
    setText(newText);

    if (!isTyping && newText.trim()) {
      setIsTyping(true);
      socket.emit("typing", {
        departmentId,
        userName
      });

      // Stop typing indicator after 1 second of no typing
      setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };

  // Handle file selection - FIXED: This function properly handles the file input
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !departmentId) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Show file preview immediately
    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    });

    // Auto-upload the file
    uploadFile(file);
  };

  // Upload file to server
  const uploadFile = async (file) => {
    setIsSending(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/upload", formData);

      // Update selected file with URL from server
      setSelectedFile(prev => ({
        ...prev,
        url: res.data.fileUrl
      }));

      // Optional: Auto-send file message immediately
      // Uncomment the following lines if you want to send file immediately without clicking send
      /*
      const msg = {
        text: "",
        department: departmentId,
        fileUrl: res.data.fileUrl,
        fileName: file.name
      };
      await API.post("/messages/send", msg);
      setSelectedFile(null);
      */

    } catch (err) {
      console.error("File upload error", err);
      alert("Failed to upload file. Please try again.");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger file input click - FIXED: This function now properly opens the file dialog
  const openFileDialog = () => {
    if (fileInputRef.current && !isDisabled) {
      fileInputRef.current.click();
    }
  };

  const isDisabled = !departmentId || isSending;

  // Get file icon based on file type
  const getFileIcon = (file) => {
    if (file.type?.startsWith("image/")) return "🖼️";
    if (file.type === "application/pdf") return "📄";
    if (file.type?.includes("word")) return "📘";
    if (file.type?.includes("excel") || file.type?.includes("spreadsheet")) return "📊";
    if (file.type?.startsWith("text/")) return "📝";
    return "📎";
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Inline styles
  const styles = {
    container: {
      backgroundColor: "#ffffff",
      borderTop: "1px solid #e2e8f0",
      padding: "16px 20px",
      boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
      transition: "all 0.3s ease",
    },
    filePreview: {
      marginBottom: "12px",
      padding: "8px 12px",
      backgroundColor: "#f7fafc",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      animation: "slideDown 0.3s ease",
      border: "1px solid #e2e8f0",
    },
    fileInfo: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flex: 1,
      minWidth: 0,
    },
    fileName: {
      fontSize: "0.875rem",
      color: "#2d3748",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontWeight: "500",
    },
    fileSize: {
      fontSize: "0.75rem",
      color: "#718096",
    },
    fileStatus: {
      fontSize: "0.75rem",
      color: "#48bb78",
      marginLeft: "8px",
    },
    clearFileBtn: {
      background: "none",
      border: "none",
      fontSize: "1.25rem",
      cursor: "pointer",
      color: "#a0aec0",
      padding: "4px 8px",
      borderRadius: "4px",
      transition: "all 0.2s",
    },
    inputWrapper: {
      display: "flex",
      alignItems: "flex-end",
      gap: "12px",
      flexWrap: "wrap",
    },
    textareaWrapper: {
      flex: 1,
      position: "relative",
      minWidth: "200px",
    },
    textarea: {
      width: "100%",
      padding: "10px 12px",
      border: "2px solid #e2e8f0",
      borderRadius: "20px",
      fontSize: "0.95rem",
      fontFamily: "inherit",
      resize: "none",
      outline: "none",
      transition: "all 0.2s",
      backgroundColor: "#f7fafc",
      maxHeight: "120px",
      lineHeight: "1.4",
    },
    actionButtons: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
    },
    iconBtn: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      border: "none",
      backgroundColor: "#f7fafc",
      cursor: "pointer",
      fontSize: "1.2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
      color: "#4a5568",
    },
    sendBtn: {
      padding: "10px 24px",
      borderRadius: "24px",
      border: "none",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "0.9rem",
      transition: "all 0.2s",
      minWidth: "80px",
    },
    disabledBtn: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    charCount: {
      position: "absolute",
      bottom: "-20px",
      right: "8px",
      fontSize: "0.7rem",
      color: "#a0aec0",
    },
    disabledOverlay: {
      opacity: 0.6,
      pointerEvents: "none",
    },
  };

  // Animation keyframes
  const animationStyles = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `;

  return (
    <>
      <style>{animationStyles}</style>
      <div style={styles.container}>
        {/* File Preview */}
        {selectedFile && (
          <div style={styles.filePreview}>
            <div style={styles.fileInfo}>
              <span style={{ fontSize: "1.2rem" }}>
                {getFileIcon(selectedFile)}
              </span>
              <span style={styles.fileName}>{selectedFile.name}</span>
              <span style={styles.fileSize}>
                ({formatFileSize(selectedFile.size)})
              </span>
              {!selectedFile.url && (
                <span style={styles.fileStatus}>⏳ Uploading...</span>
              )}
              {selectedFile.url && (
                <span style={styles.fileStatus}>✓ Ready to send</span>
              )}
            </div>
            <button
              onClick={clearSelectedFile}
              style={styles.clearFileBtn}
              onMouseEnter={(e) => e.currentTarget.style.color = "#e53e3e"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#a0aec0"}
            >
              ✕
            </button>
          </div>
        )}





        {replyTo && (
          <div style={{
            marginBottom: "10px",
            padding: "8px 12px",
            background: "#f1f5f9",
            borderLeft: "4px solid #667eea",
            borderRadius: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ fontSize: "12px" }}>
              <strong>{replyTo.sender}</strong>
              <div style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "250px"
              }}>
                {replyTo.text}
              </div>
            </div>

            <button
              onClick={clearReply}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              ✕
            </button>
          </div>
        )}
        {/* Input Area */}
        <div style={isDisabled ? { ...styles.inputWrapper, ...styles.disabledOverlay } : styles.inputWrapper}>
          <div style={styles.textareaWrapper}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder={
                departmentId
                  ? "Type a message... (Shift+Enter for new line)"
                  : "⚠️ Select department first..."
              }
              disabled={isDisabled}
              rows="1"
              style={{
                ...styles.textarea,
                borderColor: text ? "#667eea" : "#e2e8f0",
                backgroundColor: isDisabled ? "#edf2f7" : "#f7fafc",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
              onBlur={(e) => {
                if (!text) {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }
              }}
            />
            {text.length > 0 && (
              <div style={styles.charCount}>
                {text.length} characters
              </div>
            )}
          </div>

          <div style={styles.actionButtons}>
            {/* File Upload Button - FIXED: Now properly triggers file dialog */}
            <button
              onClick={openFileDialog}
              style={styles.iconBtn}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.backgroundColor = "#edf2f7";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
                e.currentTarget.style.transform = "scale(1)";
              }}
              disabled={isDisabled}
              title="Attach file (max 10MB)"
            >
              📎
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={isDisabled}
              style={{ display: "none" }}
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={isDisabled || (!text.trim() && !selectedFile?.url)}
              style={{
                ...styles.sendBtn,
                ...((isDisabled || (!text.trim() && !selectedFile?.url)) ? styles.disabledBtn : {}),
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && (text.trim() || selectedFile?.url)) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {isSending ? "⏳ Sending..." : "Send ➤"}
            </button>
          </div>
        </div>

        {/* Help Text */}
        {departmentId && (
          <div style={{
            marginTop: "8px",
            fontSize: "0.7rem",
            color: "#a0aec0",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}>
            <span>💡 Tip: Press Enter to send, Shift+Enter for new line</span>
            <span>📎 Click the paperclip to attach files (max 10MB)</span>
          </div>
        )}
      </div>
    </>
  );
};

export default MessageInput;