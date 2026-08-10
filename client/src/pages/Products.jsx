import { useState } from 'react';
import { Search, Flame, Heart, Eye, BarChart3 } from 'lucide-react';

export default function Products({ products, productsLoading, onAddToCart, categoryFilter, setCategoryFilter, onSelectProduct, setCurrentTab, searchQuery, setSearchQuery, onToggleWishlist, isInWishlist, onToggleCompare, isInCompare, onQuickView, recentlyViewed, onTrackView }) {
  const [spiceFilter, setSpiceFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState(''); // e.g. '0-200', '200-500', '500+'
  const [sortOrder, setSortOrder] = useState(''); // 'price_asc', 'price_desc', 'name_asc', 'rating'
  const [selectedVariants, setSelectedVariants] = useState({}); // { productId: variantId }
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync internal search with any updates if needed
  const categories = ['Powders', 'Whole', 'Blends', 'Combos'];

  // Apply filters locally on the products array
  const filteredProducts = products
    .filter(p => {
      const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
      const matchesSpice = spiceFilter !== '' ? p.spice_level === parseInt(spiceFilter) : true;
      const matchesSearch = p.name.toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                            p.description.toLowerCase().includes((searchQuery || '').toLowerCase());
      const minPrice = p.variants?.[0]?.price || 0;
      let matchesPrice = true;
      if (priceFilter === '0-200') matchesPrice = minPrice <= 200;
      else if (priceFilter === '200-500') matchesPrice = minPrice > 200 && minPrice <= 500;
      else if (priceFilter === '500+') matchesPrice = minPrice > 500;
      return matchesCategory && matchesSpice && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      const aPrice = a.variants?.[0]?.price || 0;
      const bPrice = b.variants?.[0]?.price || 0;
      if (sortOrder === 'price_asc') return aPrice - bPrice;
      if (sortOrder === 'price_desc') return bPrice - aPrice;
      if (sortOrder === 'name_asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0);
      return 0;
    });


  const [addedItem, setAddedItem] = useState(null);

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

  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: parseInt(variantId)
    }));
  };

  const handleProductClick = (product) => {
    if (onTrackView) onTrackView(product);
    onSelectProduct(product.id);
    setCurrentTab('product-detail');
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Our Spice Catalog</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Sun-dried and slow-ground. Choose from single spices, whole masale, or royal blends.</p>

      <div className="products-layout">
        {/* Mobile Filters Toggle */}
        <div className="mobile-filters-toggle">
          <button 
            className="btn btn-outline" 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.6rem 0.5rem' }}
          >
            🔍 {showMobileFilters ? 'Hide Filters' : 'Show Filters & Search'}
          </button>
        </div>

        {/* Sidebar Filters */}
        <div className={`products-sidebar ${showMobileFilters ? 'mobile-show' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search box */}
          <div className="filter-card">
            <div className="filter-title">Search Spices</div>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search..." 
                value={searchQuery || ''}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }} 
              />
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            </div>
          </div>

          {/* Categories */}
          <div className="filter-card">
            <div className="filter-title">Categories</div>
            <div 
              className="filter-option" 
              onClick={() => setCategoryFilter('')}
              style={{ fontWeight: categoryFilter === '' ? 'bold' : 'normal', color: categoryFilter === '' ? 'var(--secondary)' : 'var(--text)' }}
            >
              All Categories
            </div>
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="filter-option" 
                onClick={() => setCategoryFilter(cat)}
                style={{ fontWeight: categoryFilter === cat ? 'bold' : 'normal', color: categoryFilter === cat ? 'var(--secondary)' : 'var(--text)' }}
              >
                {cat}
              </div>
            ))}
          </div>

          {/* Spice Level */}
          <div className="filter-card">
            <div className="filter-title">Spice Heat Level</div>
            <div 
              className="filter-option" 
              onClick={() => setSpiceFilter('')}
              style={{ fontWeight: spiceFilter === '' ? 'bold' : 'normal', color: spiceFilter === '' ? 'var(--secondary)' : 'var(--text)' }}
            >
              All Heat Levels
            </div>
            {[0, 1, 2, 3, 4, 5].map((lvl) => (
              <div 
                key={lvl} 
                className="filter-option" 
                onClick={() => setSpiceFilter(lvl.toString())}
                style={{ fontWeight: spiceFilter === lvl.toString() ? 'bold' : 'normal', color: spiceFilter === lvl.toString() ? 'var(--secondary)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Level {lvl}</span>
                {lvl > 0 ? (
                  <span style={{ display: 'flex' }}>
                    {Array.from({ length: lvl }).map((_, i) => (
                      <Flame key={i} size={12} fill="var(--secondary)" color="var(--secondary)" />
                    ))}
                  </span>
                ) : <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>(No Heat)</span>}
              </div>
            ))}
          </div>

          {/* Price Range Filter */}
          <div className="filter-card">
            <div className="filter-title">Price Range</div>
            {[['', 'All Prices'], ['0-200', 'Under ₹200'], ['200-500', '₹200 – ₹500'], ['500+', 'Above ₹500']].map(([val, label]) => (
              <div 
                key={val}
                className="filter-option" 
                onClick={() => setPriceFilter(val)}
                style={{ fontWeight: priceFilter === val ? 'bold' : 'normal', color: priceFilter === val ? 'var(--secondary)' : 'var(--text)' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Sort Order */}
          <div className="filter-card">
            <div className="filter-title">Sort By</div>
            {[['', 'Default'], ['price_asc', 'Price: Low to High'], ['price_desc', 'Price: High to Low'], ['name_asc', 'Name: A to Z'], ['rating', 'Top Rated']].map(([val, label]) => (
              <div 
                key={val}
                className="filter-option" 
                onClick={() => setSortOrder(val)}
                style={{ fontWeight: sortOrder === val ? 'bold' : 'normal', color: sortOrder === val ? 'var(--secondary)' : 'var(--text)' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Clear All Filters */}
          {(categoryFilter || spiceFilter || priceFilter || sortOrder || searchQuery) && (
            <button 
              className="btn btn-outline"
              onClick={() => { setCategoryFilter(''); setSpiceFilter(''); setPriceFilter(''); setSortOrder(''); if (setSearchQuery) setSearchQuery(''); }}
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              ✕ Reset All Filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        <div>
          {productsLoading ? (
            <div className="products-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
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
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', maxWidth: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌶️</div>
              <h3>No Spices Found</h3>
              <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>Try clearing filters or search queries to discover more spices.</p>
              <button 
                className="btn btn-primary" 
                onClick={() => { setCategoryFilter(''); setSpiceFilter(''); if (setSearchQuery) setSearchQuery(''); }}
                style={{ marginTop: '1.5rem' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((prod) => {
                const activeVariantId = selectedVariants[prod.id];
                const activeVariant = prod.variants.find(v => v.id === activeVariantId) || prod.variants[0] || { price: 0, weight_variant: '', stock: 0 };
                const wishlisted = isInWishlist ? isInWishlist(prod.id) : false;
                const inCompare = isInCompare ? isInCompare(prod.id) : false;
                
                return (
                  <div key={prod.id} className="card product-card" style={{ padding: 0, position: 'relative' }}>
                    {/* Wishlist Heart */}
                    {onToggleWishlist && (
                      <button
                        className={`wishlist-heart-btn spring-bounce ${wishlisted ? 'wishlisted' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleWishlist(prod); }}
                        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 5 }}
                        title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart size={18} fill={wishlisted ? 'var(--error)' : 'none'} color={wishlisted ? 'var(--error)' : '#666'} />
                      </button>
                    )}

                    {/* Quick View Button */}
                    {onQuickView && (
                      <button
                        className="wishlist-heart-btn spring-bounce"
                        onClick={(e) => { e.stopPropagation(); onQuickView(prod); }}
                        style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 5 }}
                        title="Quick View"
                      >
                        <Eye size={18} color="#666" />
                      </button>
                    )}

                    <div className="product-image-container" onClick={() => handleProductClick(prod)} style={{ cursor: 'pointer', position: 'relative', height: '200px', overflow: 'hidden' }}>
                      <span className="product-discount-badge">
                        15% OFF
                      </span>
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
                        {prod.spice_level > 3 && (
                          <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'var(--tertiary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            HOT 🔥
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="product-card-body" style={{ padding: '1.25rem' }}>
                      <span className="badge badge-category" style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}>{prod.category}</span>
                      
                      <h3 
                        className="product-title" 
                        onClick={() => handleProductClick(prod)} 
                        style={{ cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: '600' }}
                      >
                        {prod.name}
                      </h3>
                      
                      <p className="product-desc">{prod.description}</p>
                      
                      {/* Variant Dropdown */}
                      <div className="form-group" style={{ marginBottom: '1rem', marginTop: 'auto' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Select Weight Variant</label>
                        <select 
                          className="form-input" 
                          value={activeVariantId || ''} 
                          onChange={e => handleVariantChange(prod.id, e.target.value)}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                        >
                          {prod.variants.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.weight_variant} - ₹{v.price} {v.stock === 0 ? '(Out of stock)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="product-meta">
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                            ₹{activeVariant.price}
                          </div>
                          {activeVariant.stock < 10 && activeVariant.stock > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'orange', fontWeight: 'bold' }}>
                              Only {activeVariant.stock} left!
                            </div>
                          )}
                          {activeVariant.stock === 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--error)', fontWeight: 'bold' }}>
                              Out of Stock
                            </div>
                          )}
                        </div>
                        
                        <button 
                          className="btn btn-primary" 
                          onClick={(e) => handleAddToCartLocal(prod, activeVariant, e)}
                          disabled={activeVariant.stock === 0}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          {addedItem === `${prod.id}-${activeVariant.id}` ? '✓ Added' : 'Add'}
                        </button>
                      </div>

                      {/* Compare Checkbox */}
                      {onToggleCompare && (
                        <label className="compare-checkbox-wrap spring-bounce">
                          <input 
                            type="checkbox" 
                            checked={inCompare} 
                            onChange={() => onToggleCompare(prod)} 
                          />
                          <BarChart3 size={12} />
                          Compare
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recently Viewed in Products Page */}
          {recentlyViewed && recentlyViewed.length > 0 && (
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>🕐 Recently Viewed</h3>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
