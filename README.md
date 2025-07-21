# Proxy Toolkit

A small collection of JavaScript files which aids in proxy scraping and cleaning.

## Proxy Fetcher

Uses [proxyscrape's](https://proxyscrape.com/free-proxy-list) API to fetch a list of proxies and adds them to [proxies.txt](./proxies.txt).

## Proxy Checker

Uses [httpbin's](https://httpbin.org/ip) API to check a list of proxies and adds them to [goodProxies.txt](./goodProxies.txt).

## Installation & Usage

Clone or download the repository, then run:

```bash
$ npm install
```

This will install all necessary dependencies.

Run the following commands to run the proxy checker tool and proxy fetcher tool respectively:

```bash
$ node proxyChecker
```

```bash
$ node proxyFetcher
```

## Note

Proxies do tend to go stale, so make sure you update (and clean up) the list every so often.