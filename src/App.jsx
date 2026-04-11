import { useState } from "react";
import Login from "./pages/Login";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import UsersPage from "./pages/UsersPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import Notifications from "./pages/Notifications";
import "./index.css";

function App() {
  const [user, setUser] = useState(!!localStorage.getItem("token"));
  const [page, setPage] = useState("chat");

  if (!user) return <Login setUser={setUser} />;

  const role = localStorage.getItem("role");

  if (!user) return <Login setUser={setUser} />;

  if (role === "admin") {
    return <AdminDashboard />;
  }

  return (
    <div className="app">
      <Header />

      <div className="main">
        <Sidebar setPage={setPage} />

        {/* 🔥 DYNAMIC CONTENT */}
        {role === "admin" ? (
          page === "chat" ? <Chat /> :
            page === "users" ? <UsersPage /> :
              page === "departments" ? <DepartmentsPage /> :
                <AdminDashboard />
        ) : (
          page === "chat" ? <Chat /> :
            page === "notifications" ? <Notifications /> :
              <Chat />
        )}
      </div>
    </div>
  );
}

export default App;