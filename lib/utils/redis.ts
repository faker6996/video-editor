import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

export const redis =
  global.redis ??
  new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true, // mở kết nối khi lần đầu dùng
    maxRetriesPerRequest: null, // tránh lỗi trong môi trường serverless
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV !== "production") global.redis = redis;
