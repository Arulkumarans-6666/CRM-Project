import Header from '../header/Header';
import Footer from '../footer/Footer';
import './About.css';

const About = () => {
  return (
    <>
      <Header />
      <main className="about">
        <h2>About Our Company</h2>
        <p>
          We are a leading cement manufacturer with 3 shifts daily and over 300+ employees. Our CRM
          is designed to manage people, performance, and production efficiently.
        </p>
      </main>
      <Footer />
    </>
  );
};

export default About;
