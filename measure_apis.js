async function measure() {
  console.log("Measuring Baseline Performance...");
  
  const endpoints = [
    '/api/dashboard',
    '/api/reports',
    '/api/live'
  ];
  
  for (const ep of endpoints) {
    const start = Date.now();
    const res = await fetch(`http://localhost:3000${ep}`);
    const text = await res.text();
    const duration = Date.now() - start;
    const sizeKB = (text.length / 1024).toFixed(2);
    console.log(`Endpoint: ${ep} | Roundtrip Time: ${duration}ms | Payload Size: ${sizeKB} KB`);
  }
}

measure();
