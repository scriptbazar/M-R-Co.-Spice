import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call for sending message
    setTimeout(() => {
      showToast('Thank you! Your message has been sent successfully. We will get back to you soon.', 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="contact-page-wrapper">
      {/* Hero Section */}
      <section className="contact-hero">
        <h1>Get In Touch</h1>
        <p>Have questions about our spices, bulk orders, or need help with your current order? Our team is here to help you.</p>
      </section>

      {/* Main Content Grid */}
      <section className="contact-grid">
        {/* Contact Info Cards */}
        <div className="contact-info-cards">
          <div className="contact-card">
            <div className="contact-card-icon">
              <MapPin size={24} />
            </div>
            <div className="contact-card-content">
              <h3>Visit Our Store</h3>
              <p>H.No 12, Spice Garden Road,<br />Khari Baoli, Old Delhi, India - 110006</p>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <Phone size={24} />
            </div>
            <div className="contact-card-content">
              <h3>Call Us</h3>
              <p>Support: +91 98765 43210<br />Sales: +91 98765 43211</p>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <Mail size={24} />
            </div>
            <div className="contact-card-content">
              <h3>Email Us</h3>
              <p>Support: support@mrco.com<br />Careers: jobs@mrco.com</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-wrapper">
          <h2>Send us a Message</h2>
          <p>Fill out the form below and we'll reply within 24 hours.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="floating-group">
              <input 
                type="text" 
                name="name" 
                id="contact-name" 
                className="floating-input" 
                placeholder=" " 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
              <label htmlFor="contact-name" className="floating-label">Your Full Name</label>
            </div>

            <div className="floating-group">
              <input 
                type="email" 
                name="email" 
                id="contact-email" 
                className="floating-input" 
                placeholder=" " 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
              <label htmlFor="contact-email" className="floating-label">Your Email Address</label>
            </div>

            <div className="floating-group">
              <input 
                type="text" 
                name="subject" 
                id="contact-subject" 
                className="floating-input" 
                placeholder=" " 
                value={formData.subject} 
                onChange={handleChange} 
                required 
              />
              <label htmlFor="contact-subject" className="floating-label">Subject</label>
            </div>

            <div className="floating-group">
              <textarea 
                name="message" 
                id="contact-message" 
                className="floating-input" 
                placeholder=" " 
                rows="4" 
                value={formData.message} 
                onChange={handleChange} 
                required 
              ></textarea>
              <label htmlFor="contact-message" className="floating-label">Your Message</label>
            </div>

            <button type="submit" className="contact-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  Send Message <Send size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
