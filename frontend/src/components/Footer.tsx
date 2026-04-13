import './Footer.css';

function Footer() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: '2-digit' 
  });

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span className="footer-copyright">© Banyan Technology. All Rights Reserved.</span>
        <span className="footer-date">{currentDate}</span>
      </div>
    </footer>
  );
}

export default Footer;
