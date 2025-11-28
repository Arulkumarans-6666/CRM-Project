import Header from '../header/Header';
import Footer from '../footer/Footer';
import './Contact.css';

const Contact = () => {
  return (
    <>
      <Header />
      <main className="contact">
        <h2>Contact Us</h2>
        <p>Email: support@cementcrm.com</p>
        <p>Phone: +91-9876543210</p>
        <p>Address: 123, Cement Nagar, Tamil Nadu</p>
      </main>
      <Footer />
    </>
  );
};

export default Contact;
