const Footer = () => {
  const styles = {
    footer: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "16px 20px",
      textAlign: "center",
      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    },
    text: {
      margin: 0,
      fontSize: "clamp(12px, 3.5vw, 14px)",
      fontWeight: "500",
      color: "white",
      letterSpacing: "0.3px",
      opacity: 0.9,
    },
  };

  return (
    <div style={styles.footer}>
      <p style={styles.text}>
        © 2026 Saanvi Technologies Intercom - By Team UK
      </p>
    </div>
  );
};

export default Footer;