import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import logo from '../../assets/logo.png';
import { Shield, Clock, Heart, ArrowRight, ArrowDown } from 'lucide-react';
import './Home.css';

const Home = () => {
    const { setForceLightMode } = useTheme();

    React.useEffect(() => {
        setForceLightMode(true);
        return () => setForceLightMode(false);
    }, [setForceLightMode]);

    return (
        <div className="home-container">
            {/* Navigation Header */}
            <header className="home-header">
                <nav className="nav-content">
                    <Link to="/" className="nav-brand">
                        <img src={logo} alt="BukSU Clinic Logo" className="nav-logo" />
                        <span>BukSU Medical Clinic</span>
                    </Link>
                    
                    <div className="nav-links">
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#mobile-app" className="nav-link">Mobile App</a>
                        <Link to="/login" className="nav-portal-btn">
                            Login to Portal
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="badge">BukSU Medical Clinic</div>
                    <h1 className="hero-title">
                        Advanced Healthcare<br />
                        <span className="text-gradient">For our University.</span>
                    </h1>
                    <p className="hero-subtitle">
                        A dedicated platform for Bukidnon State University students and faculty. 
                        Manage appointments, view medical history, and access health services with ease.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="btn-primary">
                            Access Portal
                            <ArrowRight size={20} className="icon-right" />
                        </Link>
                        <a href="/app.html" className="btn-secondary" style={{ marginLeft: '12px' }}>
                            Mobile App
                        </a>
                        <a href="#features" className="btn-secondary">
                            Explore Features
                            <ArrowDown size={20} className="icon-right" />
                        </a>
                    </div>
                </div>

                {/* Abstract decorative elements */}
                <div className="hero-graphics">
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                    <div className="glass-card main-card">
                        <div className="card-header">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                        </div>
                        <div className="card-body">
                            <div className="mock-chart">
                                <div className="bar bar-1"></div>
                                <div className="bar bar-2"></div>
                                <div className="bar bar-3"></div>
                                <div className="bar bar-4"></div>
                            </div>
                            <div className="mock-text-line"></div>
                            <div className="mock-text-line short"></div>
                        </div>
                    </div>
                    <div className="glass-card float-card">
                        <Heart className="float-icon" size={24} />
                        <div className="float-content">
                            <p className="float-title">University Health</p>
                            <p className="float-sub">Status: Connected</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <h2>Clinic Management Simplified</h2>
                    <p>Designed specifically for the Bukidnon State University community, providing seamless access to campus medical services.</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper blue">
                            <Clock size={28} />
                        </div>
                        <h3>Smart Scheduling</h3>
                        <p>Book medical consultations instantly. View doctor availability in real-time and skip the physical queues.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper green">
                            <Shield size={28} />
                        </div>
                        <h3>Digital Health Records</h3>
                        <p>Your medical history is unified and secure. Access prescriptions and lab results anytime, anywhere.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper purple">
                            <Heart size={28} />
                        </div>
                        <h3>Campus Wellness</h3>
                        <p>Receive localized health guidance and weather-integrated wellness tips tailored for the Malaybalay campus.</p>
                    </div>
                </div>
            </section>

            {/* Mobile App Section */}
            <section className="mobile-app-section">
                <div className="mobile-app-content">
                    <div className="mobile-app-text">
                        <div className="badge">Now on Mobile</div>
                        <h2>BukSU Clinic is now in your pocket</h2>
                        <p>Download our mobile application to get real-time notifications, manage appointments on the go, and access your health records anywhere.</p>
                        <div className="mobile-app-actions">
                            <a href="/downloads/BukSU-Medical-Clinic-App.apk" className="btn-primary" download>
                                Download for Android (APK)
                            </a>
                            <a href="/app.html" className="btn-secondary">
                                Learn More
                            </a>
                        </div>
                    </div>
                    <div className="mobile-app-preview">
                        <div className="phone-mockup">
                            <div className="phone-screen">
                                <Heart color="white" size={48} />
                                <h3 style={{ color: 'white', marginTop: '1rem' }}>BukSU Medical Clinic App</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust/Footer Section */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h2>BukSU Clinic</h2>
                        <p>Empowering the university community through modern healthcare.</p>
                    </div>
                    <div className="footer-links">
                        <Link to="/login" className="footer-link">Login to Dashboard</Link>
                        <a href="/app.html" className="footer-link">Download Mobile App</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} BukSU Medical Clinic. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
