import React, { useEffect } from 'react';
import { Leaf, ShieldCheck, Heart, Award, Users, UtensilsCrossed } from 'lucide-react';

export default function About({ setCurrentTab }) {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.08 });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));
    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="about-page-wrapper">
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        height: '450px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white'
      }}>
        <img
          src="/images/about_hero_spices.png"
          alt="Indian Spices Heritage"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8))', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '2rem' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#FFFFFF', marginBottom: '1rem', textShadow: '2px 2px 8px rgba(0,0,0,0.6)' }}>Our Roots & Heritage</h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto', opacity: 0.9 }}>
            From a small family kitchen in Delhi to serving thousands of households across India.
            Discover the passion behind M & R Co..
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="container reveal-on-scroll" style={{ padding: '4rem 1.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>The Journey of M & R Co.</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '3rem' }}>How we brought authentic flavors back to the Indian kitchen.</p>

        <div className="timeline">
          <div className="timeline-item left">
            <div className="timeline-content">
              <h3>2015: The Kitchen Experiment</h3>
              <p>Disappointed by commercial spices filled with chalk and artificial colors, our grandmother started grinding her own pure spices at home using a traditional stone mortar.</p>
            </div>
          </div>
          <div className="timeline-item right">
            <div className="timeline-content">
              <h3>2018: Word of Mouth</h3>
              <p>Neighbors and relatives started requesting custom batches of our special Garam Masala and Biryani blends. The demand outgrew our home kitchen.</p>
            </div>
          </div>
          <div className="timeline-item left">
            <div className="timeline-content">
              <h3>2020: The First Mill</h3>
              <p>We set up our first small-scale, temperature-controlled stone mill in Khari Baoli to process larger quantities while preserving the essential oils.</p>
            </div>
          </div>
          <div className="timeline-item right">
            <div className="timeline-content">
              <h3>2023: Going Digital</h3>
              <p>M & R Co. launches online, bringing 100% pure, FSSAI-certified, homemade spices to doorsteps across India without compromising on our original family recipe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Founders Section */}
      <section className="reveal-on-scroll" style={{ backgroundColor: '#FDF6EE', padding: '5rem 1.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
            <div style={{ flex: '1 1 400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img src="/images/grandma_kitchen.png" alt="Our Spices" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: '1 1 500px' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>The Promise of Purity</h2>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                At M & R Co., we believe that food is a celebration of life, and spices are its soul. 
                Our mission is simple: to provide you with spices that taste exactly like the ones our grandmothers used to make.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem' }}>
                  <Leaf color="var(--success)" size={24} /> Sourced directly from trusted Indian farmers.
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem' }}>
                  <ShieldCheck color="var(--primary)" size={24} /> Zero preservatives, colors, or MSG.
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem' }}>
                  <Heart color="var(--error)" size={24} /> Packed with love and extreme hygiene.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Farm to Table Process */}
      <section className="container reveal-on-scroll" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '4rem', fontSize: '2.5rem' }}>From Farm to Your Kitchen</h2>
        
        <div className="process-grid">
          <div className="process-card step-1">
            <span className="process-badge">STEP 01</span>
            <div className="process-icon-wrapper" style={{ background: '#E8F5E9' }}>
              <span style={{ fontSize: '2.8rem', margin: 'auto' }}>🌱</span>
            </div>
            <h3>Ethical Sourcing</h3>
            <p>We source raw, unpolished spices directly from the best farms in Kerala and Rajasthan.</p>
          </div>
          
          <div className="process-card step-2">
            <span className="process-badge">STEP 02</span>
            <div className="process-icon-wrapper" style={{ background: '#FFF3E0' }}>
              <span style={{ fontSize: '2.8rem', margin: 'auto' }}>☀️</span>
            </div>
            <h3>Sun Drying</h3>
            <p>Spices are naturally sun-dried to lock in flavors and prevent mold formation.</p>
          </div>
          
          <div className="process-card step-3">
            <span className="process-badge">STEP 03</span>
            <div className="process-icon-wrapper" style={{ background: '#FBE9E7' }}>
              <span style={{ fontSize: '2.8rem', margin: 'auto' }}>⚙️</span>
            </div>
            <h3>Cold Grinding</h3>
            <p>Stone-ground at low temperatures to ensure natural volatile oils are retained.</p>
          </div>
          
          <div className="process-card step-4">
            <span className="process-badge">STEP 04</span>
            <div className="process-icon-wrapper" style={{ background: '#E3F2FD' }}>
              <span style={{ fontSize: '2.8rem', margin: 'auto' }}>📦</span>
            </div>
            <h3>Flavor Lock Packing</h3>
            <p>Packed immediately in food-grade material to guarantee farm-fresh aroma.</p>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="container reveal-on-scroll" style={{ paddingBottom: '5rem' }}>
        <div className="card" style={{ backgroundColor: 'var(--text)', color: 'white', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Experience the Richness of Pure Spices</h3>
          <p style={{ maxWidth: '600px', fontSize: '1.1rem', opacity: 0.9, lineHeight: '1.6' }}>
            Once you taste curries cooked with authentic stone-ground spices, there is no going back. Order your first sample box today.
          </p>
          <button className="btn btn-primary" onClick={() => setCurrentTab('products')} style={{ marginTop: '1.5rem', padding: '1rem 3rem', fontSize: '1.1rem' }}>
            Browse Spices Now
          </button>
        </div>
      </section>
    </div>
  );
}
