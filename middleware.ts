import { NextRequest, NextResponse } from 'next/server';

function getJSTTimestamp(): string {
  // JST（日本時間）を取得してISO形式で返す
  const now = new Date();
  // Intl.DateTimeFormatを使用してJST時間を取得
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // ミリ秒を取得
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  // JST時間をフォーマット
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}+09:00`;
}

export function middleware(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Edge Runtime対応のシンプルなログ
  console.log(`[MIDDLEWARE] HTTPリクエスト受信: ${request.method} ${request.nextUrl.pathname}`, {
    requestId,
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    timestamp: getJSTTimestamp()
  });

  // レスポンスを返す前にログを記録
  const response = NextResponse.next();
  
  response.headers.set('X-Request-ID', requestId);
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
