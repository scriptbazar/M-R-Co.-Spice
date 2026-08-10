import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Apple, Landmark, Truck, FileBarChart2, ShieldAlert, Plus, Edit3, Trash2, Eye, Download, ToggleLeft, ToggleRight, Users, FileText, CheckCircle, LogOut, Settings, Tag } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function AdminDashboard({ user, onLogout, storeConfig, setStoreConfig }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, lowStock: 0 });
  const [graphData, setGraphData] = useState([]);
  const [lowStockDetails, setLowStockDetails] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingCustomerDetails, setIsLoadingCustomerDetails] = useState(false);
  const [prodImageBase64, setProdImageBase64] = useState('');
  const [prodImageName, setProdImageName] = useState('');
  const [partners, setPartners] = useState([]);
  const [gateways, setGateways] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState({ categorySales: [], productSales: [], paymentSales: [] });

  // Settings state
  const [settingsFssai, setSettingsFssai] = useState('');
  const [settingsBrand, setSettingsBrand] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsPincode, setSettingsPincode] = useState('');
  const [settingsLogo, setSettingsLogo] = useState('');
  const [settingsFavicon, setSettingsFavicon] = useState('');
  const [settingsInstagram, setSettingsInstagram] = useState('');
  const [settingsFacebook, setSettingsFacebook] = useState('');
  const [settingsTwitter, setSettingsTwitter] = useState('');
  const [settingsYoutube, setSettingsYoutube] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [logoName, setLogoName] = useState('');
  const [faviconBase64, setFaviconBase64] = useState('');
  const [faviconName, setFaviconName] = useState('');
  const [pages, setPages] = useState([]);
  
  // Shiprocket integration states
  const [shiprocketActive, setShiprocketActive] = useState(false);
  const [shiprocketEmail, setShiprocketEmail] = useState('');
  const [shiprocketPassword, setShiprocketPassword] = useState('');
  const [shiprocketWebhookToken, setShiprocketWebhookToken] = useState('');
  const [simulatorOrderAwb, setSimulatorOrderAwb] = useState('');
  const [simulatorStatusId, setSimulatorStatusId] = useState(17); // Default: Delivered
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageContent, setPageContent] = useState('');

  // Coupons management states
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponFormCode, setCouponFormCode] = useState('');
  const [couponFormType, setCouponFormType] = useState('percentage');
  const [couponFormValue, setCouponFormValue] = useState(10);
  const [couponFormMinAmount, setCouponFormMinAmount] = useState(0);
  const [couponFormMaxDiscount, setCouponFormMaxDiscount] = useState(0);

  // Filter orders
  const [orderFilter, setOrderFilter] = useState('');
  
  // Selected Order detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [assignTracking, setAssignTracking] = useState('');

  // Product Form modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means 'Add Product'
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('Powders');
  const [prodDesc, setProdDesc] = useState('');
  const [prodIng, setProdIng] = useState('');
  const [prodMade, setProdMade] = useState('');
  const [prodSpice, setProdSpice] = useState(0);
  const [prodVariants, setProdVariants] = useState([{ weight_variant: '100g', price: 100, stock: 50 }]);
  const [prodComboItems, setProdComboItems] = useState([]);

  // Gateway edit state
  const [editingGateway, setEditingGateway] = useState(''); // 'Razorpay', etc.
  const [gatewayActive, setGatewayActive] = useState(false);
  const [gatewayKeys, setGatewayKeys] = useState({});

  // Sync storeConfig to local state when active tab is settings or config arrives
  useEffect(() => {
    if (storeConfig) {
      if (storeConfig.fssai) setSettingsFssai(storeConfig.fssai);
      if (storeConfig.brand) setSettingsBrand(storeConfig.brand);
      if (storeConfig.email) setSettingsEmail(storeConfig.email);
      if (storeConfig.phone) setSettingsPhone(storeConfig.phone);
      if (storeConfig.address) setSettingsAddress(storeConfig.address);
      if (storeConfig.pincode) setSettingsPincode(storeConfig.pincode);
      if (storeConfig.logo) setSettingsLogo(storeConfig.logo);
      if (storeConfig.favicon) setSettingsFavicon(storeConfig.favicon);
      setSettingsInstagram(storeConfig.instagram || '');
      setSettingsFacebook(storeConfig.facebook || '');
      setSettingsTwitter(storeConfig.twitter || '');
      setSettingsYoutube(storeConfig.youtube || '');
    }
  }, [storeConfig]);

  useEffect(() => {
    fetchDashboardStats();
    fetchOrders();
    fetchProducts();
    fetchPartners();
    fetchGatewayConfigs();
    fetchShiprocketConfig();
    fetchTransactions();
    fetchReports();
    if (activeTab === 'users') {
      fetchCustomers();
    }
    if (activeTab === 'pages') {
      fetchPages();
    }
    if (activeTab === 'coupons') {
      fetchAdminCoupons();
    }
  }, [activeTab]);

  const fetchDashboardStats = () => {
    fetch('/api/admin/dashboard-stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics);
        if (data.graphData) setGraphData(data.graphData);
        if (data.lowStockDetails) setLowStockDetails(data.lowStockDetails);
      });
  };

  const fetchOrders = () => {
    fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []));
  };

  const fetchProducts = () => {
    fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []));
  };

  const fetchPartners = () => {
    fetch('/api/admin/delivery-partners', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setPartners(Array.isArray(data) ? data : []));
  };

  const fetchGatewayConfigs = () => {
    fetch('/api/admin/gateways', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setGateways(data || {}));
  };

  const fetchShiprocketConfig = () => {
    fetch('/api/shiprocket/config', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setShiprocketActive(data.active);
          setShiprocketEmail(data.email);
          setShiprocketWebhookToken(data.webhook_token);
        }
      })
      .catch(err => console.error('Failed to load Shiprocket config:', err));
  };

  const fetchTransactions = () => {
    fetch('/api/admin/transactions', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setTransactions(Array.isArray(data) ? data : []));
  };

  const fetchReports = () => {
    fetch('/api/admin/reports', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        if (data) setReports(data);
      });
  };

  const fetchPages = () => {
    fetch('/api/pages')
      .then(res => res.json())
      .then(data => setPages(Array.isArray(data) ? data : []));
  };

  const fetchAdminCoupons = () => {
    fetch('/api/admin/coupons', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => setCoupons(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching admin coupons:', err));
  };

  const handleToggleCouponStatus = (couponId, currentStatus) => {
    fetch(`/api/admin/coupons/${couponId}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ is_active: currentStatus === 1 ? 0 : 1 })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Coupon status toggled');
        fetchAdminCoupons();
      })
      .catch(err => showToast('Failed to toggle coupon'));
  };

  const handleDeleteCoupon = (couponId, code) => {
    if (confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          showToast(data.message || 'Coupon deleted successfully');
          fetchAdminCoupons();
        })
        .catch(err => showToast('Failed to delete coupon'));
    }
  };

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    if (!couponFormCode.trim()) return showToast('Code is required');
    if (couponFormValue <= 0) return showToast('Discount value must be greater than 0');

    const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons';
    const method = editingCoupon ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        code: couponFormCode.trim().toUpperCase(),
        discount_type: couponFormType,
        discount_value: couponFormValue,
        min_cart_amount: couponFormMinAmount,
        max_discount: couponFormType === 'flat' ? null : couponFormMaxDiscount
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit coupon');
        return data;
      })
      .then(data => {
        showToast(data.message || 'Coupon saved successfully');
        setShowCouponModal(false);
        fetchAdminCoupons();
      })
      .catch(err => showToast(err.message));
  };

  const handlePageSelect = (slug) => {
    fetch(`/api/pages/${slug}`)
      .then(res => res.json())
      .then(data => {
        setSelectedPage(data);
        setPageContent(data.content);
      });
  };

  const handleSavePage = (e) => {
    e.preventDefault();
    if (!selectedPage) return;
    
    fetch(`/api/pages/${selectedPage.slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ content: pageContent })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Page updated successfully');
        fetchPages();
      })
      .catch(err => showToast('Failed to save page'));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    
    const settingsPayload = [
      { key: 'fssai_license_number', value: settingsFssai },
      { key: 'brand_name', value: settingsBrand },
      { key: 'contact_email', value: settingsEmail },
      { key: 'contact_phone', value: settingsPhone },
      { key: 'store_address', value: settingsAddress },
      { key: 'store_pincode', value: settingsPincode },
      { key: 'social_instagram', value: settingsInstagram },
      { key: 'social_facebook', value: settingsFacebook },
      { key: 'social_twitter', value: settingsTwitter },
      { key: 'social_youtube', value: settingsYoutube }
    ];

    if (logoBase64) {
      settingsPayload.push({ key: 'store_logo', value: logoBase64 });
    }
    if (faviconBase64) {
      settingsPayload.push({ key: 'store_favicon', value: faviconBase64 });
    }

    fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ settings: settingsPayload })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message || 'Settings updated successfully');
        
        setLogoBase64('');
        setLogoName('');
        setFaviconBase64('');
        setFaviconName('');

        // Fetch refreshed config to update the frontend state and views dynamically
        fetch('/api/status')
          .then(res => res.json())
          .then(config => {
            if (setStoreConfig) setStoreConfig(config);
          })
          .catch(console.error);
      })
      .catch(err => showToast('Failed to save settings: ' + err.message));
  };

  const handleSaveShiprocketSettings = (e) => {
    e.preventDefault();
    fetch('/api/shiprocket/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        active: shiprocketActive,
        email: shiprocketEmail,
        password: shiprocketPassword
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          showToast(data.error);
        } else {
          showToast(data.message || 'Shiprocket configurations saved successfully.');
          setShiprocketPassword('');
          fetchShiprocketConfig();
        }
      })
      .catch(err => showToast('Failed to save Shiprocket configurations: ' + err.message));
  };

  const handleRegenerateWebhookToken = () => {
    if (!window.confirm('Are you sure you want to regenerate the webhook token? Existing integrations on Shiprocket dashboard using the old URL will stop working.')) {
      return;
    }
    fetch('/api/shiprocket/config/regenerate-token', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          showToast(data.error);
        } else {
          showToast(data.message || 'Webhook token regenerated.');
          setShiprocketWebhookToken(data.token);
        }
      })
      .catch(err => showToast('Failed to regenerate webhook token: ' + err.message));
  };

  const handleSimulateWebhook = (e) => {
    e.preventDefault();
    if (!simulatorOrderAwb) {
      showToast('Please select an order to simulate.');
      return;
    }
    setIsSimulatingWebhook(true);
    fetch('/api/shiprocket/simulate-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        awb: simulatorOrderAwb,
        status_id: parseInt(simulatorStatusId)
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsSimulatingWebhook(false);
        if (data.error) {
          showToast(data.error);
        } else {
          showToast(data.message || 'Webhook simulation completed successfully.');
          fetchOrders(); // Refresh orders queue
        }
      })
      .catch(err => {
        setIsSimulatingWebhook(false);
        showToast('Failed to simulate webhook: ' + err.message);
      });
  };

  const fetchCustomers = () => {
    setIsLoadingCustomers(true);
    fetch('/api/admin/customers', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        setCustomers(Array.isArray(data) ? data : []);
        setIsLoadingCustomers(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingCustomers(false);
      });
  };

  const handleViewCustomer = (customerId) => {
    setIsLoadingCustomerDetails(true);
    fetch(`/api/admin/customers/${customerId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(custData => {
        setSelectedCustomer(custData);
        return fetch(`/api/admin/customers/${customerId}/orders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      })
      .then(res => res.json())
      .then(ordersData => {
        setCustomerOrders(Array.isArray(ordersData) ? ordersData : []);
        setIsLoadingCustomerDetails(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingCustomerDetails(false);
      });
  };

  const handleUpdateCustomerStatus = (customerId, newStatus) => {
    fetch(`/api/admin/customers/${customerId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message);
        fetchCustomers();
        setSelectedCustomer(prev => prev ? { ...prev, status: newStatus } : null);
      });
  };

  const handleDeleteCustomer = (customerId, customerName) => {
    if (confirm(`WARNING: Deleting "${customerName}" will permanently remove all their addresses, reviews, and order histories from the database. This action is irreversible.\n\nAre you sure you want to delete this account?`)) {
      fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          showToast(data.message);
          setSelectedCustomer(null);
          setCustomerOrders([]);
          setSelectedCustomerOrder(null);
          fetchCustomers();
        });
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message);
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      });
  };

  const handleAssignDelivery = (e) => {
    e.preventDefault();
    if (!assignPartnerId) return showToast('Select delivery partner');

    fetch(`/api/admin/orders/${selectedOrder.id}/delivery`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        delivery_partner_id: assignPartnerId,
        tracking_number: assignTracking
      })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message);
        fetchOrders();
        setSelectedOrder(null);
        setAssignPartnerId('');
        setAssignTracking('');
      });
  };

  const handlePushToShiprocket = (orderId) => {
    if (!window.confirm('Are you sure you want to push this order to Shiprocket and generate tracking AWB?')) return;
    
    showToast('Pushing order to Shiprocket...');
    
    fetch('/api/shiprocket/create-shipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ order_id: orderId })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to push order to Shiprocket');
        return data;
      })
      .then(data => {
        showToast(data.message || `Successfully pushed to Shiprocket! AWB: ${data.awb_code}`);
        fetchOrders();
        setSelectedOrder(null);
      })
      .catch(err => {
        showToast(err.message);
      });
  };

  // Product CRUD Handlers
  const handleOpenProductModal = (prod = null) => {
    setEditingProduct(prod);
    if (prod) {
      setProdName(prod.name);
      setProdCat(prod.category);
      setProdDesc(prod.description);
      setProdIng(prod.ingredients);
      setProdMade(prod.how_its_made);
      setProdSpice(prod.spice_level);
      setProdVariants(prod.variants.map(v => ({ weight_variant: v.weight_variant, price: v.price, stock: v.stock })));
      setProdComboItems(prod.combo_items ? prod.combo_items.map(ci => ({ product_id: ci.product_id, quantity: ci.quantity })) : []);
    } else {
      setProdName('');
      setProdCat('Powders');
      setProdDesc('');
      setProdIng('');
      setProdMade('');
      setProdSpice(0);
      setProdVariants([{ weight_variant: '100g', price: 100, stock: 50 }]);
      setProdComboItems([]);
    }
    setShowProductModal(true);
  };

  const handleAddVariantRow = () => {
    setProdVariants(prev => [...prev, { weight_variant: '100g', price: 100, stock: 50 }]);
  };

  const handleRemoveVariantRow = (idx) => {
    setProdVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const handleVariantFieldChange = (idx, field, val) => {
    setProdVariants(prev => prev.map((v, i) => {
      if (i === idx) {
        return { ...v, [field]: val };
      }
      return v;
    }));
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (!prodName.trim()) return showToast('Name required');
    if (!prodVariants.length) return showToast('At least one weight variant is required');
    if (prodCat === 'Combos' && !prodComboItems.some(item => item.product_id)) {
      return showToast('At least one component product is required for Combos');
    }

    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: prodName,
        category: prodCat,
        description: prodDesc,
        ingredients: prodIng,
        how_its_made: prodMade,
        spice_level: prodSpice,
        variants: prodVariants,
        imageBase64: prodImageBase64,
        imageName: prodImageName,
        comboItems: prodCat === 'Combos' ? prodComboItems.filter(item => item.product_id) : []
      })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message);
        setProdImageBase64('');
        setProdImageName('');
        setShowProductModal(false);
        fetchProducts();
      });
  };

  const handleDeleteProduct = (prodId, prodName) => {
    if (confirm(`Are you sure you want to delete "${prodName}" spice profile?`)) {
      fetch(`/api/admin/products/${prodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          showToast(data.message);
          fetchProducts();
        });
    }
  };

  const handleToggleProductStatus = (prodId, currentStatus) => {
    fetch(`/api/admin/products/${prodId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ is_active: currentStatus === 1 ? 0 : 1 })
    })
      .then(res => res.json())
      .then(data => {
        showToast('Product status toggled');
        fetchProducts();
      });
  };

  // Gateway Edit
  const handleEditGateway = (name, config) => {
    setEditingGateway(name);
    setGatewayActive(config.active);
    setGatewayKeys(config.keys || {});
  };

  const handleSaveGateway = (e) => {
    e.preventDefault();
    fetch('/api/admin/gateways', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        gateway: editingGateway,
        active: gatewayActive,
        keys: gatewayKeys
      })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message);
        setEditingGateway('');
        fetchGatewayConfigs();
      });
  };

  const handleExportCSV = () => {
    // Generate CSV string from bestseller report
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Product Name,Category,Items Sold,Revenue (INR)\n';

    reports.productSales.forEach(p => {
      csvContent += `"${p.name}","${p.category}",${p.items_sold},${p.revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MR_Co_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for SVG graph rendering
  const maxGraphVal = graphData.reduce((max, d) => Math.max(max, d.amount), 100);

  // Store Analytics computations
  const totalOrdersCount = orders.length;
  const paidOrdersCount = orders.filter(o => o.payment_status === 'Paid').length;
  const totalRevenueSum = orders.filter(o => o.payment_status === 'Paid').reduce((sum, o) => sum + o.total_amount, 0);
  const avgAOV = totalOrdersCount > 0 ? (orders.reduce((sum, o) => sum + o.total_amount, 0) / totalOrdersCount) : 0;
  const codCount = orders.filter(o => o.payment_method === 'COD').length;
  const onlineCount = totalOrdersCount - codCount;
  const gpsCount = orders.filter(o => o.ordered_lat && o.ordered_lon).length;
  const gpsPct = totalOrdersCount > 0 ? ((gpsCount / totalOrdersCount) * 100).toFixed(0) : 0;

  return (
    <div className="admin-layout">
      {/* Admin Sidebar Navigation */}
      <div className="admin-sidebar">
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>M & R Co. Admin</h3>
          <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-light)' }}>{user?.role} Access</span>
        </div>
        <ul className="admin-sidebar-menu">
          <li className={activeTab === 'dashboard' ? 'active' : ''}>
            <button onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
          </li>
          <li className={activeTab === 'orders' ? 'active' : ''}>
            <button onClick={() => setActiveTab('orders')}><ShoppingCart size={18} /> Orders Queue</button>
          </li>
          <li className={activeTab === 'products' ? 'active' : ''}>
            <button onClick={() => setActiveTab('products')}><Plus size={18} /> Spices Catalog</button>
          </li>
          {user?.role === 'admin' && (
            <>
              <li className={activeTab === 'users' ? 'active' : ''}>
                <button onClick={() => setActiveTab('users')}><Users size={18} /> Registered Users</button>
              </li>
              <li className={activeTab === 'gateways' ? 'active' : ''}>
                <button onClick={() => setActiveTab('gateways')}><Landmark size={18} /> Gateway Settings</button>
              </li>
              <li className={activeTab === 'delivery' ? 'active' : ''}>
                <button onClick={() => setActiveTab('delivery')}><Truck size={18} /> Delivery Partners</button>
              </li>
              <li className={activeTab === 'reports' ? 'active' : ''}>
                <button onClick={() => setActiveTab('reports')}><FileBarChart2 size={18} /> Sales Reports</button>
              </li>
              <li className={activeTab === 'pages' ? 'active' : ''}>
                <button onClick={() => setActiveTab('pages')}><FileText size={18} /> Web Pages (CMS)</button>
              </li>
              <li className={activeTab === 'coupons' ? 'active' : ''}>
                <button onClick={() => setActiveTab('coupons')}><Tag size={18} /> Coupons (Offers)</button>
              </li>
              <li className={activeTab === 'settings' ? 'active' : ''}>
                <button onClick={() => setActiveTab('settings')}><Settings size={18} /> Settings</button>
              </li>
            </>
          )}
          <li style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button 
              onClick={onLogout} 
              style={{ color: 'var(--error)', borderTop: '1px solid var(--border)', paddingTop: '1rem', width: '100%' }}
            >
              <LogOut size={18} /> Secure Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Main Panel Content */}
      <div className="admin-main">
        {/* TAB 1: DASHBOARD METRICS */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Store Analytics</h2>
            
            <div className="admin-grid">
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>TOTAL REVENUE</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--success)' }}>₹{metrics.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>TOTAL ORDERS</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{metrics.totalOrders}</span>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>ACTIVE ORDER QUEUE</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'orange' }}>{metrics.pendingOrders}</span>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: metrics.lowStock > 0 ? '4px solid var(--error)' : 'none' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>LOW STOCK ITEMS</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: metrics.lowStock > 0 ? 'var(--error)' : 'var(--text)' }}>{metrics.lowStock}</span>
              </div>
            </div>

            {/* Sales trend & low stock list */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem', marginTop: '2rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>Revenue Trend (Last 7 Days)</h3>
                
                {graphData.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', padding: '2rem 0', textAlign: 'center' }}>No sales records found in graph scope.</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '1rem', padding: '1rem 0' }}>
                    {graphData.map((d, idx) => {
                      const heightPercent = `${(d.amount / maxGraphVal) * 80 + 10}%`;
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>₹{d.amount}</span>
                          <div className="chart-bar" style={{ height: heightPercent, width: '100%', minWidth: '35px' }}></div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>{d.date.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-body)', color: lowStockDetails.length > 0 ? 'var(--error)' : 'inherit' }}>
                  <ShieldAlert size={18} /> Low Stock Warnings
                </h3>
                {lowStockDetails.length === 0 ? (
                  <div style={{ color: 'var(--success)', fontSize: '0.85rem', padding: '1rem 0' }}>
                    ✔ All spice variants have healthy stock levels!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {lowStockDetails.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                        <span><b>{item.name}</b> ({item.weight_variant})</span>
                        <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>Qty: {item.stock} left</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS QUEUE */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem' }}>Order Queue Operations</h2>
              <select className="form-input" value={orderFilter} onChange={e => setOrderFilter(e.target.value)} style={{ width: '200px', padding: '0.4rem' }}>
                <option value="">All Orders</option>
                <option value="Placed">Placed Queue</option>
                <option value="Confirmed">Confirmed Queue</option>
                <option value="Packed">Packed Queue</option>
                <option value="Shipped">Shipped Queue</option>
                <option value="Delivered">Delivered Queue</option>
                <option value="Cancelled">Cancelled Queue</option>
              </select>
            </div>

            <div className="card table-responsive" style={{ padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Customer Details</th>
                    <th>Ordered Date</th>
                    <th>Subtotal</th>
                    <th>State</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter(o => !orderFilter || o.status === orderFilter)
                    .map(order => (
                      <tr key={order.id}>
                        <td><b>{order.order_number}</b></td>
                        <td>
                          <div>{order.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{order.customer_phone}</div>
                        </td>
                        <td>{new Date(order.ordered_at).toLocaleString()}</td>
                        <td>₹{order.total_amount.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${
                            order.status === 'Delivered' ? 'badge-status-delivered' : 
                            (order.status === 'Cancelled' ? 'badge-status-cancelled' : 'badge-status-pending')
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                            {order.payment_method} - <span style={{ color: order.payment_status === 'Paid' ? 'var(--success)' : 'orange' }}>{order.payment_status}</span>
                          </div>
                        </td>
                        <td>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => {
                              setSelectedOrder(order);
                              setAssignPartnerId(order.delivery_partner_id || '');
                              setAssignTracking(order.tracking_number || '');
                            }}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Eye size={12} /> Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Selected Order Manage Modal */}
            {selectedOrder && (
              <div className="modal-overlay">
                <div className="payment-modal" style={{ maxWidth: '650px' }}>
                  <div className="payment-modal-header modal-header-razorpay" style={{ backgroundColor: 'var(--secondary)' }}>
                    <h3 style={{ color: 'white', fontFamily: 'var(--font-body)' }}>Update Order: {selectedOrder.order_number}</h3>
                    <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                  </div>
                  
                  <div className="payment-modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>Customer Profile</h4>
                      <p style={{ fontSize: '0.85rem' }}><b>Name:</b> {selectedOrder.customer_name}</p>
                      <p style={{ fontSize: '0.85rem' }}><b>Phone:</b> {selectedOrder.customer_phone}</p>
                      <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><b>Address:</b> {selectedOrder.address?.full_address}, {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}</p>
                      {selectedOrder.ordered_lat && selectedOrder.ordered_lon ? (
                        <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                          <b>GPS Location:</b>{' '}
                          <a 
                            href={`https://www.google.com/maps?q=${selectedOrder.ordered_lat},${selectedOrder.ordered_lon}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: 'var(--secondary)', textDecoration: 'underline', fontWeight: 'bold' }}
                          >
                            📍 {selectedOrder.ordered_lat.toFixed(4)}°, {selectedOrder.ordered_lon.toFixed(4)}° (Track on Maps 🌐)
                          </a>
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                          <b>GPS Location:</b> GPS details not captured
                        </p>
                      )}

                      <h4 style={{ fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>Update Status</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                          <button 
                            key={s} 
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, s)}
                            className="btn btn-outline" 
                            disabled={selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered'}
                            style={{ 
                              padding: '0.4rem 0.6rem', 
                              fontSize: '0.75rem', 
                              backgroundColor: selectedOrder.status === s ? 'var(--secondary)' : 'transparent',
                              color: selectedOrder.status === s ? 'white' : 'var(--text)'
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>Courier / Partner</h4>
                      
                      {shiprocketActive && (
                        <div style={{ marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handlePushToShiprocket(selectedOrder.id)}
                            style={{ 
                              width: '100%', 
                              padding: '0.6rem', 
                              fontSize: '0.8rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '0.5rem', 
                              backgroundColor: '#7C3AED', 
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                            disabled={selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered' || selectedOrder.tracking_number}
                          >
                            🚀 {selectedOrder.tracking_number ? `AWB: ${selectedOrder.tracking_number}` : 'Push to Shiprocket (Auto AWB)'}
                          </button>
                        </div>
                      )}

                      <form onSubmit={handleAssignDelivery}>
                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Delivery Executive</label>
                          <select 
                            className="form-input" 
                            value={assignPartnerId} 
                            onChange={e => setAssignPartnerId(e.target.value)}
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            <option value="">Select partner...</option>
                            {partners.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>AWB Tracking Number</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={assignTracking} 
                            onChange={e => setAssignTracking(e.target.value)} 
                            placeholder="e.g. 92837237912"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-secondary" 
                          style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }}
                          disabled={selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered'}
                        >
                          Assign Partner & Ship
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS INVENTORY */}
        {activeTab === 'products' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem' }}>Spices Inventory</h2>
              <button className="btn btn-secondary" onClick={() => handleOpenProductModal(null)}><Plus size={16} /> Add New Spice</button>
            </div>

            <div className="card table-responsive" style={{ padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Spice Heat</th>
                    <th>Variants (Weight - Rate - Stock)</th>
                    <th>Visible</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>🌿</span>
                          <b>{prod.name}</b>
                        </div>
                      </td>
                      <td>{prod.category}</td>
                      <td>Level {prod.spice_level}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {prod.variants.map((v, i) => (
                            <span key={i} style={{ fontSize: '0.8rem', color: v.stock < 10 ? 'var(--error)' : 'var(--text)' }}>
                              {v.weight_variant}: ₹{v.price} (<b>Stock: {v.stock}</b>)
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleProductStatus(prod.id, prod.is_active)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: prod.is_active === 1 ? 'var(--success)' : 'var(--text-light)' }}
                        >
                          {prod.is_active === 1 ? <span style={{ fontWeight: 'bold' }}>Active</span> : 'Hidden'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => handleOpenProductModal(prod)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Product Create/Edit Modal */}
            {showProductModal && (
              <div className="modal-overlay">
                <div className="payment-modal" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="payment-modal-header" style={{ backgroundColor: 'var(--secondary)' }}>
                    <h3 style={{ color: 'white', fontFamily: 'var(--font-body)' }}>
                      {editingProduct ? `Edit Spice: ${editingProduct.name}` : 'Add New Spice Profile'}
                    </h3>
                    <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                  </div>
                  
                  <form onSubmit={handleProductSubmit} className="payment-modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Product Name</label>
                        <input type="text" className="form-input" value={prodName} onChange={e => setProdName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <select className="form-input" value={prodCat} onChange={e => setProdCat(e.target.value)}>
                          <option value="Powders">Ground Powders</option>
                          <option value="Whole">Whole Spices</option>
                          <option value="Blends">Gourmet Blends</option>
                          <option value="Combos">Value Combos</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Brief Description</label>
                      <textarea className="form-input" rows="2" value={prodDesc} onChange={e => setProdDesc(e.target.value)}></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Ingredients Disclosure</label>
                        <textarea className="form-input" rows="2" value={prodIng} onChange={e => setProdIng(e.target.value)}></textarea>
                      </div>
                      <div className="form-group">
                        <label>USP Story ("How it's made")</label>
                        <textarea className="form-input" rows="2" value={prodMade} onChange={e => setProdMade(e.target.value)}></textarea>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Spice Heat Level (0 to 5)</label>
                        <input type="number" min="0" max="5" className="form-input" value={prodSpice} onChange={e => setProdSpice(parseInt(e.target.value))} />
                      </div>
                      <div className="form-group">
                        <label>Upload Spice Image</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="form-input" 
                          style={{ padding: '0.2rem' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProdImageBase64(reader.result);
                                setProdImageName(file.name);
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                        {prodImageName && <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'block', marginTop: '0.25rem' }}>Selected: {prodImageName}</span>}
                      </div>
                    </div>

                    {/* Variants input grid */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                      <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontFamily: 'var(--font-body)' }}>Weight Variants</h4>
                        <button type="button" onClick={handleAddVariantRow} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><Plus size={12} /> Add Weight</button>
                      </div>
                      
                      {prodVariants.map((v, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={v.weight_variant} 
                            onChange={e => handleVariantFieldChange(idx, 'weight_variant', e.target.value)} 
                            placeholder="e.g. 100g, 250g" 
                            required 
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            value={v.price} 
                            onChange={e => handleVariantFieldChange(idx, 'price', parseFloat(e.target.value))} 
                            placeholder="Price" 
                            required 
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            value={v.stock} 
                            onChange={e => handleVariantFieldChange(idx, 'stock', parseInt(e.target.value))} 
                            placeholder="Stock" 
                            required 
                          />
                          {prodVariants.length > 1 && (
                            <button type="button" onClick={() => handleRemoveVariantRow(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}><Trash2 size={16} /></button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Combo components list */}
                    {prodCat === 'Combos' && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <div className="flex-between" style={{ marginBottom: '1rem' }}>
                          <h4 style={{ fontFamily: 'var(--font-body)' }}>Combo Component Products</h4>
                          <button 
                            type="button" 
                            onClick={() => setProdComboItems(prev => [...prev, { product_id: '', quantity: 1 }])} 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Plus size={12} /> Add Component
                          </button>
                        </div>
                        
                        {prodComboItems.map((item, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr auto', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <select 
                              className="form-input"
                              value={item.product_id}
                              onChange={e => {
                                const val = e.target.value;
                                setProdComboItems(prev => prev.map((ci, i) => i === idx ? { ...ci, product_id: val } : ci));
                              }}
                              required
                            >
                              <option value="">-- Select Product --</option>
                              {products
                                .filter(p => p.id !== editingProduct?.id && p.category !== 'Combos')
                                .map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))
                              }
                            </select>
                            <input 
                              type="number" 
                              min="1"
                              className="form-input" 
                              value={item.quantity} 
                              onChange={e => {
                                const val = parseInt(e.target.value) || 1;
                                setProdComboItems(prev => prev.map((ci, i) => i === idx ? { ...ci, quantity: val } : ci));
                              }}
                              placeholder="Qty" 
                              required 
                            />
                            <button 
                              type="button" 
                              onClick={() => setProdComboItems(prev => prev.filter((_, i) => i !== idx))} 
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        {prodComboItems.length === 0 && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', textAlign: 'center', margin: '1rem 0' }}>
                            No component products added. Click "Add Component" above.
                          </p>
                        )}
                      </div>
                    )}

                    <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }}>
                      {editingProduct ? 'Update Product & Stock' : 'Add Spice to Catalog'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PAYMENT GATEWAY SETTINGS */}
        {activeTab === 'gateways' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Payment Gateway Integrations</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: editingGateway ? '1fr 1fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Gateways Grid */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {Object.keys(gateways).map(name => {
                    const config = gateways[name];
                    return (
                      <div 
                        key={name} 
                        className="card" 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderLeft: config.active ? '4px solid var(--success)' : '4px solid var(--border)' 
                        }}
                      >
                        <div>
                          <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>{name} Gateway</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {config.active ? 'Accepting Payments' : 'Disabled'}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {name !== 'COD' && (
                            <button 
                              className="btn btn-outline" 
                              onClick={() => handleEditGateway(name, config)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            >
                              API Keys
                            </button>
                          )}
                          <button
                            onClick={() => {
                              fetch('/api/admin/gateways', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({
                                  gateway: name,
                                  active: !config.active,
                                  keys: config.keys
                                })
                              })
                                .then(res => res.json())
                                .then(() => fetchGatewayConfigs());
                            }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: config.active ? 'var(--success)' : '#CCC' }}
                          >
                            {config.active ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: API Keys Edit */}
              {editingGateway && (
                <div>
                  <form onSubmit={handleSaveGateway} className="card">
                    <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>
                      API Credentials: {editingGateway}
                    </h3>
                    
                    <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600' }}>Active State</span>
                        <input type="checkbox" checked={gatewayActive} onChange={e => setGatewayActive(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                      </label>
                    </div>

                    {editingGateway === 'Razorpay' && (
                      <>
                        <div className="form-group">
                          <label>Razorpay Key ID</label>
                          <input type="text" className="form-input" value={gatewayKeys.keyId || ''} onChange={e => setGatewayKeys({ ...gatewayKeys, keyId: e.target.value })} required />
                        </div>
                        <div className="form-group">
                          <label>Razorpay Key Secret</label>
                          <input type="password" className="form-input" value={gatewayKeys.keySecret || ''} onChange={e => setGatewayKeys({ ...gatewayKeys, keySecret: e.target.value })} required />
                        </div>
                      </>
                    )}

                    {editingGateway === 'Cashfree' && (
                      <>
                        <div className="form-group">
                          <label>Cashfree App ID</label>
                          <input type="text" className="form-input" value={gatewayKeys.appId || ''} onChange={e => setGatewayKeys({ ...gatewayKeys, appId: e.target.value })} required />
                        </div>
                        <div className="form-group">
                          <label>Cashfree Secret Key</label>
                          <input type="password" className="form-input" value={gatewayKeys.secretKey || ''} onChange={e => setGatewayKeys({ ...gatewayKeys, secretKey: e.target.value })} required />
                        </div>
                      </>
                    )}

                    {editingGateway === 'PayU' && (
                      <>
                        <div className="form-group">
                          <label>PayU Merchant Key</label>
                          <input type="text" className="form-input" value={gatewayKeys.merchantKey || ''} onChange={e => setGatewayKeys({ ...gatewayKeys, merchantKey: e.target.value })} required />
                        </div>
                        <div className="form-group">
                          <label>PayU Salt</label>
                          <input type="password" className="form-input" value={gatewayKeys.salt || ''} onChange={e => setGatewayKeys({ ...gatewayKeys, salt: e.target.value })} required />
                        </div>
                      </>
                    )}

                    {editingGateway === 'PhonePe' && (
                      <>
                        <div className="form-group">
                          <label>PhonePe Merchant ID</label>
                          <input type="text" className="form-input" value={gatewayKeys.merchantId || ''} onChange={e => setGatewayKeys({ ...gatewayKeys, merchantId: e.target.value })} required />
                        </div>
                        <div className="form-group">
                          <label>PhonePe Salt Key</label>
                          <input type="password" className="form-input" value={gatewayKeys.saltKey || ''} onChange={e => setGatewayKeys({ ...gatewayKeys, saltKey: e.target.value })} required />
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label>Sandbox Mode / Environment</label>
                      <select className="form-input" value={gatewayKeys.mode || 'TEST'} onChange={e => setGatewayKeys({ ...gatewayKeys, mode: e.target.value })}>
                        <option value="TEST">TEST Mode (Simulate Checkouts)</option>
                        <option value="LIVE">LIVE Production Mode</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button type="submit" className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem' }}>Save Keys</button>
                      <button type="button" className="btn btn-outline" onClick={() => setEditingGateway('')} style={{ padding: '0.5rem' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DELIVERY PARTNERS */}
        {activeTab === 'delivery' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Delivery Executive Operations</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
              {/* Executive list */}
              <div className="card table-responsive" style={{ padding: 0 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map(p => (
                      <tr key={p.id}>
                        <td><b>{p.name}</b></td>
                        <td>{p.contact}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: p.type === 'courier' ? '#E3F2FD' : '#E8F5E9', color: p.type === 'courier' ? '#1565C0' : 'var(--success)' }}>
                            {p.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = e.target.name.value;
                  const contact = e.target.contact.value;
                  const type = e.target.type.value;

                  if (!name) return showToast('Name required');

                  fetch('/api/admin/delivery-partners', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ name, contact, type })
                  })
                    .then(res => res.json())
                    .then(() => {
                      showToast('Delivery partner added');
                      e.target.reset();
                      fetchPartners();
                    });
                }}
                className="card"
              >
                <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontFamily: 'var(--font-body)' }}>Add Executive/Courier</h3>
                <div className="form-group">
                  <label>Full Name / Company Name</label>
                  <input type="text" name="name" className="form-input" placeholder="e.g. Shiprocket, Delhivery, Amit Kumar" required />
                </div>
                <div className="form-group">
                  <label>Phone / Customer Support Contact</label>
                  <input type="text" name="contact" className="form-input" placeholder="e.g. +91 9988776655" />
                </div>
                <div className="form-group">
                  <label>Service Type</label>
                  <select name="type" className="form-input">
                    <option value="courier">Courier Company (Delhivery, Shiprocket, etc.)</option>
                    <option value="local">Local Delivery Executive</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Add Partner Profile</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS & VISUAL ANALYTICS */}
        {activeTab === 'reports' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Visual Sales Analytics & Geolocation Tracking</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Real-time dashboard mapping store performance, category shares, and order coordinates.</p>
              </div>
              <button onClick={handleExportCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={16} /> Export CSV Report
              </button>
            </div>

            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales (Paid)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)', marginTop: '0.25rem' }}>₹{totalRevenueSum.toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>Paid Orders: {paidOrdersCount}</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Order Value (AOV)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>₹{avgAOV.toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>Total Orders: {totalOrdersCount}</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #3498DB' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment split</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.25rem' }}>COD: {codCount} | Online: {onlineCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>COD ratio: {totalOrdersCount > 0 ? ((codCount / totalOrdersCount) * 100).toFixed(0) : 0}%</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GPS Geolocation rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>{gpsPct}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>GPS Captured: {gpsCount} orders</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Daily Sales Trend SVG Graph */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>📈 Daily Revenue Trend (Last 7 Days)</h3>
                
                {graphData.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(() => {
                      const maxVal = Math.max(...graphData.map(d => d.amount), 100);
                      const width = 500;
                      const height = 150;
                      const padding = 20;
                      const points = graphData.map((d, i) => {
                        const x = padding + (i * (width - 2 * padding)) / Math.max(1, graphData.length - 1);
                        const y = height - padding - (d.amount / maxVal) * (height - 2 * padding);
                        return { x, y, date: d.date, amount: d.amount };
                      });
                      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      
                      return (
                        <svg width="100%" height="180" viewBox={`0 0 ${width} ${height}`}>
                          <defs>
                            <linearGradient id="adminChartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {/* Y-axis line coordinates */}
                          {[0, 0.5, 1].map((ratio, idx) => {
                            const y = height - padding - ratio * (height - 2 * padding);
                            const val = (ratio * maxVal).toFixed(0);
                            return (
                              <g key={idx}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#EEE" strokeDasharray="3 3" />
                                <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="8" fill="var(--text-light)">₹{val}</text>
                              </g>
                            );
                          })}
                          {/* Area fill */}
                          {points.length > 0 && (
                            <path d={`${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`} fill="url(#adminChartGrad)" />
                          )}
                          {/* Line */}
                          {linePath && (
                            <path d={linePath} fill="none" stroke="var(--secondary)" strokeWidth="2.5" strokeLinecap="round" />
                          )}
                          {/* Dots */}
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="var(--secondary)" strokeWidth="2" />
                              <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--text)">₹{p.amount.toFixed(0)}</text>
                              <text x={p.x} y={height - 5} textAnchor="middle" fontSize="7" fill="var(--text-light)">
                                {p.date.split('-').slice(1).reverse().join('/')}
                              </text>
                            </g>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No sales graph data generated yet.</p>
                )}
              </div>

              {/* Category-wise Sales share */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>📦 Sales by Spice Category</h3>
                <div className="table-responsive">
                  <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Items Sold</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.categorySales.map((c, idx) => (
                        <tr key={idx}>
                          <td><b>{c.category}</b></td>
                          <td>{c.items_sold} units</td>
                          <td style={{ color: 'var(--secondary)', fontWeight: '600' }}>₹{c.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                      {reports.categorySales.length === 0 && (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-light)' }}>No category sales reported.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Product Bestseller Ranking */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>🏆 Product Bestseller Ranking</h3>
                <div className="table-responsive">
                  <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Spice Product</th>
                        <th>Sold Qty</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.productSales.slice(0, 5).map((p, idx) => (
                        <tr key={idx}>
                          <td><b>{p.name}</b> <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>({p.category})</span></td>
                          <td>{p.items_sold} units</td>
                          <td style={{ color: 'var(--secondary)', fontWeight: '600' }}>₹{p.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                      {reports.productSales.length === 0 && (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-light)' }}>No spice sales reported.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Gateways Stats */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>💳 Payment Method Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {(() => {
                    const methods = {};
                    orders.forEach(o => {
                      methods[o.payment_method] = (methods[o.payment_method] || 0) + 1;
                    });
                    
                    return Object.entries(methods).map(([name, count]) => {
                      const pct = totalOrdersCount > 0 ? ((count / totalOrdersCount) * 100).toFixed(0) : 0;
                      return (
                        <div key={name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                            <span>{name === 'COD' ? '💵 Cash on Delivery (COD)' : `💳 Online Checkout (${name})`}</span>
                            <span style={{ color: 'var(--secondary)' }}>{count} Orders ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#EEE', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: name === 'COD' ? 'orange' : 'var(--secondary)', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Global Order Geolocation Tracker */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontWeight: 'bold' }}>
                📍 Global Customer Order GPS Tracker
              </h3>
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Order Reference</th>
                      <th>Customer Name</th>
                      <th>Shipping City & State</th>
                      <th>GPS Coordinates</th>
                      <th>Status</th>
                      <th>Map Tracking Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td><b>{order.order_number}</b></td>
                        <td>
                          <div>{order.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{order.customer_phone}</div>
                        </td>
                        <td>{order.address ? `${order.address.city}, ${order.address.state}` : '—'}</td>
                        <td>
                          {order.ordered_lat && order.ordered_lon ? (
                            <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                              {order.ordered_lat.toFixed(5)}, {order.ordered_lon.toFixed(5)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.8rem' }}>Not Captured (GPS Denied/COD)</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            order.status === 'Delivered' ? 'badge-status-delivered' : 
                            (order.status === 'Cancelled' ? 'badge-status-cancelled' : 'badge-status-pending')
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          {order.ordered_lat && order.ordered_lon ? (
                            <a 
                              href={`https://www.google.com/maps?q=${order.ordered_lat},${order.ordered_lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              Track Live 🌐
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No orders tracked on the platform.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: REGISTERED USERS */}
        {activeTab === 'users' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem' }}>Registered Customers</h2>
              <div style={{ position: 'relative', width: '300px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name, email, phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {isLoadingCustomers ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading customers list...</p>
            ) : (
              <div className="card table-responsive" style={{ padding: 0 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Orders Count</th>
                      <th>Total Spent</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers
                      .filter(cust => {
                        const search = customerSearch.toLowerCase();
                        return (
                          (cust.name && cust.name.toLowerCase().includes(search)) ||
                          (cust.email && cust.email.toLowerCase().includes(search)) ||
                          (cust.phone && cust.phone.toLowerCase().includes(search))
                        );
                      })
                      .map(cust => (
                        <tr key={cust.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <b>{cust.name}</b>
                              {cust.status && cust.status !== 'active' && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '3px',
                                  backgroundColor: cust.status === 'blocked' ? '#FFEBEE' : '#FFF3E0',
                                  color: cust.status === 'blocked' ? 'var(--error)' : 'orange',
                                  fontWeight: 'bold',
                                  textTransform: 'uppercase'
                                }}>
                                  {cust.status}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{cust.email}</td>
                          <td>{cust.phone || 'N/A'}</td>
                          <td>{cust.order_count}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>₹{cust.total_spent ? cust.total_spent.toFixed(2) : '0.00'}</td>
                          <td>{new Date(cust.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleViewCustomer(cust.id)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Eye size={12} /> View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                          No customers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Selected Customer Details Modal */}
            {selectedCustomer && (
              <div className="modal-overlay">
                <div className="payment-modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="payment-modal-header" style={{ backgroundColor: 'var(--secondary)' }}>
                    <h3 style={{ color: 'white', fontFamily: 'var(--font-body)' }}>
                      Customer Profile: {selectedCustomer.name}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerOrders([]);
                        setSelectedCustomerOrder(null);
                      }}
                      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                      <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>

                  <div className="payment-modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                      {/* Left: General Info */}
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
                          Personal Info
                        </h4>
                        <p style={{ fontSize: '0.9rem', margin: '0.4rem 0' }}><b>Name:</b> {selectedCustomer.name}</p>
                        <p style={{ fontSize: '0.9rem', margin: '0.4rem 0' }}><b>Email:</b> {selectedCustomer.email}</p>
                        <p style={{ fontSize: '0.9rem', margin: '0.4rem 0' }}><b>Phone:</b> {selectedCustomer.phone || 'Not provided'}</p>
                        <p style={{ fontSize: '0.9rem', margin: '0.4rem 0' }}><b>Role:</b> <span style={{ textTransform: 'capitalize' }}>{selectedCustomer.role}</span></p>
                        <p style={{ fontSize: '0.9rem', margin: '0.4rem 0' }}>
                          <b>Status:</b> 
                          <span style={{ 
                            marginLeft: '0.5rem', 
                            fontSize: '0.75rem', 
                            padding: '0.1rem 0.35rem', 
                            borderRadius: '3px',
                            backgroundColor: selectedCustomer.status === 'blocked' ? '#FFEBEE' : (selectedCustomer.status === 'deactivated' ? '#FFF3E0' : '#E8F5E9'),
                            color: selectedCustomer.status === 'blocked' ? 'var(--error)' : (selectedCustomer.status === 'deactivated' ? 'orange' : 'var(--success)'),
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {selectedCustomer.status || 'active'}
                          </span>
                        </p>
                        <p style={{ fontSize: '0.9rem', margin: '0.4rem 0' }}><b>Member Since:</b> {new Date(selectedCustomer.created_at).toLocaleString()}</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', padding: '0.75rem', backgroundColor: '#F8F9FA', borderRadius: '4px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>TOTAL SPENT</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--success)' }}>₹{selectedCustomer.total_spent ? selectedCustomer.total_spent.toFixed(2) : '0.00'}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>PAID ORDERS</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedCustomer.paid_orders} / {selectedCustomer.order_count}</span>
                          </div>
                        </div>

                        {/* Account Management Actions */}
                        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                          <h5 style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem', fontWeight: 'bold' }}>ACCOUNT CONTROLS</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {selectedCustomer.status !== 'active' && (
                              <button 
                                className="btn btn-outline" 
                                onClick={() => handleUpdateCustomerStatus(selectedCustomer.id, 'active')}
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                              >
                                Re-activate
                              </button>
                            )}
                            {selectedCustomer.status !== 'deactivated' && (
                              <button 
                                className="btn btn-outline" 
                                onClick={() => handleUpdateCustomerStatus(selectedCustomer.id, 'deactivated')}
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderColor: 'orange', color: 'orange' }}
                              >
                                Deactivate
                              </button>
                            )}
                            {selectedCustomer.status !== 'blocked' && (
                              <button 
                                className="btn btn-outline" 
                                onClick={() => handleUpdateCustomerStatus(selectedCustomer.id, 'blocked')}
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                              >
                                Block User
                              </button>
                            )}
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => handleDeleteCustomer(selectedCustomer.id, selectedCustomer.name)}
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'var(--error)', color: 'white', border: 'none' }}
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Saved Addresses */}
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
                          Saved Addresses
                        </h4>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                            selectedCustomer.addresses.map((addr) => (
                              <div
                                key={addr.id}
                                style={{
                                  border: '1px solid var(--border)',
                                  borderRadius: '4px',
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.85rem',
                                  backgroundColor: addr.is_default ? '#E8F5E9' : 'transparent',
                                  borderColor: addr.is_default ? 'var(--success)' : 'var(--border)'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{addr.address_type || 'Address'}</span>
                                  {addr.is_default && <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>DEFAULT</span>}
                                </div>
                                <div>{addr.receiver_name} ({addr.receiver_phone})</div>
                                <div style={{ color: 'var(--text-light)' }}>
                                  {addr.full_address}, {addr.city}, {addr.state} - {addr.pincode}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No saved addresses found.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order History Table */}
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
                        Purchase History
                      </h4>
                      {customerOrders.length > 0 ? (
                        <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th>Order Ref</th>
                                <th>Date Placed</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Payment Method</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customerOrders.map(order => (
                                <tr key={order.id}>
                                  <td><b>{order.order_number}</b></td>
                                  <td>{new Date(order.ordered_at).toLocaleString()}</td>
                                  <td>
                                    <span className={`badge ${
                                      order.status === 'Delivered' ? 'badge-status-delivered' : 
                                      (order.status === 'Cancelled' ? 'badge-status-cancelled' : 'badge-status-pending')
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td>₹{order.total_amount.toFixed(2)}</td>
                                  <td>{order.payment_method} (<span style={{ color: order.payment_status === 'Paid' ? 'var(--success)' : 'orange', fontWeight: '500' }}>{order.payment_status}</span>)</td>
                                  <td>
                                    <button
                                      className="btn btn-outline"
                                      onClick={() => setSelectedCustomerOrder(order)}
                                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                                    >
                                      View Order
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No orders found for this user.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-modal: Customer Order Details */}
            {selectedCustomerOrder && (
              <div className="modal-overlay" style={{ zIndex: 10000 }}>
                <div className="payment-modal" style={{ maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }}>
                  <div className="payment-modal-header" style={{ backgroundColor: 'var(--secondary)' }}>
                    <h3 style={{ color: 'white', fontFamily: 'var(--font-body)' }}>
                      Order Details: {selectedCustomerOrder.order_number}
                    </h3>
                    <button
                      onClick={() => setSelectedCustomerOrder(null)}
                      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                      <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>

                  <div className="payment-modal-body">
                    {/* Order metadata */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}><b>Ordered On:</b> {new Date(selectedCustomerOrder.ordered_at).toLocaleString()}</p>
                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}><b>Expected Delivery:</b> {selectedCustomerOrder.expected_delivery_date ? new Date(selectedCustomerOrder.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
                        {selectedCustomerOrder.actual_delivery_date && (
                          <p style={{ fontSize: '0.85rem', margin: '0.25rem 0', color: 'var(--success)' }}>
                            <b>Delivered On:</b> {new Date(selectedCustomerOrder.actual_delivery_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}><b>Payment Method:</b> {selectedCustomerOrder.payment_method}</p>
                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                          <b>Payment Status:</b> <span style={{ color: selectedCustomerOrder.payment_status === 'Paid' ? 'var(--success)' : 'orange', fontWeight: 'bold' }}>{selectedCustomerOrder.payment_status}</span>
                        </p>
                        {selectedCustomerOrder.payment?.transaction_reference && (
                          <p style={{ fontSize: '0.8rem', margin: '0.25rem 0', color: 'var(--text-light)' }}>
                            <b>Txn Ref:</b> {selectedCustomerOrder.payment.transaction_reference}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order items */}
                    <h5 style={{ fontFamily: 'var(--font-body)', marginBottom: '0.5rem' }}>Items in Order</h5>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                      <table className="admin-table" style={{ fontSize: '0.85rem', margin: 0 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8F9FA' }}>
                            <th>Spice Product</th>
                            <th>Variant</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomerOrder.items && selectedCustomerOrder.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.product_name}</td>
                              <td>{item.weight_variant}</td>
                              <td>₹{item.price}</td>
                              <td>{item.quantity}</td>
                              <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 'bold' }}>
                            <td colSpan="4" style={{ textAlign: 'right', padding: '0.75rem' }}>Grand Total:</td>
                            <td style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--secondary)' }}>₹{selectedCustomerOrder.total_amount.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Courier and Shipping */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', padding: '0.75rem', backgroundColor: '#F8F9FA', borderRadius: '4px' }}>
                      <div>
                        <h5 style={{ fontFamily: 'var(--font-body)', marginBottom: '0.25rem' }}>Shipping Address</h5>
                        {selectedCustomerOrder.address ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                            <div><b>{selectedCustomerOrder.address.receiver_name}</b> ({selectedCustomerOrder.address.receiver_phone})</div>
                            <div>{selectedCustomerOrder.address.full_address}</div>
                            <div>{selectedCustomerOrder.address.city}, {selectedCustomerOrder.address.state} - {selectedCustomerOrder.address.pincode}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>Address not available</span>
                        )}
                        {selectedCustomerOrder.ordered_lat && selectedCustomerOrder.ordered_lon ? (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                            <b>GPS Coordinates:</b>{' '}
                            <a 
                              href={`https://www.google.com/maps?q=${selectedCustomerOrder.ordered_lat},${selectedCustomerOrder.ordered_lon}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: 'var(--secondary)', textDecoration: 'underline', fontWeight: 'bold' }}
                            >
                              📍 {selectedCustomerOrder.ordered_lat.toFixed(4)}°, {selectedCustomerOrder.ordered_lon.toFixed(4)}°
                            </a>
                          </div>
                        ) : (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            GPS coordinates not captured
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 style={{ fontFamily: 'var(--font-body)', marginBottom: '0.25rem' }}>Delivery Executive</h5>
                        {selectedCustomerOrder.delivery_partner ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                            <div><b>{selectedCustomerOrder.delivery_partner.name}</b> ({selectedCustomerOrder.delivery_partner.type})</div>
                            {selectedCustomerOrder.tracking_number && (
                              <div style={{ marginTop: '0.25rem' }}><b>Tracking:</b> {selectedCustomerOrder.tracking_number}</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No courier partner assigned yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CMS PAGES */}
        {activeTab === 'pages' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem' }}>Website Pages (CMS)</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
                  Available Pages
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pages.map(page => (
                    <li key={page.slug} style={{ borderBottom: '1px solid var(--border)' }}>
                      <button 
                        onClick={() => handlePageSelect(page.slug)}
                        style={{ 
                          width: '100%', 
                          textAlign: 'left', 
                          padding: '1rem', 
                          background: selectedPage?.slug === page.slug ? 'var(--secondary)' : 'transparent',
                          color: selectedPage?.slug === page.slug ? 'white' : 'var(--text)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {page.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                {selectedPage ? (
                  <form onSubmit={handleSavePage}>
                    <h3 style={{ marginBottom: '1rem' }}>Editing: {selectedPage.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                      You can use HTML tags (e.g., &lt;h1&gt;, &lt;p&gt;, &lt;b&gt;) to format your page.
                    </p>
                    <textarea 
                      className="form-input" 
                      rows="20" 
                      value={pageContent} 
                      onChange={e => setPageContent(e.target.value)}
                      style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                    ></textarea>
                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                      <button type="submit" className="btn btn-secondary">
                        <CheckCircle size={16} /> Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                    <p>Select a page from the sidebar to edit its content.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: COUPONS MANAGEMENT (Admin Only) */}
        {activeTab === 'coupons' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem' }}>Coupon Codes & Offers</h2>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setEditingCoupon(null);
                  setCouponFormCode('');
                  setCouponFormType('percentage');
                  setCouponFormValue(10);
                  setCouponFormMinAmount(0);
                  setCouponFormMaxDiscount(0);
                  setShowCouponModal(true);
                }}
              >
                <Plus size={16} /> Create Coupon
              </button>
            </div>

            <div className="card table-responsive" style={{ padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Cart Amount</th>
                    <th>Max Discount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(cp => (
                    <tr key={cp.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem', color: 'var(--secondary)' }}>
                          {cp.code}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{cp.discount_type}</td>
                      <td>{cp.discount_type === 'percentage' ? `${cp.discount_value}%` : `₹${cp.discount_value}`}</td>
                      <td>₹{cp.min_cart_amount || 0}</td>
                      <td>{cp.max_discount ? `₹${cp.max_discount}` : 'No Limit'}</td>
                      <td>
                        <button
                          onClick={() => handleToggleCouponStatus(cp.id, cp.is_active)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: cp.is_active === 1 ? 'var(--success)' : 'var(--text-light)' }}
                        >
                          {cp.is_active === 1 ? <span style={{ fontWeight: 'bold' }}>Active</span> : 'Disabled'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-outline"
                            onClick={() => {
                              setEditingCoupon(cp);
                              setCouponFormCode(cp.code);
                              setCouponFormType(cp.discount_type);
                              setCouponFormValue(cp.discount_value);
                              setCouponFormMinAmount(cp.min_cart_amount);
                              setCouponFormMaxDiscount(cp.max_discount || 0);
                              setShowCouponModal(true);
                            }}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => handleDeleteCoupon(cp.id, cp.code)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                        No coupons found. Click "Create Coupon" to add one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Coupon Create/Edit Modal */}
            {showCouponModal && (
              <div className="modal-overlay">
                <div className="payment-modal" style={{ maxWidth: '500px' }}>
                  <div className="payment-modal-header" style={{ backgroundColor: 'var(--secondary)' }}>
                    <h3 style={{ color: 'white', fontFamily: 'var(--font-body)' }}>
                      {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
                    </h3>
                    <button onClick={() => setShowCouponModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                  </div>

                  <form onSubmit={handleCouponSubmit} className="payment-modal-body">
                    <div className="form-group">
                      <label>Coupon Code (e.g. SPICE20)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={couponFormCode} 
                        onChange={e => setCouponFormCode(e.target.value.toUpperCase().replace(/\s+/g, ''))} 
                        placeholder="WELCOME10"
                        required 
                        disabled={editingCoupon !== null}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Discount Type</label>
                        <select className="form-input" value={couponFormType} onChange={e => setCouponFormType(e.target.value)}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="flat">Flat Amount (₹)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Discount Value</label>
                        <input 
                          type="number" 
                          min="1" 
                          className="form-input" 
                          value={couponFormValue} 
                          onChange={e => setCouponFormValue(parseFloat(e.target.value))} 
                          required 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Min Cart Amount (₹)</label>
                        <input 
                          type="number" 
                          min="0" 
                          className="form-input" 
                          value={couponFormMinAmount} 
                          onChange={e => setCouponFormMinAmount(parseFloat(e.target.value))} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Max Discount (₹) {couponFormType === 'flat' ? '(N/A)' : ''}</label>
                        <input 
                          type="number" 
                          min="0" 
                          className="form-input" 
                          value={couponFormMaxDiscount} 
                          onChange={e => setCouponFormMaxDiscount(parseFloat(e.target.value))} 
                          disabled={couponFormType === 'flat'}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }}>
                      {editingCoupon ? 'Update Coupon' : 'Create Coupon Code'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: SETTINGS */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Global Settings & Integrations</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
              
              {/* General Store Config Card */}
              <div className="card" style={{ margin: 0, padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-body)', color: 'var(--secondary)' }}>
                  🌿 General Store Settings
                </h3>
                <form onSubmit={handleSaveSettings}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Brand Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter Brand Name" 
                        value={settingsBrand} 
                        onChange={e => setSettingsBrand(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>FSSAI License Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter FSSAI Number" 
                        value={settingsFssai} 
                        onChange={e => setSettingsFssai(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Email</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder="Enter Contact Email" 
                        value={settingsEmail} 
                        onChange={e => setSettingsEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter Contact Phone" 
                        value={settingsPhone} 
                        onChange={e => setSettingsPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Store Pickup Pincode</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 110006" 
                        maxLength="6"
                        value={settingsPincode} 
                        onChange={e => setSettingsPincode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                    <div className="form-group">
                      <label>Store Logo</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        {settingsLogo && !logoBase64 && (
                          <img src={settingsLogo} alt="Logo" style={{ height: '38px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px' }} />
                        )}
                        {logoBase64 && (
                          <img src={logoBase64} alt="New Logo Preview" style={{ height: '38px', objectFit: 'contain', border: '2px solid var(--success)', borderRadius: '4px', padding: '2px' }} />
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="form-input" 
                          style={{ padding: '0.2rem', flex: 1, fontSize: '0.8rem' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setLogoBase64(reader.result);
                                setLogoName(file.name);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Store Favicon</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        {settingsFavicon && !faviconBase64 && (
                          <img src={settingsFavicon} alt="Favicon" style={{ height: '32px', width: '32px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px' }} />
                        )}
                        {faviconBase64 && (
                          <img src={faviconBase64} alt="New Favicon Preview" style={{ height: '32px', width: '32px', objectFit: 'contain', border: '2px solid var(--success)', borderRadius: '4px', padding: '2px' }} />
                        )}
                        <input 
                          type="file" 
                          accept="image/*,.ico" 
                          className="form-input" 
                          style={{ padding: '0.2rem', flex: 1, fontSize: '0.8rem' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFaviconBase64(reader.result);
                                setFaviconName(file.name);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label>Store Address</label>
                    <textarea 
                      className="form-input" 
                      rows="3" 
                      placeholder="Enter Store Address" 
                      value={settingsAddress} 
                      onChange={e => setSettingsAddress(e.target.value)}
                    ></textarea>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', marginTop: '1.75rem', marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                    🔗 Social Media Platforms
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label>Instagram URL</label>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://instagram.com/username" 
                        value={settingsInstagram} 
                        onChange={e => setSettingsInstagram(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Facebook URL</label>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://facebook.com/page" 
                        value={settingsFacebook} 
                        onChange={e => setSettingsFacebook(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Twitter/X URL</label>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://twitter.com/handle" 
                        value={settingsTwitter} 
                        onChange={e => setSettingsTwitter(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>YouTube URL</label>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://youtube.com/channel" 
                        value={settingsYoutube} 
                        onChange={e => setSettingsYoutube(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                      <CheckCircle size={16} /> Save Store Settings
                    </button>
                  </div>
                </form>
              </div>

              {/* Shiprocket Config Card */}
              <div className="card" style={{ margin: 0, padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-body)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🚀 Shiprocket API Config
                </h3>
                <form onSubmit={handleSaveShiprocketSettings}>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input 
                      type="checkbox" 
                      id="shiprocketActive"
                      checked={shiprocketActive} 
                      onChange={e => setShiprocketActive(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="shiprocketActive" style={{ fontWeight: 'bold', cursor: 'pointer', margin: 0 }}>Enable Shiprocket Integration</label>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>API Login Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="e.g. test@shiprocket.com" 
                      value={shiprocketEmail} 
                      onChange={e => setShiprocketEmail(e.target.value)}
                      required={shiprocketActive}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginTop: '0.15rem' }}>
                      Use <b>test@shiprocket.com</b> to run in local simulation mode.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label>API Login Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder={shiprocketActive ? "••••••••" : "Enter Password"} 
                      value={shiprocketPassword} 
                      onChange={e => setShiprocketPassword(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginTop: '0.15rem' }}>
                      Leave blank to keep current password.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-secondary" style={{ flex: 1 }}>
                      <CheckCircle size={16} /> Save API Settings
                    </button>
                  </div>
                </form>

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Webhook Configuration</h4>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Shiprocket Webhook URL</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={shiprocketWebhookToken ? `${window.location.origin}/api/shiprocket/webhook?token=${shiprocketWebhookToken}` : 'Save configs first'} 
                      readOnly 
                      onClick={e => e.target.select()}
                      style={{ fontSize: '0.8rem', backgroundColor: '#F8F9FA', fontFamily: 'monospace' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block', marginTop: '0.2rem' }}>
                      Copy this URL and paste it in your Shiprocket Developer Portal under Webhook settings.
                    </span>
                  </div>
                  <button 
                    onClick={handleRegenerateWebhookToken} 
                    className="btn btn-outline" 
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', marginTop: '0.5rem', width: '100%' }}
                  >
                    Regenerate Secure Token
                  </button>
                </div>
              </div>

            </div>

            {/* Webhook Simulator Card (Test Utility) */}
            <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 'bold', fontFamily: 'var(--font-body)', color: 'var(--secondary)' }}>
                🧪 Shiprocket Webhook Simulator (Test Utility)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                Use this utility to test shipping status updates. This simulates Shiprocket sending status updates (like Picked Up, Shipped, Delivered) to your system.
              </p>

              <form onSubmit={handleSimulateWebhook} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label>Select Active Order (with Tracking AWB)</label>
                  <select 
                    className="form-input" 
                    value={simulatorOrderAwb} 
                    onChange={e => setSimulatorOrderAwb(e.target.value)}
                    required
                  >
                    <option value="">-- Select Order --</option>
                    {orders
                      .filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled')
                      .map(o => (
                        <option key={o.id} value={o.tracking_number || o.order_number}>
                          {o.order_number} ({o.customer_name}) - AWB: {o.tracking_number || 'Awaiting tracking assignment'}
                        </option>
                      ))
                    }
                  </select>
                  {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'orange', display: 'block', marginTop: '0.15rem' }}>
                      No active orders found in the queue.
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Shipment Status to Simulate</label>
                  <select 
                    className="form-input" 
                    value={simulatorStatusId} 
                    onChange={e => setSimulatorStatusId(e.target.value)}
                  >
                    <option value="10">Picked Up (Status ID: 10)</option>
                    <option value="6">Shipped / In Transit (Status ID: 6)</option>
                    <option value="7">Out for Delivery (Status ID: 7)</option>
                    <option value="17">Delivered (Status ID: 17)</option>
                    <option value="12">Cancelled (Status ID: 12)</option>
                  </select>
                </div>

                <div>
                  <button 
                    type="submit" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', padding: '0.6rem' }} 
                    disabled={isSimulatingWebhook}
                  >
                    {isSimulatingWebhook ? 'Triggering...' : 'Trigger Simulated Webhook'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
