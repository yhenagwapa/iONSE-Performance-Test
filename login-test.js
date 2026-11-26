
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('test users', function () {
  return open('./users.csv')
    .trim()
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const [account, password] = line.trim().split(',');
      return { account, password };
    });
});

export const options = {
  stages: [
  { duration: '10s', target: 1 },
  { duration: '10s', target: 5 },
  { duration: '10s', target: 10 },
  { duration: '5s', target: 0 },
],

  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:login}': ['p(95)<1000'],
    checks: ['rate>0.99']
  },
};

export default function () {
  // Assign a dedicated account to each virtual user.
  const user = users[(__VU - 1) % users.length];

  const baseUrl = __ENV.BASE_URL;
  const loginPath = __ENV.LOGIN_PATH;

  if (!baseUrl || !loginPath) {
    throw new Error('Set BASE_URL and LOGIN_PATH first.');
  }

  const payload = JSON.stringify({
    account: user.account,
    password: user.password
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: {
      endpoint: 'login',
    },
    timeout: '30s',
  };

  const response = http.post(
    `${baseUrl}${loginPath}`,
    payload,
    params
  );

console.log(`Status: ${response.status}`);
console.log(`Duration: ${response.timings.duration} ms`);
console.log(`Response: ${String(response.body).slice(0, 200)}`);

  check(response, {
  'login returned HTTP 201': (r) => r.status === 201,
  'login response is not empty': (r) => r.body !== null && r.body.length > 0,
});

  sleep(1);
}