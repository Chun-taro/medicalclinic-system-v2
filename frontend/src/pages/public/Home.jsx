import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Clock, Heart, ArrowRight, ArrowDown } from 'lucide-react';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="badge">Welcome to BukSU Clinic</div>
                    <h1 className="hero-title">
                        Exceptional Care,<br />
                        <span className="text-gradient">Right on Campus.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Experience a modern, hassle-free approach to your healthcare needs.
                        Book appointments, access records, and get expert consultation all in one secure platform.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="btn-primary">
                            Access Patient Portal
                            <ArrowRight size={20} className="icon-right" />
                        </Link>
                        <a href="#features" className="btn-secondary">
                            Learn More
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
                            <p className="float-title">Active Health</p>
                            <p className="float-sub">Status: Optimal</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <h2>Why Choose the BukSU Clinic Portal?</h2>
                    <p>We've digitized your healthcare journey to provide faster, safer, and completely secure services.</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper blue">
                            <Clock size={28} />
                        </div>
                        <h3>Streamlined Booking</h3>
                        <p>Schedule consultations with university doctors instantly. Skip the long lines and wait times.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper green">
                            <Shield size={28} />
                        </div>
                        <h3>Secure Records</h3>
                        <p>Your medical history is encrypted and stored safely, easily accessible whenever you need it.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper purple">
                            <Heart size={28} />
                        </div>
                        <h3>Holistic Care</h3>
                        <p>From routine checkups to specialized guidance, get comprehensive care designed for you.</p>
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
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} BukSU Medical Clinic System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
