import { Redis } from '@upstash/redis';

let client;

export function getRedis() {
  if (!client) client = Redis.fromEnv();
  return client;
}
