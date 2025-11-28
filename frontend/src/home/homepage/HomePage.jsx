import Header from '../header/Header';
import Footer from '../footer/Footer';
import './HomePage.css';

const HomePage = () => {
  return (
    <>
      <Header />
      <main className="homepage">
        <h2>Welcome to Cement Company CRM</h2>
        <p>
          This CRM system helps manage employees, shift reports, raw material tracking, salary
          automation, and much more.
        </p>
        <img src="https://img.freepik.com/free-photo/cement-texture_1194-5523.jpg" alt="Cement" />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
