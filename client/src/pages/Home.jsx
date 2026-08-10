import React, { useState, useEffect } from 'react';
import { ShieldCheck, Flame, Star, Sparkles, MoveRight, Heart, Eye } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function Home({ products, productsLoading, onAddToCart, setCurrentTab, setCategoryFilter, wishlist, onToggleWishlist, isInWishlist, recentlyViewed, setSelectedProductId, onTrackView }) {
  // Highlight 4 bestsellers
  const bestsellers = productsLoading ? Array(4).fill(null) : products.slice(0, 4);

  // Slider Slides Configuration
  const slides = [
    {
      image: '/images/hero_chilli.jpg',
      tag: '🌶️ Authentic Indian Spice',
      title: 'Premium Chilli Powder',
      desc: "Pure. Aromatic. Handpicked. Experience the richness of India's finest chilli, sourced from trusted farms and packed with care."
    },
    {
      image: '/images/hero_turmeric.jpg',
      tag: '🌿 Authentic Indian Spice',
      title: 'Premium Turmeric Powder',
      desc: "Pure. Aromatic. Handpicked. Experience the richness of India's finest turmeric, sourced from trusted farms and packed with care."
    },
    {
      image: '/images/hero_cumin.jpg',
      tag: '🫘 Authentic Indian Spice',
      title: 'Premium Cumin Seeds',
      desc: "Pure. Aromatic. Handpicked. Experience the richness of India's finest cumin seeds, sourced from trusted farms and packed with care."
    },
    {
      image: '/images/hero_coriander.jpg',
      tag: '🥣 Authentic Indian Spice',
      title: 'Premium Coriander Powder',
      desc: "Pure. Aromatic. Handpicked. Experience the richness of India's finest coriander, sourced from trusted farms and packed with care."
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [testimonials, setTestimonials] = useState([]);

  const [addedItem, setAddedItem] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/api/products/public/testimonials')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
        }
      })
      .catch(err => console.error('Error fetching testimonials:', err));
  }, []);

  // Scroll reveal IntersectionObserver
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
  }, [products, testimonials, recentlyViewed]);

  const handleSubscribe = async () => {
    if (!subscribeEmail || !subscribeEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/auth/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Subscribed successfully!', 'success');
        setSubscribeEmail('');
      } else {
        showToast(data.error || 'Subscription failed.', 'error');
      }
    } catch (err) {
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  // Auto-scroll slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleCategoryClick = (category) => {
    setCategoryFilter(category);
    setCurrentTab('products');
  };

  const handleProductClick = (product) => {
    if (onTrackView) onTrackView(product);
    setSelectedProductId(product.id);
    setCurrentTab('product-detail');
  };

  const handleAddToCartLocal = (prod, variant, e) => {
    onAddToCart(prod, variant);
    const key = `${prod.id}-${variant.id}`;
    setAddedItem(key);
    if (e && e.currentTarget) {
      e.currentTarget.classList.add('btn-success-animation');
      const btn = e.currentTarget;
      setTimeout(() => {
        if (btn) btn.classList.remove('btn-success-animation');
      }, 500);
    }
    setTimeout(() => {
      setAddedItem(null);
    }, 1500);
  };

  return (
    <div style={{ position: 'relative' }}>


      {/* Hero Section with Carousel */}
      <section className="hero">
        {/* Floating Spice Particles */}
        <div className="hero-particles">
          {Array.from({ length: 15 }).map((_, i) => {
            const left = `${(i * 7) + 5}%`; // distribute horizontally
            const delay = `${(i * 0.8).toFixed(1)}s`;
            const duration = `${(10 + (i % 5) * 2)}s`;
            return (
              <div 
                key={i} 
                className="hero-particle" 
                style={{ 
                  left, 
                  animationDelay: delay, 
                  animationDuration: duration 
                }} 
              />
            );
          })}
        </div>

        {/* Background Slides */}
        <div 
          className="hero-slider-bg"
          style={{ 
            width: `${slides.length * 100}%`, 
            transform: `translateX(-${(currentSlide * 100) / slides.length}%)` 
          }}
        >
          {slides.map((slide, idx) => (
            <div 
              key={idx}
              className="hero-slide"
              style={{ 
                width: `${100 / slides.length}%`,
                backgroundImage: `url(${slide.image})` 
              }}
            >
              <div className="hero-slide-overlay"></div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="container hero-content" style={{ position: 'static' }}>
          <div 
            style={{ 
              position: 'absolute',
              bottom: isMobile ? '12%' : '16%',
              left: isMobile ? '50%' : '75%',
              transform: 'translateX(-50%)',
              transition: 'all 0.5s ease-in-out',
              zIndex: 10
            }}
          >
            <button className="btn btn-primary" onClick={() => handleCategoryClick('')} style={{ fontSize: '1rem', padding: '0.9rem 2.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              Buy Now <MoveRight size={18} />
            </button>
          </div>
        </div>

        {/* Dots Indicators */}
        <div className="hero-dots">
          {slides.map((_, idx) => (
            <button 
              key={idx}
              className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              title={`Go to slide ${idx + 1}`}
            ></button>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="container reveal-on-scroll" style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#FFE8D6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
              <Sparkles size={24} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '600' }}>100% Homemade</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Crafted in small hygiene-controlled home batches based on traditional grandmother recipes.</p>
          </div>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#E2F0D9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <ShieldCheck size={24} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '600' }}>No Preservatives</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Completely free from artificial colors, chemical preservatives, MSG, or starch fillers.</p>
          </div>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#FFF3CD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-hover)' }}>
              <Flame size={24} />
            </div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '600' }}>Traditional Stone Ground</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Slow-ground at low temperatures to prevent heat damage, retaining natural spice oils.</p>
          </div>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ECEFF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>FSSAI</span>
            </div>
            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: '600' }}>FSSAI Certified</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Processed and packaged in absolute compliance with food safety and standards authority regulations.</p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container reveal-on-scroll" style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Shop By Category</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '2.5rem' }}>Select a category to browse our collection of handcrafted culinary secrets</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {[
            { name: 'Powders', title: 'Ground Powders', desc: 'Turmeric, Chilli, Dhaniya, and more.', emoji: '🌶️', bg: '#FDF2E9' },
            { name: 'Whole', title: 'Whole Spices', desc: 'Unprocessed high-grade dried spices.', emoji: '🫘', bg: '#F5EEF8' },
            { name: 'Blends', title: 'Gourmet Blends', desc: 'Hand-mixed spice blends for royal recipes.', emoji: '🥣', bg: '#EAF2F8' },
            { name: 'Combos', title: 'Value Combos', desc: 'Curated sets and gifting spice baskets.', emoji: '🎁', bg: '#E8F8F5' }
          ].map((cat, idx) => (
            <div 
              key={idx} 
              className="card" 
              onClick={() => handleCategoryClick(cat.name)}
              style={{ backgroundColor: cat.bg, border: 'none', cursor: 'pointer', textAlign: 'center', transform: 'scale(1)', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{cat.emoji}</div>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: '600', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{cat.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bestsellers Highlight */}
      <section className="container reveal-on-scroll" style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Our Bestselling Spices</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '2.5rem' }}>Spice powders loved and approved by thousand home chefs</p>
        
        <div className="bestseller-grid">
          {bestsellers.map((prod, idx) => {
            if (productsLoading) {
              return (
                <div key={`skeleton-${idx}`} className="skeleton-card">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-body">
                    <div className="skeleton-badge"></div>
                    <div className="skeleton-title"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-footer">
                      <div className="skeleton-price"></div>
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                </div>
              );
            }
            const defaultVariant = prod.variants?.[0] || { price: 0, weight_variant: '' };
            const wishlisted = isInWishlist ? isInWishlist(prod.id) : false;
            return (
              <div key={prod.id} className="card product-card" style={{ padding: 0, position: 'relative' }}>
                {/* Wishlist Heart */}
                {onToggleWishlist && (
                  <button
                    className={`wishlist-heart-btn spring-bounce ${wishlisted ? 'wishlisted' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleWishlist(prod); }}
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 5 }}
                    title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={20} fill={wishlisted ? 'var(--error)' : 'none'} color={wishlisted ? 'var(--error)' : '#666'} />
                  </button>
                )}
                <div className="product-image-container" style={{ position: 'relative', height: '220px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleProductClick(prod)}>
                  {prod.images && prod.images.length > 0 && prod.images[0] ? (
                    <img 
                      src={prod.images[0]} 
                      alt={prod.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fb = e.target.parentElement.querySelector('.product-image-fallback');
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="product-image-fallback"
                    style={{ 
                      display: prod.images && prod.images.length > 0 && prod.images[0] ? 'none' : 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}
                  >
                    <span style={{ fontSize: '3.5rem' }}>🌿</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--secondary)' }}>
                      {prod.category}
                    </span>
                  </div>
                </div>
                <div className="product-card-body" style={{ padding: '1.5rem' }}>
                  <span className="badge badge-category" style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}>{prod.category}</span>
                  <h3 className="product-title" style={{ fontFamily: 'var(--font-body)', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleProductClick(prod)}>{prod.name}</h3>
                  <p className="product-desc">{prod.description}</p>
                  
                  <div className="product-meta">
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Starts from</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                        ₹{defaultVariant.price} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-light)' }}>/ {defaultVariant.weight_variant}</span>
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={(e) => handleAddToCartLocal(prod, defaultVariant, e)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      {addedItem === `${prod.id}-${defaultVariant.id}` ? '✓ Added' : 'Add To Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleCategoryClick('')}
            style={{ fontSize: '1.05rem', padding: '0.9rem 2.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', boxShadow: 'var(--shadow-md)' }}
          >
            Shop Now <MoveRight size={18} />
          </button>
        </div>
      </section>

      {/* Recently Viewed Products */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <section className="container" style={{ marginBottom: '4rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>🕐 Recently Viewed</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '2rem' }}>Products you recently explored</p>
          
          <div className="recently-viewed-scroll">
            {recentlyViewed.map((prod) => (
              <div key={prod.id} className="recently-viewed-card" onClick={() => handleProductClick(prod)}>
                <div className="recently-viewed-card-img">
                  {prod.images && prod.images[0] ? (
                    <img src={prod.images[0]} alt={prod.name} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <span style={{ fontSize: '2.5rem' }}>🌿</span>
                  )}
                </div>
                <div className="recently-viewed-card-body">
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem', lineHeight: '1.2' }}>{prod.name}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                    ₹{prod.variants?.[0]?.price || '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Brand Story Snippet */}
      <section className="reveal-on-scroll" style={{ backgroundColor: '#FDF6EE', padding: '5rem 0', borderRadius: 'var(--radius-lg)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '1.5rem', lineHeight: '1.2' }}>Our Grandma's Kitchen Secret, Made Commercial!</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
              We started M & R Co. in our family kitchen. Disappointed by the faded colors and chalky fillers in store-bought masala, we began grinding Kashmiri Mirch and Haldi in stone mortars for our own family meals. 
            </p>
            <p style={{ color: 'var(--text-light)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Word spread. Neighbors asked for our special Garam Masala and Biryani blends. Today, we still process spices in small batches with the exact same recipe, providing standard compliance without losing our handmade soul.
            </p>
            <button className="btn btn-secondary" onClick={() => setCurrentTab('about')}>
              Read Full Brand Story
            </button>
          </div>
          <div style={{ position: 'relative', height: '350px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <img src="/images/grandma_kitchen.png" alt="Grandma's Kitchen" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white', padding: '2rem 1rem 1rem 1rem', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '0.25rem', fontSize: '1.2rem', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>"Swaad aur Khushboo Ka Saccha संगम!"</h3>
              <p style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.9 }}>- Verified by over 500+ households in Noida & Delhi NCR.</p>
            </div>
          </div>
        </div>
      </section>
      {/* How We Make It Section */}
      <section className="container reveal-on-scroll" style={{ marginBottom: '5rem', marginTop: '5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2.5rem', color: 'var(--text)' }}>How We Make It</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '3rem', fontSize: '1.1rem' }}>Our traditional 4-step process for preserving volatile oils & rich aroma.</p>
        
        <div className="process-grid">
          <div className="process-step">
            <span className="process-step-number">01</span>
            <div className="process-icon">🌱</div>
            <h4>Ethical Sourcing</h4>
            <p>Hand-picking premium raw spices directly from selected organic farms in Kerala & Rajasthan.</p>
          </div>
          <div className="process-step">
            <span className="process-step-number">02</span>
            <div className="process-icon">☀️</div>
            <h4>Shade & Sun Drying</h4>
            <p>Naturally sun-drying spices on clean raised beds to seal in original flavor oils & prevent mold.</p>
          </div>
          <div className="process-step">
            <span className="process-step-number">03</span>
            <div className="process-icon">⚙️</div>
            <h4>Cold Stone Grinding</h4>
            <p>Traditional slow stone grinding at low temperatures to prevent heat loss of delicate volatile oils.</p>
          </div>
          <div className="process-step">
            <span className="process-step-number">04</span>
            <div className="process-icon">📦</div>
            <h4>Aroma Lock Packing</h4>
            <p>Sealing in food-grade, multi-layer zip pouches immediately to preserve farm-fresh goodness.</p>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="reveal-on-scroll" style={{ backgroundColor: '#FFFDF9', padding: '5rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>What Our Customers Say</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '3rem' }}>Reviews from verified home chefs and culinary experts.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {(testimonials.length > 0 ? testimonials : [
              {
                user_name: 'Sunita R.',
                comment: 'The Haldi from M & R Co. has an incredible vibrant color and aroma that I haven\'t seen in commercial brands for years. It actually tastes like the haldi my grandmother used to grind!',
                rating: 5,
                product_name: 'Lakadong Haldi (Turmeric) Powder'
              },
              {
                user_name: 'Karan M.',
                comment: 'Their Garam Masala changed my cooking completely. Just a pinch is enough to elevate an entire dish. It\'s potent, aromatic, and you can tell it\'s fresh.',
                rating: 5,
                product_name: 'Special Garam Masala'
              },
              {
                user_name: 'Anita D.',
                comment: 'I ordered the Biryani combo. The shipping was fast and the packaging was excellent. The taste is incredibly authentic. Will order again!',
                rating: 4,
                product_name: 'Royal Biryani Masala Combo'
              }
            ]).map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <div style={{ display: 'flex', gap: '0.2rem', color: '#F1C40F', marginBottom: '1rem' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} fill={i < t.rating ? 'currentColor' : 'none'} color="#F1C40F" />
                  ))}
                </div>
                <p style={{ fontStyle: 'italic', color: 'var(--text)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  "{t.comment}"
                </p>
                <div style={{ fontWeight: 'bold' }}>{t.user_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  Verified Buyer {t.product_name ? `for ${t.product_name}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="container reveal-on-scroll">
        <div className="newsletter-section">
          <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Join the Spice Club</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>Subscribe to get 10% off your first order, exclusive recipes, and early access to new blends.</p>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              value={subscribeEmail}
              onChange={(e) => setSubscribeEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubscribe(); }}
            />
            <button type="button" onClick={handleSubscribe}>Subscribe</button>
          </div>
        </div>
      </section>
    </div>
  );
}
