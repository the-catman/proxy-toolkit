/**
 * 
 * @param {*} string 
 * @returns string
 * @description Filters the same proxies as well as empty lines
 */
const processProxies = (string) => 
    Array.from(new Set(string.split('\n').filter(line => line.match(/\S+/)))).join('\n');

module.exports = {
    processProxies
};