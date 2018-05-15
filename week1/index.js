const crypto = require('crypto');
const result = crypto.createHash('md5').update("AAkj7hkjhAAA8AAA").digest("hex");
console.log("result = ", result);
