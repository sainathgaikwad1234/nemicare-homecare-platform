// ============================================================================
// nopCommerce Performance Test — Load Test (RPS-based)
// ============================================================================
// Target:   https://demo.nopcommerce.com
// Model:    RPS-based (constant-arrival-rate) — NOT VU-based
// SLAs:     p95 < 800ms, error rate < 1%
// Flows:    50% Browse, 30% Search, 20% Add-to-Cart
// Duration: 2min warm-up + 5min test
// ============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ============================================================================
// SECTION 1: Custom Metrics
// ============================================================================
// These give per-endpoint visibility beyond k6's built-in http_req_duration.
// Each Trend tracks response times for a specific page/action.
// Counters classify errors by type for root-cause analysis.

const errorRate       = new Rate('errors');
const serverErrors    = new Counter('server_5xx_errors');
const rateLimitErrors = new Counter('rate_limit_429_errors');
const timeoutErrors   = new Counter('timeout_errors');
const slowResponses   = new Counter('slow_responses_above_sla');

// Per-endpoint response time trends
const homeDuration    = new Trend('home_page_duration', true);
const searchDuration  = new Trend('search_duration', true);
const categoryDuration = new Trend('category_page_duration', true);
const productDuration = new Trend('product_detail_duration', true);
const addCartDuration = new Trend('add_to_cart_duration', true);
const viewCartDuration = new Trend('view_cart_duration', true);

// ============================================================================
// SECTION 2: Configuration
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'https://demo.nopcommerce.com';
const SLA_P95  = parseInt(__ENV.SLA_P95 || '800');  // ms

// ============================================================================
// SECTION 3: Test Data (SharedArray — loaded once, shared across all VUs)
// ============================================================================
// SharedArray is memory-efficient: data is parsed once and shared read-only
// across all VUs, unlike regular arrays which are copied per-VU.

const products = new SharedArray('products', function () {
  return JSON.parse(open('./test-data/products.json'));
});

const searchTerms = new SharedArray('searchTerms', function () {
  return JSON.parse(open('./test-data/search-terms.json'));
});

// Category pages to browse
const categories = [
  '/books', '/electronics', '/apparel', '/digital-downloads',
  '/computers', '/jewelry', '/gift-cards',
];

// ============================================================================
// SECTION 4: Options — RPS-based Scenarios with Warm-up
// ============================================================================
// WHY RPS-based (constant-arrival-rate)?
//   VU-based tests slow down when the server slows down (fewer iterations).
//   RPS-based tests maintain constant request pressure regardless of server
//   response time — this exposes queuing and saturation that VU-based misses.
//
// WHY Warm-up phase?
//   First requests hit cold caches, uninitialized connection pools, and cold
//   JIT. Measuring these as part of the test skews results. The warm-up phase
//   primes the system; its metrics are tagged {phase:warmup} and excluded
//   from thresholds.

export const options = {
  scenarios: {
    // ── Phase 1: Warm-up (2 min) ──
    // Low RPS to prime server caches, CDN, connection pools, JIT.
    // Tagged {phase:warmup} so thresholds ignore these metrics.
    // maxVUs = RPS(5) × endpoints_per_iteration(5) = 25 to prevent "Insufficient VUs"
    warmup: {
      executor: 'constant-arrival-rate',
      rate: 5,                  // 5 RPS — gentle warm-up
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 10,
      maxVUs: 30,               // 5 RPS × 5 endpoints × ~1s each = need 25+ VUs
      exec: 'warmupFlow',
      tags: { phase: 'warmup' },
    },

    // ── Phase 2: Browse scenario (50% of 20 RPS = 10 RPS) ──
    // Guest users browsing home page, categories, product details.
    browse: {
      executor: 'constant-arrival-rate',
      rate: 10,                 // 10 requests/second
      timeUnit: '1s',
      duration: '5m',
      startTime: '2m',          // Starts AFTER warm-up ends
      preAllocatedVUs: 15,
      maxVUs: 50,
      exec: 'browseFlow',
      tags: { phase: 'test', scenario: 'browse' },
    },

    // ── Phase 3: Search scenario (30% of 20 RPS = 6 RPS) ──
    // Users searching for products and viewing results.
    search: {
      executor: 'constant-arrival-rate',
      rate: 6,                  // 6 requests/second
      timeUnit: '1s',
      duration: '5m',
      startTime: '2m',
      preAllocatedVUs: 10,
      maxVUs: 30,
      exec: 'searchFlow',
      tags: { phase: 'test', scenario: 'search' },
    },

    // ── Phase 4: Add-to-Cart scenario (20% of 20 RPS = 4 RPS) ──
    // Users searching, viewing a product, adding to cart, viewing cart.
    add_to_cart: {
      executor: 'constant-arrival-rate',
      rate: 4,                  // 4 requests/second
      timeUnit: '1s',
      duration: '5m',
      startTime: '2m',
      preAllocatedVUs: 8,
      maxVUs: 25,
      exec: 'addToCartFlow',
      tags: { phase: 'test', scenario: 'cart' },
    },
  },

  // ── Thresholds (SLA validation) ──
  // Only applied to {phase:test} — warm-up metrics are excluded.
  thresholds: {
    // Global SLAs
    'http_req_duration{phase:test}': [
      { threshold: 'p(95)<800', abortOnFail: false },   // SLA: p95 < 800ms
      { threshold: 'p(99)<2000', abortOnFail: false },
    ],
    'http_req_failed{phase:test}': [
      { threshold: 'rate<0.01', abortOnFail: false },    // SLA: error rate < 1%
    ],

    // Per-endpoint SLAs
    home_page_duration:    ['p(95)<600'],
    search_duration:       ['p(95)<1000'],
    category_page_duration: ['p(95)<800'],
    product_detail_duration: ['p(95)<800'],
    add_to_cart_duration:  ['p(95)<1000'],
    view_cart_duration:    ['p(95)<800'],

    // Error classification
    errors:                ['rate<0.05'],

    // ── Test Exit Criteria (auto-abort if system is dying) ──
    'http_req_failed{phase:test}': [
      { threshold: 'rate<0.10', abortOnFail: true, delayAbortEval: '1m' },
      // Abort if error rate > 10% sustained for 1 minute
    ],
    'http_req_duration{phase:test}': [
      { threshold: 'p(95)<5000', abortOnFail: true, delayAbortEval: '1m' },
      // Abort if p95 > 5s sustained for 1 minute (system unresponsive)
    ],
  },
};

// ============================================================================
// SECTION 5: Helper Functions
// ============================================================================

// Classify errors for root-cause analysis in the report.
// Instead of just counting "errors", we distinguish server bugs (5xx),
// throttling (429), timeouts, and slow-but-not-failed responses.
function classifyError(res) {
  if (res.status >= 500) serverErrors.add(1);
  if (res.status === 429) rateLimitErrors.add(1);
  if (res.timings.duration >= 30000) timeoutErrors.add(1);
  if (res.timings.duration > SLA_P95) slowResponses.add(1);
}

// Pick a random element from a SharedArray
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Realistic think time: random 1-3 seconds (simulates user reading/deciding)
function thinkTime(minSec, maxSec) {
  sleep(Math.random() * (maxSec - minSec) + minSec);
}

// ============================================================================
// SECTION 6: Warm-up Flow
// ============================================================================
// Purpose: Prime server caches, CDN edge, DB connection pool, and JIT.
// These requests are tagged {phase:warmup} and excluded from all thresholds.
// We hit every endpoint type once to ensure nothing is cold during the test.

export function warmupFlow() {
  const params = { tags: { phase: 'warmup' } };

  // Hit home page
  http.get(`${BASE_URL}/`, params);

  // Hit a search
  http.get(`${BASE_URL}/search?q=book`, params);

  // Hit a category page
  http.get(`${BASE_URL}/books`, params);

  // Hit a product detail page
  http.get(`${BASE_URL}/fahrenheit-451-by-ray-bradbury`, params);

  // Hit cart page
  http.get(`${BASE_URL}/cart`, params);

  sleep(1);
}

// ============================================================================
// SECTION 7: Browse Flow (50% of traffic)
// ============================================================================
// Simulates a guest user browsing:
//   Home Page → Category Page → Product Detail Page
//
// This is the most common user behavior — read-heavy, no writes.
// Random category and product selection prevents unrealistic cache hits.

export function browseFlow() {
  const product = randomItem(products);

  // Step 1: Open Home Page
  group('Browse - Home Page', () => {
    const res = http.get(`${BASE_URL}/`, {
      tags: { phase: 'test', scenario: 'browse', endpoint: 'home' },
    });

    // NOTE: Body content checks (r.body.includes()) fail when CDN compresses responses.
    // Use status-code + body-length checks instead for reliability.
    const success = check(res, {
      'home: status 200': (r) => r.status === 200,
      'home: not error/challenge page': (r) => r.status !== 403 && r.status !== 503,
      'home: has substantial content': (r) => r.body.length > 5000,
      'home: response < 800ms': (r) => r.timings.duration < SLA_P95,
    });

    if (!success) errorRate.add(1);
    classifyError(res);
    homeDuration.add(res.timings.duration);
  });

  thinkTime(1, 3);  // User reads home page

  // Step 2: Browse a Category
  group('Browse - Category Page', () => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const res = http.get(`${BASE_URL}${category}`, {
      tags: { phase: 'test', scenario: 'browse', endpoint: 'category' },
    });

    const success = check(res, {
      'category: status 200': (r) => r.status === 200,
      'category: has content': (r) => r.body.length > 5000,
      'category: response < 800ms': (r) => r.timings.duration < SLA_P95,
    });

    if (!success) errorRate.add(1);
    classifyError(res);
    categoryDuration.add(res.timings.duration);
  });

  thinkTime(2, 4);  // User browses product list

  // Step 3: View Product Detail
  group('Browse - Product Detail', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`, {
      tags: { phase: 'test', scenario: 'browse', endpoint: 'product_detail' },
    });

    const success = check(res, {
      'product: status 200': (r) => r.status === 200,
      'product: has content': (r) => r.body.length > 5000,
      'product: response < 800ms': (r) => r.timings.duration < SLA_P95,
    });

    if (!success) {
      errorRate.add(1);
      console.error(
        `Browse: Product FAILED — ${product.slug} — status: ${res.status} — ` +
        `body length: ${res.body.length} — encoding: ${res.headers['Content-Encoding'] || 'none'}`
      );
    }
    classifyError(res);
    productDuration.add(res.timings.duration);
  });

  thinkTime(1, 2);  // User reads product details
}

// ============================================================================
// SECTION 8: Search Flow (30% of traffic)
// ============================================================================
// Simulates a user searching for products:
//   Search for a keyword → View a product from results
//
// Randomized search terms prevent 100% cache hits and test the search
// engine's performance across different query patterns.

export function searchFlow() {
  const term = randomItem(searchTerms);
  const product = randomItem(products);

  // Step 1: Search for a product
  group('Search - Query', () => {
    const res = http.get(`${BASE_URL}/search?q=${encodeURIComponent(term)}`, {
      tags: { phase: 'test', scenario: 'search', endpoint: 'search' },
    });

    const success = check(res, {
      'search: status 200': (r) => r.status === 200,
      'search: has content': (r) => r.body.length > 3000,
      'search: response < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (!success) {
      errorRate.add(1);
      console.error(
        `Search: FAILED for "${term}" — status: ${res.status} — ` +
        `body length: ${res.body.length} — encoding: ${res.headers['Content-Encoding'] || 'none'}`
      );
    }
    classifyError(res);
    searchDuration.add(res.timings.duration);
  });

  thinkTime(1, 3);  // User reads search results

  // Step 2: Click into a product from results
  group('Search - View Product', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`, {
      tags: { phase: 'test', scenario: 'search', endpoint: 'product_detail' },
    });

    const success = check(res, {
      'search-product: status 200': (r) => r.status === 200,
      'search-product: has content': (r) => r.body.length > 5000,
      'search-product: response < 800ms': (r) => r.timings.duration < SLA_P95,
    });

    if (!success) errorRate.add(1);
    classifyError(res);
    productDuration.add(res.timings.duration);
  });

  thinkTime(1, 2);
}

// ============================================================================
// SECTION 9: Add-to-Cart Flow (20% of traffic)
// ============================================================================
// Simulates the full purchase intent journey:
//   Home → Search "book" → Product Detail → Add to Cart → View Cart
//
// This is the most complex and business-critical flow.
// The POST to /addproducttocart/details/{id}/1 is the write operation
// that tests server-side state management (session/cart storage).
//
// Note: nopCommerce uses cookie-based sessions for guest carts.
// k6 automatically maintains cookies per VU via its cookie jar,
// so cart state persists across requests within the same VU iteration.

export function addToCartFlow() {
  // Pick a random book product (IDs 36-38 are books on the demo store)
  const bookProducts = products.filter(p => [36, 37, 38].includes(p.id));
  const product = bookProducts.length > 0 ? randomItem(bookProducts) : products[0];

  // Step 1: Open Home Page
  group('Cart - Home Page', () => {
    const res = http.get(`${BASE_URL}/`, {
      tags: { phase: 'test', scenario: 'cart', endpoint: 'home' },
    });

    check(res, {
      'cart-home: status 200': (r) => r.status === 200,
      'cart-home: has content': (r) => r.body.length > 5000,
    }) || errorRate.add(1);

    classifyError(res);
    homeDuration.add(res.timings.duration);
  });

  thinkTime(1, 2);

  // Step 2: Search for "book"
  group('Cart - Search', () => {
    const res = http.get(`${BASE_URL}/search?q=book`, {
      tags: { phase: 'test', scenario: 'cart', endpoint: 'search' },
    });

    check(res, {
      'cart-search: status 200': (r) => r.status === 200,
      'cart-search: has content': (r) => r.body.length > 3000,
    }) || errorRate.add(1);

    classifyError(res);
    searchDuration.add(res.timings.duration);
  });

  thinkTime(1, 2);

  // Step 3: View Product Detail + Extract CSRF Token
  // nopCommerce requires __RequestVerificationToken for POST requests.
  // We extract it from the product page HTML before adding to cart.
  // Using 'Accept-Encoding: identity' to get uncompressed HTML for regex parsing.
  let csrfToken = '';

  group('Cart - Product Detail', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`, {
      headers: { 'Accept-Encoding': 'identity' },  // Disable compression for body parsing
      tags: { phase: 'test', scenario: 'cart', endpoint: 'product_detail' },
    });

    check(res, {
      'cart-product: status 200': (r) => r.status === 200,
      'cart-product: has content': (r) => r.body.length > 5000,
    }) || errorRate.add(1);

    // Extract CSRF token from the page for the add-to-cart POST
    const tokenMatch = res.body.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/);
    if (tokenMatch) {
      csrfToken = tokenMatch[1];
    }

    classifyError(res);
    productDuration.add(res.timings.duration);
  });

  thinkTime(1, 2);

  // Step 4: Add Product to Cart (POST — the critical write operation)
  // nopCommerce endpoint: POST /addproducttocart/details/{productId}/1
  // The "1" means ShoppingCartType = ShoppingCart (vs 2 = Wishlist)
  // CSRF token extracted from Step 3 is REQUIRED — without it, server returns 400.
  group('Cart - Add to Cart', () => {
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

    const success = check(res, {
      'add-cart: status 200': (r) => r.status === 200,
      'add-cart: success response': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch (e) {
          return false;
        }
      },
      'add-cart: response < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (!success) {
      errorRate.add(1);
      console.error(
        `Add to Cart FAILED — product: ${product.name} (ID: ${product.id}) — ` +
        `status: ${res.status} — hasToken: ${csrfToken.length > 0} — ` +
        `body: ${res.body.substring(0, 200)}`
      );
    }
    classifyError(res);
    addCartDuration.add(res.timings.duration);
  });

  thinkTime(1, 2);

  // Step 5: View Cart
  group('Cart - View Cart', () => {
    const res = http.get(`${BASE_URL}/cart`, {
      tags: { phase: 'test', scenario: 'cart', endpoint: 'view_cart' },
    });

    const success = check(res, {
      'view-cart: status 200': (r) => r.status === 200,
      'view-cart: has content': (r) => r.body.length > 2000,
      'view-cart: response < 800ms': (r) => r.timings.duration < SLA_P95,
    });

    if (!success) errorRate.add(1);
    classifyError(res);
    viewCartDuration.add(res.timings.duration);
  });

  thinkTime(1, 2);
}
