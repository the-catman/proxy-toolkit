const fs = require("node:fs");
const https = require("https");
const utilities = require("./util");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");

const proxies = fs.readFileSync("proxies.txt", "utf-8").split(/\r?\n/).filter((proxy) => {
    try {
        new URL(proxy);
        return true;
    } catch (err) {
        console.log(`Proxy ${proxy} is corrupted.`);
        return false;
    }
});

let goodProxies = [];

const checkProxy = (proxy) => {
    const agent = proxy.startsWith("http") ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy);

    return new Promise((resolve) => {
        const req = https.request("https://httpbin.org/ip", { agent }, (res) => {
            console.log(`Response from ${proxy}: ${res.statusCode}`);

            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        console.log(`Proxy ${proxy} seems to be working. Your IP: ${response.origin}`);
                        goodProxies.push(proxy);
                    } catch (error) {
                        console.error(`Failed to parse JSON from proxy ${proxy}: ${error.message}`);
                    }
                } else {
                    console.error(`Proxy ${proxy} returned status code ${res.statusCode}. Response: ${data}`);
                }
                req.destroy();
                resolve();
            });
        });

        req.on('error', (err) => {
            console.error(`Proxy ${proxy} failed: ${err.message}`);
            req.destroy();
            resolve();
        });

        setTimeout(() => {
            console.error(`Proxy ${proxy} forcefully timed out.`);
            req.destroy();
            resolve();
        }, 10000);

        req.end(); // End the request to send it
    });
};

(async () => {
    const promises = proxies.map(proxy => checkProxy(proxy));
    await Promise.all(promises);

    console.log("Writing to file...");

    const storedProxies = fs.readFileSync("goodProxies.txt", "utf-8");
    goodProxies = goodProxies.join('\n');

    const allProxies = utilities.processProxies(goodProxies + '\n' + storedProxies).trim();

    fs.writeFileSync("goodProxies.txt", allProxies);
})();
