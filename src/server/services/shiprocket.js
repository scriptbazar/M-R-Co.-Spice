import { dbGet, dbRun, dbAll } from '../../db/database.js';

// Base URL for Shiprocket API
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

/**
 * Gets a valid Shiprocket JWT token, either by returning the cached token
 * or requesting a new one from Shiprocket API if expired.
 * Supports mock simulation mode for test credentials.
 */
export async function getShiprocketToken() {
  try {
    const active = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_active'");
    if (!active || active.value !== '1') {
      return null;
    }

    const emailRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_email'");
    const passwordRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_password'");
    
    const email = emailRow?.value || '';
    const password = passwordRow?.value || '';

    if (!email || !password) {
      console.warn('Shiprocket integration is active but credentials are missing.');
      return null;
    }

    // Check for Simulation Mode
    if (email.trim().toLowerCase() === 'test@shiprocket.com') {
      return 'mock_token_123456_simulation';
    }

    // Retrieve cached token and expiry
    const cachedToken = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_token'");
    const expiryRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_token_expiry'");

    const now = new Date();
    if (cachedToken?.value && expiryRow?.value) {
      const expiry = new Date(expiryRow.value);
      if (expiry > now) {
        return cachedToken.value;
      }
    }

    // Fetch new token from Shiprocket API
    console.log('Fetching new token from Shiprocket API...');
    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shiprocket Auth Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const newToken = data.token;

    if (!newToken) {
      throw new Error('No token returned in Shiprocket login response.');
    }

    // Shiprocket tokens are valid for 10 days. Cache for 9 days for safety.
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 9);

    await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('shiprocket_token', ?)", [newToken]);
    await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('shiprocket_token_expiry', ?)", [newExpiry.toISOString()]);

    return newToken;
  } catch (error) {
    console.error('Error in getShiprocketToken:', error.message);
    return null;
  }
}

/**
 * Fetch tracking details for a specific AWB from Shiprocket API.
 * Gracefully falls back to mock tracking details if in simulation mode.
 */
export async function trackShiprocketShipment(awb) {
  try {
    const emailRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_email'");
    const email = emailRow?.value || '';

    // Simulation Mode Mock response
    if (email.trim().toLowerCase() === 'test@shiprocket.com') {
      console.log(`[Simulation] Mock tracking requested for AWB: ${awb}`);
      
      // Seed status based on last digit of AWB for test variety
      const digit = parseInt(awb.slice(-1)) || 0;
      let status = 'Delivered';
      let statusId = 17;
      let activity = 'Delivered to customer';

      if (digit % 4 === 1) {
        status = 'Picked Up';
        statusId = 10;
        activity = 'Package picked up by courier';
      } else if (digit % 4 === 2) {
        status = 'In Transit';
        statusId = 6;
        activity = 'Package in transit between hubs';
      } else if (digit % 4 === 3) {
        status = 'Out For Delivery';
        statusId = 7;
        activity = 'Out for delivery from local facility';
      } else if (digit === 0) {
        status = 'Cancelled';
        statusId = 12;
        activity = 'Shipment cancelled by seller';
      }

      return {
        success: true,
        is_mock: true,
        tracking_data: {
          track_status: 1,
          shipment_status_id: statusId,
          shipment_track: [
            {
              id: 9999,
              awb_code: awb,
              current_status: status,
              shipment_status_id: statusId,
              courier_name: 'Delhivery Mock',
              pickup_date: new Date(Date.now() - 86400000 * 2).toISOString(),
              delivered_date: status === 'Delivered' ? new Date().toISOString() : null
            }
          ],
          shipment_track_activities: [
            {
              activity,
              location: 'Noida Hub',
              date: new Date().toISOString(),
              'sr-status': status
            }
          ]
        }
      };
    }

    const token = await getShiprocketToken();
    if (!token) {
      throw new Error('Failed to retrieve Shiprocket authorization token.');
    }

    const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${awb}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Shiprocket Tracking Failed: status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      is_mock: false,
      tracking_data: data
    };
  } catch (error) {
    console.error(`Error tracking AWB ${awb}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Call Shiprocket Courier Serviceability API to calculate shipping charges dynamically based on pincode.
 * Senders pincode is fetched from settings 'store_pincode' (default: 110006).
 */
export async function getShiprocketServiceability(deliveryPostcode, weight, isCod) {
  try {
    const active = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_active'");
    if (!active || active.value !== '1') {
      return { success: false, error: 'Shiprocket integration is inactive.' };
    }

    const emailRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_email'");
    const email = emailRow?.value || '';

    // Mock Simulation Mode
    if (email.trim().toLowerCase() === 'test@shiprocket.com') {
      console.log(`[Simulation] Mock serviceability requested for: Pincode ${deliveryPostcode}, Weight ${weight}kg, COD ${isCod}`);
      
      const isLocalRegion = deliveryPostcode.startsWith('11') || deliveryPostcode.startsWith('201') || deliveryPostcode.startsWith('12');
      let cost = isLocalRegion ? 45 : 65;
      if (weight > 0.5) {
        const extraWeight = weight - 0.5;
        const extraHalfKgs = Math.ceil(extraWeight / 0.5);
        cost += extraHalfKgs * (isLocalRegion ? 20 : 30);
      }
      if (isCod) {
        cost += 40;
      }
      
      return {
        success: true,
        is_mock: true,
        available_couriers: [
          {
            courier_name: 'Delhivery Mock',
            rate: cost,
            etd: isLocalRegion ? '2-3 Days' : '4-7 Days',
            description: 'Fast delivery via Delhivery (Mock)'
          },
          {
            courier_name: 'Xpressbees Mock',
            rate: Math.round(cost * 0.95),
            etd: isLocalRegion ? '3-4 Days' : '5-8 Days',
            description: 'Standard delivery via Xpressbees (Mock)'
          }
        ]
      };
    }

    const token = await getShiprocketToken();
    if (!token) {
      throw new Error('Failed to retrieve Shiprocket authorization token.');
    }

    const pickupPincodeRow = await dbGet("SELECT value FROM settings WHERE key = 'store_pincode'");
    const pickupPincode = pickupPincodeRow?.value || '110006'; // default: Khari Baoli, Delhi

    // Call serviceability API
    const response = await fetch(
      `${SHIPROCKET_BASE_URL}/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPostcode}&weight=${weight}&cod=${isCod ? '1' : '0'}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Shiprocket Serviceability API returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 200) {
      throw new Error(data.message || 'Shiprocket API error');
    }

    // Extract couriers
    const courierCompanies = data.data?.available_courier_companies || [];
    const available_couriers = courierCompanies.map(c => ({
      courier_name: c.courier_name,
      rate: Math.round(parseFloat(c.rate || c.freight_charge || 0)),
      etd: c.etd || '3-5 Days',
      description: `Delivery via ${c.courier_name}`
    }));

    return {
      success: true,
      is_mock: false,
      available_couriers
    };
  } catch (error) {
    console.error('Error in getShiprocketServiceability:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Pushes an order to Shiprocket and assigns an AWB.
 * Updates local database state upon success.
 */
export async function pushOrderToShiprocket(orderId) {
  try {
    const order = await dbGet(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [orderId]
    );

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const address = await dbGet("SELECT * FROM addresses WHERE id = ?", [order.address_id]);
    if (!address) {
      return { success: false, error: 'Order address not found' };
    }

    const items = await dbAll(
      `SELECT oi.*, p.name as product_name, pv.weight_variant 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const emailRow = await dbGet("SELECT value FROM settings WHERE key = 'shiprocket_email'");
    const email = emailRow?.value || '';

    // 1. Simulation Mode
    if (email.trim().toLowerCase() === 'test@shiprocket.com') {
      const mockAwb = 'SR-MOCK-' + Math.floor(1000000000 + Math.random() * 9000000000);
      console.log(`[Simulation] Mock order push requested for Order: ${order.order_number}`);

      // Ensure Delivery Partner exists
      let partner = await dbGet("SELECT id FROM delivery_partners WHERE name LIKE '%Shiprocket%' LIMIT 1");
      if (!partner) {
        const result = await dbRun(
          "INSERT INTO delivery_partners (name, contact, type) VALUES ('Shiprocket (Delhivery)', '+91 11 4040 4040', 'courier')"
        );
        partner = { id: result.id };
      }

      const nextStatus = (order.status === 'Confirmed' || order.status === 'Packed' || order.status === 'Placed') ? 'Shipped' : order.status;

      await dbRun(
        "UPDATE orders SET delivery_partner_id = ?, tracking_number = ?, status = ? WHERE id = ?",
        [partner.id, mockAwb, nextStatus, orderId]
      );

      return {
        success: true,
        is_mock: true,
        awb_code: mockAwb,
        message: 'Order simulated on Shiprocket successfully'
      };
    }

    // 2. Production Mode
    const token = await getShiprocketToken();
    if (!token) {
      throw new Error('Failed to retrieve Shiprocket authorization token.');
    }

    // Calculate dynamic weight (Shiprocket requires kg)
    let totalWeightKg = 0;
    for (const item of items) {
      const qty = item.quantity;
      const match = (item.weight_variant || '').match(/^(\d+(?:\.\d+)?)\s*(g|kg)$/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === 'g') {
          totalWeightKg += (val / 1000) * qty;
        } else if (unit === 'kg') {
          totalWeightKg += val * qty;
        }
      } else {
        totalWeightKg += 0.2 * qty; // default 200g
      }
    }
    totalWeightKg = Math.max(totalWeightKg, 0.1); // minimum 100g

    // Parse buyer name into first & last name
    const nameParts = (order.customer_name || 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Format date: YYYY-MM-DD HH:MM
    const dateObj = new Date(order.ordered_at);
    const formattedDate = dateObj.toISOString().replace(/T/, ' ').replace(/\..+/, '').substring(0, 16);

    // Build Shiprocket payload
    const payload = {
      order_id: order.order_number,
      order_date: formattedDate,
      pickup_location: 'Primary',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: address.full_address,
      billing_city: address.city,
      billing_pincode: address.pincode,
      billing_state: address.state,
      billing_country: 'India',
      billing_email: order.customer_email || 'support@mrco.com',
      billing_phone: order.customer_phone || '9999999999',
      shipping_is_billing: true,
      order_items: items.map(item => ({
        name: item.product_name,
        sku: `SKU-${item.product_id}-${item.variant_id}`,
        units: item.quantity,
        selling_price: String(item.price)
      })),
      payment_method: order.payment_method === 'COD' ? 'COD' : 'Prepaid',
      sub_total: order.total_amount,
      length: 10,
      breadth: 10,
      height: 5,
      weight: parseFloat(totalWeightKg.toFixed(2))
    };

    console.log(`Pushing order ${order.order_number} to Shiprocket...`);

    // Create Order in Shiprocket
    const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shiprocket order creation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const shipmentId = data.shipment_id;
    if (!shipmentId) {
      throw new Error(`Shiprocket did not return a shipment ID: ${JSON.stringify(data)}`);
    }

    console.log(`Order created in Shiprocket. Shipment ID: ${shipmentId}. Assigning AWB...`);

    // Assign AWB
    const awbResponse = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ shipment_id: shipmentId })
    });

    if (!awbResponse.ok) {
      const errorText = await awbResponse.text();
      throw new Error(`Shiprocket AWB assignment failed: ${awbResponse.status} - ${errorText}`);
    }

    const awbData = await awbResponse.json();
    if (awbData.awb_assign_status !== 1) {
      const errorMsg = awbData.response?.data?.awb_assign_error || 'Unknown error assigning AWB';
      throw new Error(`Shiprocket AWB assignment error: ${errorMsg}`);
    }

    const awbCode = awbData.response?.data?.awb_code;
    const courierName = awbData.response?.data?.courier_name || 'Shiprocket Courier';

    if (!awbCode) {
      throw new Error('No AWB code returned from Shiprocket AWB assignment API.');
    }

    console.log(`Shiprocket assigned AWB: ${awbCode} via ${courierName}`);

    // Ensure Delivery Partner exists
    let partner = await dbGet("SELECT id FROM delivery_partners WHERE name LIKE ? LIMIT 1", [`%${courierName}%`]);
    if (!partner) {
      const result = await dbRun(
        "INSERT INTO delivery_partners (name, contact, type) VALUES (?, '', 'courier')",
        [`Shiprocket (${courierName})`]
      );
      partner = { id: result.id };
    }

    const nextStatus = (order.status === 'Confirmed' || order.status === 'Packed' || order.status === 'Placed') ? 'Shipped' : order.status;

    await dbRun(
      "UPDATE orders SET delivery_partner_id = ?, tracking_number = ?, status = ? WHERE id = ?",
      [partner.id, awbCode, nextStatus, orderId]
    );

    return {
      success: true,
      is_mock: false,
      awb_code: awbCode,
      message: 'Order pushed and tracking AWB generated successfully'
    };
  } catch (error) {
    console.error(`Failed to push order to Shiprocket:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
