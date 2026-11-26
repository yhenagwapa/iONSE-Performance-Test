
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 10,

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const response = http.get(
    'https://quickpizza.grafana.com'
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}