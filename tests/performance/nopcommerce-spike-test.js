// ============================================================================
// nopCommerce Performance Test — Spike Test (sudden traffic burst)
// ============================================================================
// Simulates: flash sale, viral link, or bot traffic surge.
// Normal load → sudden 10x spike → sustained → drop back → recovery check.
// ============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const errorRate = new Rate('errors');
const homeDuration = new Trend('home_page_duration', true);
const searchDuration = new Trend('search_duration', true);

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
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '1m', target: 10 },     // Normal load
        { duration: '30s', target: 100 },    // SPIKE! 10x surge
        { duration: '2m', target: 100 },     // Sustained spike
        { duration: '30s', target: 10 },     // Drop back
        { duration: '2m', target: 10 },      // Recovery period
        { duration: '1m', target: 0 },       // Ramp down
      ],
      preAllocatedVUs: 20,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.10'],
  },
};

export default function () {
  const term = randomItem(searchTerms);
  const product = randomItem(products);

  group('Spike - Home', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'home 200': (r) => r.status === 200 }) || errorRate.add(1);
    homeDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 0.5);

  group('Spike - Search', () => {
    const res = http.get(`${BASE_URL}/search?q=${term}`);
    check(res, { 'search 200': (r) => r.status === 200 }) || errorRate.add(1);
    searchDuration.add(res.timings.duration);
  });

  sleep(Math.random() + 0.5);

  group('Spike - Product', () => {
    const res = http.get(`${BASE_URL}/${product.slug}`);
    check(res, { 'product 200': (r) => r.status === 200 }) || errorRate.add(1);
  });

  sleep(Math.random() + 0.5);
}
