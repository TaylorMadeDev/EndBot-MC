import React, { useState } from 'react';
import '../styles/marketplace.css';

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Items', icon: 'fa-th' },
    { id: 'accounts', label: 'Accounts', icon: 'fa-user-circle' },
    { id: 'addons', label: 'Addons', icon: 'fa-puzzle-piece' },
    { id: 'macros', label: 'Macros', icon: 'fa-project-diagram' },
    { id: 'themes', label: 'Themes', icon: 'fa-palette' },
  ];

  const items = [
    {
      id: 1,
      type: 'accounts',
      name: 'Premium Minecraft Account',
      description: 'Full access premium Minecraft account with name change available',
      price: 29.99,
      rating: 4.8,
      reviews: 342,
      image: 'fa-user-circle',
      badge: 'Premium',
      stock: 15,
      seller: 'MineStore',
    },
    {
      id: 2,
      type: 'accounts',
      name: 'Hypixel Ready Account',
      description: 'Level 50+ Hypixel account with VIP rank included',
      price: 49.99,
      rating: 4.9,
      reviews: 256,
      image: 'fa-star',
      badge: 'Featured',
      stock: 8,
      seller: 'ProAccounts',
    },
    {
      id: 3,
      type: 'addons',
      name: 'Advanced Auto-Farm',
      description: 'Intelligent farming bot with crop detection and optimization',
      price: 19.99,
      rating: 4.7,
      reviews: 523,
      image: 'fa-seedling',
      badge: 'Popular',
      stock: 999,
      seller: 'BotMasters',
    },
    {
      id: 4,
      type: 'addons',
      name: 'Combat Pro Addon',
      description: 'Enhanced PvP capabilities with combo tracking and analysis',
      price: 24.99,
      rating: 4.6,
      reviews: 421,
      image: 'fa-crosshairs',
      stock: 999,
      seller: 'CombatPro',
    },
    {
      id: 5,
      type: 'macros',
      name: 'Mining Macro Pack',
      description: '10+ pre-built mining macros for efficient resource gathering',
      price: 14.99,
      rating: 4.5,
      reviews: 687,
      image: 'fa-gem',
      badge: 'Best Value',
      stock: 999,
      seller: 'MacroHub',
    },
    {
      id: 6,
      type: 'macros',
      name: 'Building Templates',
      description: 'Professional building macros with instant structure placement',
      price: 17.99,
      rating: 4.8,
      reviews: 234,
      image: 'fa-cubes',
      stock: 999,
      seller: 'BuildCraft',
    },
    {
      id: 7,
      type: 'themes',
      name: 'Dark Nebula Theme',
      description: 'Beautiful dark theme with purple and pink gradients',
      price: 9.99,
      rating: 4.9,
      reviews: 891,
      image: 'fa-moon',
      badge: 'New',
      stock: 999,
      seller: 'ThemeStore',
    },
    {
      id: 8,
      type: 'themes',
      name: 'Ocean Breeze Theme',
      description: 'Calming blue and cyan color scheme for long sessions',
      price: 9.99,
      rating: 4.7,
      reviews: 456,
      image: 'fa-water',
      stock: 999,
      seller: 'ThemeStore',
    },
    {
      id: 9,
      type: 'addons',
      name: 'Anti-AFK System',
      description: 'Stay online 24/7 with intelligent anti-detection movement',
      price: 12.99,
      rating: 4.8,
      reviews: 1024,
      image: 'fa-shield-alt',
      badge: 'Popular',
      stock: 999,
      seller: 'SecurityPro',
    },
    {
      id: 10,
      type: 'accounts',
      name: 'Alt Account Bundle (5x)',
      description: 'Pack of 5 premium Minecraft accounts at discounted price',
      price: 99.99,
      rating: 4.9,
      reviews: 178,
      image: 'fa-users',
      badge: 'Bundle',
      stock: 12,
      seller: 'BulkAccounts',
    },
  ];

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.type === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="marketplace-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-store"></i> Marketplace
          </h1>
          <p className="page-subtitle">Discover premium accounts, addons, macros and more</p>
        </div>
        <div className="page-actions">
          <button className="btn ghost">
            <i className="fas fa-heart"></i>
            My Wishlist
          </button>
          <button className="btn primary">
            <i className="fas fa-shopping-cart"></i>
            Cart (0)
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="marketplace-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search for accounts, addons, macros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <i className={`fas ${cat.icon}`}></i>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="marketplace-stats">
        <div className="stat-item">
          <i className="fas fa-box"></i>
          <span>{filteredItems.length} Items Available</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-fire"></i>
          <span>Hot Deals Today</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-shield-alt"></i>
          <span>Buyer Protection</span>
        </div>
      </div>

      {/* Items Grid */}
      <div className="marketplace-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="marketplace-card">
            {item.badge && (
              <div className={`item-badge badge-${item.badge.toLowerCase().replace(' ', '-')}`}>
                {item.badge}
              </div>
            )}
            
            <div className="item-icon">
              <i className={`fas ${item.image}`}></i>
            </div>

            <div className="item-content">
              <div className="item-header">
                <h3 className="item-name">{item.name}</h3>
                <div className="item-rating">
                  <i className="fas fa-star"></i>
                  <span>{item.rating}</span>
                  <span className="review-count">({item.reviews})</span>
                </div>
              </div>

              <p className="item-description">{item.description}</p>

              <div className="item-meta">
                <div className="seller-info">
                  <i className="fas fa-store-alt"></i>
                  <span>{item.seller}</span>
                </div>
                <div className={`stock-info ${item.stock < 20 ? 'low' : ''}`}>
                  <i className="fas fa-box"></i>
                  <span>{item.stock > 99 ? '99+' : item.stock} in stock</span>
                </div>
              </div>

              <div className="item-footer">
                <div className="item-price">
                  <span className="currency">$</span>
                  <span className="amount">{item.price.toFixed(2)}</span>
                </div>
                <div className="item-actions">
                  <button className="btn-icon" title="Add to wishlist">
                    <i className="far fa-heart"></i>
                  </button>
                  <button className="btn primary">
                    <i className="fas fa-shopping-cart"></i>
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-search empty-icon"></i>
          <h3 className="empty-title">No items found</h3>
          <p className="empty-description">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
