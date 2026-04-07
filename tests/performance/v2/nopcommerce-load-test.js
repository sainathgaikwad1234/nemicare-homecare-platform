// ============================================================================
// nopCommerce Performance Test — Load Test v2 (Production-Grade)
// ============================================================================
// Target:    https://demo.nopcommerce.com
// Model:     RPS-based (constant-arrival-rate)
// SLAs:      p95 < 800ms | p99 < 1200ms | error rate < 1%
// Scenarios: 50% Browse | 30% Search | 20% Add-to-Cart
// Duration:  2min warm-up (excluded) + 5min test (measured)
// Fixes:     CDN-safe checks, CSRF token extraction, proper VU sizing
// ============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ─── CUSTOM METRICS ─────────────────────────────────────────────────────────
// Per-endpoint Trends give granular p50/p95/p99 beyond k6's global http_req_duration.
// Error Counters classify failures by root cause for diagnosis.

const errorRate        = new Rate('errors');
const serverErrors     = new Counter('server_5xx_errors');
const clientErrors     = new Counter('client_4xx_errors');
const rateLimitErrors  = new Counter('rate_limit_429_errors');
const timeoutErrors    = new Counter('timeout_errors');
const slowResponses    = new Counter('slow_responses_above_sla');

const homeDuration     = new Trend('home_page_duration', true);
const searchDuration   = new Trend('search_page_duration', true);
const productDuration  = new Trend('product_detail_duration', true);
const addCartDuration  = new Trend('add_to_cart_duration', true);
const viewCartDuration = new Trend('view_cart_duration', true);

// ─── CONFIGURATION ──────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'https://demo.nopcommerce.com';
const SLA_P95  = parseInt(__ENV.SLA_P95 || '800');

// ─── TEST DATA (SharedArray: parsed once, shared read-only across all VUs) ──

const products = new SharedArray('products', function () {
  return JSON.parse(open('./test-data/products.json'));
});

const searchTerms = new SharedArray('searchTerms', function () {
  return JSON.parse(open('./test-data/search-terms.json'));
});

const categories = ['/books', '/electronics', '/apparel', '/digital-downloads', '/computers', '/jewelry', '/gift-cards'];

// ─── OPTIONS: RPS-BASED SCENARIOS WITH WARM-UP ─────────────────────────────

export const options = {
  scenarios: {
    // Phase 1: Warm-up — 5 RPS for 2 min
    // Primes CDN cache, DB connection pool, JIT, in-memory cache.
    // Tagged {phase:warmup} → excluded from all thresholds.
    // maxVUs = 5 RPS × 5 endpoints × ~2s avg = 50 VUs needed
    warmup: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 15,
      maxVUs: 50,
      exec: 'warmupFlow',
      tags: { phase: 'warmup' },
    },

    // Phase 2: Browse (50% of 20 RPS = 10 RPS)
    browse: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '5m',
      startTime: '2m',
      preAllocatedVUs: 20,
      maxVUs: 60,
      exec: 'browseFlow',
      tags: { phase: 'test', scenario: 'browse' },
    },

    // Phase 3: Search (30% of 20 RPS = 6 RPS)
    search: {
      executor: 'constant-arrival-rate',
      rate: 6,
      timeUnit: '1s',
      duration: '5m',
      startTime: '2m',
      preAllocatedVUs: 12,
      maxVUs: 40,
      exec: 'searchFlow',
      tags: { phase: 'test', scenario: 'search' },
    },

    // Phase 4: Add-to-Cart (20% of 20 RPS = 4 RPS)
    add_to_cart: {
      executor: 'constant-arrival-rate',
      rate: 4,
      timeUnit: '1s',
      duration: '5m',
      startTime: '2m',
      preAllocatedVUs: 15,
      maxVUs: 50,
      exec: 'addToCartFlow',
      tags: { phase: 'test', scenario: 'cart' },
    },
  },

  thresholds: {
    // ── SLA Thresholds (test phase only — warmup excluded) ──
    'http_req_duration{phase:test}': [
      { threshold: 'p(95)<800', abortOnFail: false },
      { threshold: 'p(99)<1200', abortOnFail: false },
    ],
    'http_req_failed{phase:test}': [
      { threshold: 'rate<0.01', abortOnFail: false },
    ],

    // ── Per-Endpoint SLAs ──
    home_page_duration:       ['p(95)<1000'],
    search_page_duration:     ['p(95)<1200'],
    product_detail_duration:  ['p(95)<1000'],
    add_to_cart_duration:     ['p(95)<1200'],
    view_cart_duration:       ['p(95)<1000'],

    // ── Error Budget ──
    errors: ['rate<0.05'],

    // ── Test Exit Criteria (auto-abort if system is dying) ──
    'http_req_failed{phase:test}': [
      { threshold: 'rate<0.15', abortOnFail: true, delayAbortEval: '1m' },
    ],
    'http_req_duration{phase:test}': [
      { threshold: 'p(95)<5000', abortOnFail: true, delayAbortEval: '1m' },
    ],
  },
};

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Classify every response for root-cause analysis in the report.
function classifyError(res) {
  if (res.status >= 500) serverErrors.add(1);
  if (res.status >= 400 && res.status < 500 && res.status !== 429) clientErrors.add(1);
  if (res.status === 429) rateLimitErrors.add(1);
  if (res.timings.duration >= 30000) timeoutErrors.add(1);
  if (res.timings.duration > SLA_P95) slowResponses.add(1);
}

// Diagnostic log with enough context to identify root cause.
function logFailure(label, res, extra) {
  console.error(
    `FAILED: ${label} — status: ${res.status} — ` +
    `bodyLen: ${res.body ? res.body.length : 0} — ` +
    `encoding: ${res.headers['Content-Encoding'] || 'none'} — ` +
    `duration: ${Math.round(res.timings.duration)}ms` +
    (extra ? ` — ${extra}` : '')
  );
}

// CDN-safe check: status code + body length (NOT body.includes — breaks with gzip).
function safeCheck(res, label, minBodyLength) {
  return check(res, {
    [`${label}: status 200`]: (r) => r.status === 200,
    [`${label}: not blocked`]: (r) => r.status !== 403 && r.status !== 503,
    [`${label}: has content`]: (r) => r.body.length > (minBodyLength || 1000),
    [`${label}: response < SLA`]: (r) => r.timings.duration < SLA_P95,
  });
}

// ─── WARM-UP FLOW ───────────────────────────────────────────────────────────
// Hit every endpoint type once to prime caches, CDN edge, connection pools.
// Tagged {phase:warmup} — all metrics excluded from thresholds.

export function warmupFlow() {
  const p = { tags: { phase: 'warmup' } };
  http.get(`${BASE_URL}/`, p);
  sleep(0.5);
  http.get(`${BASE_URL}/search?q=book`, p);
  sleep(0.5);
  http.get(`${BASE_URL}/books`, p);
  sleep(0.5);
  http.get(`${BASE_URL}/fahrenheit-451-by-ray-bradbury`, p);
  sleep(0.5);
  http.get(`${BASE_URL}/cart`, p);
  sleep(0.5);
}

// ─── BROWSE FLOW (50% of traffic) ───────────────────────────────────────────
// Guest user: Home Page → Category Page → Product Detail
// Read-heavy, no writes. Random category + product for realistic cache behavior.

export function browseFlow() {
  const product = randomItem(products);
  const category = randomItem(categories);

  // Step 1: Home Page
  group('Browse — Home Page', () => {
    const res = http.get(`${BASE_URL}/`, {
      tags: { phase: 'test', scenario: 'browse', endpoint: 'home' },
    });
    if (!safeCheck(res, 'home', 5000)) {
      errorRate.add(1);
      logFailure('home', res);
    }
    classifyError(res);
    homeDuration.add(res.timings.duration);
  });

  sleep(Math.random() * 3 + 2); // Browse think time: 2-5s

  // Step 2: Category Page
  group('Browse — Category Page', () => {
    const res = http.get(`${BASE_URL}${category}`, {
      tags: { phase: 'test', scenario: 'browse', endpoint: 'category' },
    });
    if (!safeCheck(res, 'category', 3000)) {
      errorRate.add(1);
      logFailure('category', res);
    }
    classifyError(res);
  });

  sleep(Math.random() * 2 + 2); // 2-4s browsing product list

  // Step 3: Product Detail
  group('Browse — Product Detail', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`, {
      tags: { phase: 'test', scenario: 'browse', endpoint: 'product_detail' },
    });
    if (!safeCheck(res, 'product', 5000)) {
      errorRate.add(1);
      logFailure('product', res, `slug: ${product.slug}`);
    }
    classifyError(res);
    productDuration.add(res.timings.duration);
  });

  sleep(Math.random() * 2 + 1); // 1-3s reading product info
}

// ─── SEARCH FLOW (30% of traffic) ──────────────────────────────────────────
// Guest user: Search (random keyword) → View Product from Results
// Randomized terms prevent 100% cache hits and test search engine performance.

export function searchFlow() {
  const term = randomItem(searchTerms);
  const product = randomItem(products);

  // Step 1: Search
  group('Search — Query', () => {
    const res = http.get(`${BASE_URL}/search?q=${encodeURIComponent(term)}`, {
      tags: { phase: 'test', scenario: 'search', endpoint: 'search' },
    });
    if (!safeCheck(res, 'search', 3000)) {
      errorRate.add(1);
      logFailure('search', res, `term: ${term}`);
    }
    classifyError(res);
    searchDuration.add(res.timings.duration);
  });

  sleep(Math.random() * 2 + 1); // 1-3s scanning results

  // Step 2: Click Product from Results
  group('Search — View Product', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`, {
      tags: { phase: 'test', scenario: 'search', endpoint: 'product_detail' },
    });
    if (!safeCheck(res, 'search-product', 5000)) {
      errorRate.add(1);
      logFailure('search-product', res, `slug: ${product.slug}`);
    }
    classifyError(res);
    productDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 1); // 1-2s
}

// ─── ADD-TO-CART FLOW (20% of traffic) ──────────────────────────────────────
// Full purchase-intent journey:
//   Home → Search "book" → Product Detail (extract CSRF) → POST Add-to-Cart → View Cart
//
// CSRF Handling:
//   nopCommerce requires __RequestVerificationToken for POST requests.
//   We GET the product page with Accept-Encoding:identity (decompressed)
//   to extract the token via regex, then include it in the POST body.

export function addToCartFlow() {
  const bookProducts = products.filter(p => [36, 37, 38].includes(p.id));
  const product = bookProducts.length > 0 ? randomItem(bookProducts) : products[0];

  // Step 1: Home Page
  group('Cart — Home Page', () => {
    const res = http.get(`${BASE_URL}/`, {
      tags: { phase: 'test', scenario: 'cart', endpoint: 'home' },
    });
    if (!safeCheck(res, 'cart-home', 5000)) errorRate.add(1);
    classifyError(res);
    homeDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 1); // 1-2s

  // Step 2: Search "book"
  group('Cart — Search', () => {
    const res = http.get(`${BASE_URL}/search?q=book`, {
      tags: { phase: 'test', scenario: 'cart', endpoint: 'search' },
    });
    if (!safeCheck(res, 'cart-search', 3000)) errorRate.add(1);
    classifyError(res);
    searchDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 1); // 1-2s

  // Step 3: Product Detail + CSRF Token Extraction
  // Accept-Encoding:identity → get decompressed HTML for regex parsing
  let csrfToken = '';

  group('Cart — Product Detail', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`, {
      headers: { 'Accept-Encoding': 'identity' },
      tags: { phase: 'test', scenario: 'cart', endpoint: 'product_detail' },
    });

    if (!safeCheck(res, 'cart-product', 5000)) errorRate.add(1);
    classifyError(res);
    productDuration.add(res.timings.duration);

    // Extract CSRF token for the POST
    const match = res.body.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/);
    if (match) {
      csrfToken = match[1];
    } else {
      logFailure('csrf-extract', res, 'token not found in response body');
    }
  });

  sleep(Math.random() + 1); // 1-2s

  // Step 4: Add to Cart (POST with CSRF token)
  group('Cart — Add to Cart', () => {
    const payload = [
      `addtocart_${product.id}.EnteredQuantity=1`,
      `__RequestVerificationToken=${encodeURIComponent(csrfToken)}`,
    ].join('&');

    const res = http.post(
      `${BASE_URL}/addproducttocart/details/${product.id}/1`,
      payload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
        },
        tags: { phase: 'test', scenario: 'cart', endpoint: 'add_to_cart' },
      }
    );

    let isSuccess = false;
    try {
      isSuccess = JSON.parse(res.body).success === true;
    } catch (e) { /* not JSON */ }

    const passed = check(res, {
      'add-cart: status 200': (r) => r.status === 200,
      'add-cart: success=true': () => isSuccess,
      'add-cart: response < 1200ms': (r) => r.timings.duration < 1200,
    });

    if (!passed) {
      errorRate.add(1);
      logFailure('add-to-cart', res, `product: ${product.name} (ID:${product.id}) — hasToken: ${csrfToken.length > 0}`);
    }
    classifyError(res);
    addCartDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 1); // 1-2s

  // Step 5: View Cart
  group('Cart — View Cart', () => {
    const res = http.get(`${BASE_URL}/cart`, {
      tags: { phase: 'test', scenario: 'cart', endpoint: 'view_cart' },
    });
    if (!safeCheck(res, 'view-cart', 2000)) errorRate.add(1);
    classifyError(res);
    viewCartDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 1); // 1-2s
}
