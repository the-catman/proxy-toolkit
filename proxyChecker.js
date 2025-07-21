const fs = require("node:fs");
const util = require("./util");
const https = require("https");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");

const PROXIES_FILE = "proxies.txt";
const GOOD_PROXIES_FILE = "goodProxies.txt";
const TEST_URL = "https://httpbin.org/ip";
const REQUEST_TIMEOUT = 10000;

function loadProxies(file) {
    const raw = fs.readFileSync(file, "utf-8");
    return raw.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(proxy => {
            try {
                new URL(proxy);
                return true;
            } catch (e) {
                console.warn(`Skipping invalid proxy: ${proxy}`);
                return false;
            }
        });
}

function checkProxy(proxy) {
    return new Promise((resolve) => {
        const isHttp = proxy.startsWith("http");
        const agent = isHttp ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy);

        const req = https.request(TEST_URL, { agent, timeout: REQUEST_TIMEOUT }, (res) => {
            let data = "";

            res.on("data", chunk => (data += chunk));

            res.on("end", () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`Proxy ${proxy} works. IP: ${json.origin}`);
                        resolve({ proxy, success: true });
                    } catch {
                        console.warn(`Invalid JSON response from proxy ${proxy}`);
                        resolve({ proxy, success: false });
                    }
                } else {
                    console.warn(`Proxy ${proxy} returned status ${res.statusCode}`);
                    resolve({ proxy, success: false });
                }
            });
        });

        req.on("timeout", () => {
            console.warn(`Proxy ${proxy} timed out.`);
            req.destroy();
            resolve({ proxy, success: false });
        });

        req.on("error", (err) => {
            console.warn(`Proxy ${proxy} error: ${err.message}`);
            resolve({ proxy, success: false });
        });

        req.end();
    });
}

// Limit concurrency so that this doesn't overload the system or server
async function runWithConcurrency(tasks, limit) {
    const results = [];
    const executing = [];

    for (const task of tasks) {
        const p = task().then(result => {
            executing.splice(executing.indexOf(p), 1); // Remove ourselves from `executing` when done
            return result;
        });
        results.push(p);
        executing.push(p);
        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }

    return Promise.all(results);
}

(async () => {
    try {
        const proxies = loadProxies(PROXIES_FILE);
        console.log(`Loaded ${proxies.length} proxies.`);

        const tasks = proxies.map(proxy => () => checkProxy(proxy));
        const concurrencyLimit = 20; // Adjust as needed

        const results = await runWithConcurrency(tasks, concurrencyLimit);
        const newGoodProxies = results.filter(r => r.success).map(r => r.proxy);

        const storedProxies = loadProxies(GOOD_PROXIES_FILE);

        const allGoodProxies = storedProxies.concat(newGoodProxies);
        const processed = util.processProxies(allGoodProxies.join("\n")).trim();

        fs.writeFileSync(GOOD_PROXIES_FILE, processed);

        console.log(`${newGoodProxies.length} new good proxies added. Total: ${allGoodProxies.length}`);
    } catch (err) {
        console.error("Fatal error:", err);
        process.exit(1);
    }
})();
