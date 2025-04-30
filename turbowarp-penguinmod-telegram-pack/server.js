const cors_proxy = require("cors-anywhere");

cors_proxy.createServer({
    originWhitelist: [], // Разрешить все домены
    requireHeader: [],
    removeHeaders: []
}).listen(8080, "127.0.0.1", function() {
    console.log("CORS Anywhere запущен на http://127.0.0.1:8080");
});
