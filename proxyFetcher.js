const fs = require("node:fs");
const util = require("./util");

const PROXIES_FILE = "proxies.txt";

const fetchProxies = async () => {
    const response = await fetch("https://api.proxyscrape.com/v4/free-proxy-list/get?request=get_proxies&proxy_format=protocolipport&format=text");
    return response.text();
};

const updateProxies = async () => {
    const fetchedProxies = await fetchProxies();
    const storedProxies = fs.readFileSync(PROXIES_FILE, "utf-8");

    const allProxies = util.processProxies(fetchedProxies + '\n' + storedProxies).trim();

    const newProxiesLength = allProxies.split('\n').length - storedProxies.split('\n').length

    console.log(`Acquired ${newProxiesLength} extra prox${newProxiesLength === 1 ? 'y' : "ies"}.`);
    fs.writeFileSync("proxies.txt", allProxies);
};

setInterval(updateProxies, 5 * 60 * 1000);
updateProxies();  // Run immediately on startup