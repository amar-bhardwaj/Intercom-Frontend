import { useState } from "react";
import API from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Login = ({ setUser }) => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    if (!form.username || !form.password) {
      alert("Please enter username and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("userName", res.data.user.fullName);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("department", res.data.user.department);

      setUser(true);
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      login();
    }
  };

  const styles = {
    container: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    mainContent: {
      flex: 1,
      background: "linear-gradient(130deg, #e9ecfc 0%, #f7f3f3 0%)",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    backgroundOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&h=900&fit=crop')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      opacity: 0.15,
      pointerEvents: "none"
    },
    loginCard: {
      position: "relative",
      zIndex: 2,
      background: "rgba(255, 255, 255, 0.98)",
      borderRadius: "24px",
      padding: "48px 40px",
      width: "90%",
      maxWidth: "420px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      backdropFilter: "blur(10px)",
      animation: "slideUp 0.5s ease"
    },
    header: {
      textAlign: "center",
      marginBottom: "32px"
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "8px"
    },
    companyName: {
      fontSize: "20px",
      fontWeight: "normal",
      color: "#666"
    },
    subText: {
      fontSize: "14px",
      color: "#666",
      textAlign: "center",
      marginTop: "8px"
    },
    inputGroup: {
      marginBottom: "20px"
    },
    inputLabel: {
      display: "block",
      fontSize: "13px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "6px"
    },
    input: {
      width: "100%",
      padding: "14px 16px",
      border: "2px solid #e0e0e0",
      borderRadius: "12px",
      fontSize: "14px",
      transition: "all 0.3s ease",
      outline: "none",
      boxSizing: "border-box"
    },
    button: {
      width: "100%",
      padding: "14px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginTop: "8px"
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: "not-allowed"
    },
    footerText: {
      textAlign: "center",
      marginTop: "24px",
      fontSize: "12px",
      color: "#999"
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            overflow: hidden;
            margin: 0;
            padding: 0;
          }
        `}
      </style>
      
      <Header />
      
      <div style={styles.mainContent}>
        <div style={styles.backgroundOverlay} />
        
        <div style={styles.loginCard}>
          <div style={styles.header}>
            <h1 style={styles.title}>
              Saanvi Technologies<br />
              <span style={styles.companyName}>Intercom Panel</span>
            </h1>
            <p style={styles.subText}>Login to continue</p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Username</label>
            <input
              style={styles.input}
              placeholder="Enter your username"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Enter your password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              onKeyPress={handleKeyPress}
            />
          </div>

          <button
            style={{
              ...styles.button,
              ...(isLoading && styles.buttonDisabled)
            }}
            onClick={login}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <div style={styles.footerText}>
            <p>Secure Login • All rights reserved</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;