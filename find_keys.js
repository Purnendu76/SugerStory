const http = require('https');

http.get('https://n8n.srv917960.hstgr.cloud/webhook/get-orders', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const orders = Array.isArray(json) ? json : (json.data || []);
      const matchedKeys = new Set();
      
      console.log('Total orders fetched:', orders.length);
      
      orders.forEach(order => {
        if (order.meta_data) {
          order.meta_data.forEach(m => {
            const k = m.key.toLowerCase();
            if (k.includes('lat') || k.includes('lon') || k.includes('lng') || k.includes('coord') || k.includes('map') || k.includes('loc')) {
              matchedKeys.add(m.key);
            }
          });
        }
      });
      
      console.log('Matched metadata keys:');
      console.log(Array.from(matchedKeys));
      
      // Let's also print metadata of the first order that has coordinates to see sample values
      const sampleOrder = orders.find(o => o.meta_data && o.meta_data.some(m => m.key.toLowerCase().includes('lat')));
      if (sampleOrder) {
        console.log('\nSample order ID:', sampleOrder.id);
        console.log('Coordinates metadata:');
        console.log(sampleOrder.meta_data.filter(m => {
          const k = m.key.toLowerCase();
          return k.includes('lat') || k.includes('lon') || k.includes('lng');
        }));
      } else {
        console.log('\nNo order found with "lat" in metadata keys.');
        // Let's inspect the keys of the first order's metadata
        if (orders[0]) {
          console.log('\nFirst order metadata keys:');
          console.log(orders[0].meta_data.map(m => m.key));
        }
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
