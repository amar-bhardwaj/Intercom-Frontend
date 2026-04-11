const Header = ({ toggleSidebar }) => {
  const userName = localStorage.getItem("userName");
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <header className="header">

      {/* LEFT SIDE */}
      <div className="headerLeft">

        {/* ☰ MENU BUTTON (mobile) */}
        <button className="menuBtn" onClick={toggleSidebar}>
          ☰
        </button>

        {/* LOGO */}
        <img src="/logo.png" alt="logo" className="logo" />

        <h3>Saanvi Technologies<br /><span style={{fontSize:"15px", fontWeight:"normal"}}>Intercom</span></h3>
      </div>

      {/* RIGHT SIDE */}
      <div className="headerRight">

        <div className="userInfo">
          <span className="userName">{userName}</span>
          <span className="role">{role}</span>
        </div>

        <button className="logoutBtn" onClick={logout}>
          Logout
        </button>

      </div>

    </header>
  );
};

export default Header;