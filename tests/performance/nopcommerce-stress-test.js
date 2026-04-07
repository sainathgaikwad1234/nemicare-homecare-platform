// ============================================================================
// nopCommerce Performance Test — Stress Test (push beyond capacity)
// ============================================================================
// Ramps from 20 RPS → 40 → 60 → 80 → 100 RPS to find the breaking point.
// Reuses flows from the load test.
// ============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const errorRate       = new Rate('errors');
const serverErrors    = new Counter('server_5xx_errors');
const slowResponses   = new Counter('slow_responses_above_sla');
const homeDuration    = new Trend('home_page_duration', true);
const searchDuration  = new Trend('search_duration', true);
const productDuration = new Trend('product_detail_duration', true);
const addCartDuration = new Trend('add_to_cart_duration', true);

const BASE_URL = __ENV.BASE_URL || 'https://demo.nopcommerce.com';
const SLA_P95  = parseInt(__ENV.SLA_P95 || '800');

const products = new SharedArray('products', function () {
  return JSON.parse(open('./test-data/products.json'));
});
const searchTerms = new SharedArray('searchTerms', function () {
  return JSON.parse(open('./test-data/search-terms.json'));
});

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function classifyError(res) {
  if (res.status >= 500) serverErrors.add(1);
  if (res.timings.duration > SLA_P95) slowResponses.add(1);
}

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 20,
      timeUnit: '1s',
      stages: [
        { duration: '2m', target: 20 },   // Baseline
        { duration: '3m', target: 40 },   // 2x load
        { duration: '3m', target: 60 },   // 3x load
        { duration: '3m', target: 80 },   // 4x load
        { duration: '3m', target: 100 },  // 5x load
        { duration: '2m', target: 0 },    // Ramp down
      ],
      preAllocatedVUs: 50,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: [
      { threshold: 'rate<0.50', abortOnFail: true, delayAbortEval: '1m' },
    ],
  },
};

export default function () {
  const product = randomItem(products);
  const term = randomItem(searchTerms);

  group('Stress - Home', () => {
    const res = http.get(`${BASE_URL}/`, { tags: { endpoint: 'home' } });
    check(res, { 'home 200': (r) => r.status === 200 }) || errorRate.add(1);
    classifyError(res);
    homeDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 0.5);

  group('Stress - Search', () => {
    const res = http.get(`${BASE_URL}/search?q=${term}`, { tags: { endpoint: 'search' } });
    check(res, { 'search 200': (r) => r.status === 200 }) || errorRate.add(1);
    classifyError(res);
    searchDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 0.5);

  group('Stress - Product', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`, { tags: { endpoint: 'product' } });
    check(res, { 'product 200': (r) => r.status === 200 }) || errorRate.add(1);
    classifyError(res);
    productDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 0.5);

  group('Stress - Add to Cart', () => {
    const res = http.post(
      `${BASE_URL}/addproducttocart/details/${product.id}/1`,
      `addtocart_${product.id}.EnteredQuantity=1`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
        },
        tags: { endpoint: 'add_to_cart' },
      }
    );
    check(res, { 'add-cart 200': (r) => r.status === 200 }) || errorRate.add(1);
    classifyError(res);
    addCartDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 0.5);
}
