
const http = require("http");

const data = JSON.stringify({
  name: "Test Discount " + Date.now(),
  type: "SEASONAL",
  value: 10,
  isPercentage: true,
  applyToAllServices: true,
  isActive: true
});

const options = {
  hostname: "localhost",
  port: 5001,
  path: "/api/discounts",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
    "Authorization": "Bearer TEST_TOKEN_PLACEHOLDER" // We might fail auth, but that gives 401/403 not 500
  }
};

console.log("Sending request to", options.hostname, options.port);

const req = http.request(options, (res) => {
  console.log("Status Code:", res.statusCode);
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => console.log("Response Body:", body));
});

req.on("error", (error) => {
  console.error("Request Error:", error);
});

req.write(data);
req.end();

