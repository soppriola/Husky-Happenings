import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import huskiesLogo from "../assets/huskies.jpg";
import welcomeImage from "../assets/Welcome.webp";
import friendsImage from "../assets/Friends.webp";
import campusImage from "../assets/newschool.jpeg";
import "./Home.css";

const slides = [
  {
    image: welcomeImage,
    alt: "Welcome Huskies",
    caption: "Welcome to the Husky community",
  },
  {
    image: friendsImage,
    alt: "Students on campus",
    caption: "Find your people on campus",
  },
  {
    image: campusImage,
    alt: "USM campus",
    caption: "Stay connected with campus life",
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((previousSlide) => (previousSlide + 1) % slides.length);
    }, 4000);

    return () => clearInterval(slideTimer);
  }, []);

  return (
    <main className="home-page">
      <img src={huskiesLogo} alt="" className="home-background-logo" />

      <section className="home-hero">
        <div className="hero-content">
          <span className="brand-pill">University Social Hub</span>

          <h1>HuskyHappenings</h1>

          <p>
            Stay connected to everything that matters at USM. From campus conversations and group communities to events, messaging, and career opportunities. HuskyHappenings brings your entire university experience into one space
          </p>

          <div className="hero-actions">
            <Link to="/login" className="home-btn primary">
              Log In
            </Link>

            <Link to="/signup" className="home-btn secondary">
              Create Account
            </Link>
          </div>
        </div>

        <div className="hero-slideshow">
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].alt}
            className="slide-image"
          />

          <div className="slideshow-overlay">
            <p>{slides[currentSlide].caption}</p>
          </div>

          <div className="slide-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.alt}
                className={`slide-dot ${
                  currentSlide === index ? "active" : ""
                }`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Show slide ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}