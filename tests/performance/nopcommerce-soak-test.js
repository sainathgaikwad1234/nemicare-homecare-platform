// ============================================================================
// nopCommerce Performance Test — Soak Test (30-minute sustained load)
// ============================================================================
// Detects: memory leaks, connection pool exhaustion, gradual degradation.
// Maintains 20 RPS for 30 minutes and watches for p95 drift.
// ============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const errorRate = new Rate('errors');
const serverErrors = new Counter('server_5xx_errors');
const homeDuration = new Trend('home_page_duration', true);
const searchDuration = new Trend('search_duration', true);
const productDuration = new Trend('product_detail_duration', true);

const BASE_URL = __ENV.BASE_URL || 'https://demo.nopcommerce.com';

const products = new SharedArray('products', function () {
  return JSON.parse(open('./test-data/products.json'));
});
const searchTerms = new SharedArray('searchTerms', function () {
  return JSON.parse(open('./test-data/search-terms.json'));
});

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30m',
      preAllocatedVUs: 30,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const term = randomItem(searchTerms);
  const product = randomItem(products);

  group('Soak - Home', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'home 200': (r) => r.status === 200 }) || errorRate.add(1);
    if (res.status >= 500) serverErrors.add(1);
    homeDuration.add(res.timings.duration);
  });

  sleep(Math.random() * 2 + 1);

  group('Soak - Search', () => {
    const res = http.get(`${BASE_URL}/search?q=${term}`);
    check(res, { 'search 200': (r) => r.status === 200 }) || errorRate.add(1);
    if (res.status >= 500) serverErrors.add(1);
    searchDuration.add(res.timings.duration);
  });

  sleep(Math.random() * 2 + 1);

  group('Soak - Product', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`);
    check(res, { 'product 200': (r) => r.status === 200 }) || errorRate.add(1);
    if (res.status >= 500) serverErrors.add(1);
    productDuration.add(res.timings.duration);
  });

  sleep(Math.random() * 2 + 1);
}
