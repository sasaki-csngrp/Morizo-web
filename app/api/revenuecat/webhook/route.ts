import { NextRequest, NextResponse } from 'next/server';
import { ServerLogger, LogCategory, logApiCall, logError } from '@/lib/logging-utils';

const MORIZO_AI_URL = process.env.MORIZO_AI_URL || 'http://localhost:8000';

// CORSヘッダーを設定するヘルパー関数
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// OPTIONSリクエストのハンドラー（CORS preflight）
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  const timer = ServerLogger.startTimer('revenuecat-webhook-api');
  
  try {
    ServerLogger.info(LogCategory.API, 'RevenueCat Webhook受信開始');

    // RevenueCatからのAuthorizationヘッダーを取得
    const authorization = request.headers.get('authorization');
    ServerLogger.debug(LogCategory.API, 'Authorizationヘッダー取得', { 
      hasAuth: !!authorization 
    });

    // リクエストボディを取得
    const body = await request.json();
    const eventType = body?.type || 'UNKNOWN';
    ServerLogger.debug(LogCategory.API, 'リクエストボディ解析完了', { 
      eventType: eventType,
      appUserId: body?.app_user_id
    });

    // morizo-aiv2にリクエストを転送
    ServerLogger.info(LogCategory.API, 'Morizo AIにWebhook転送開始');
    
    const url = `${MORIZO_AI_URL}/api/revenuecat/webhook`;
    
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization || '',
      },
      body: JSON.stringify(body),
    });

    if (!aiResponse.ok) {
      const errorMsg = `Morizo AI エラー: ${aiResponse.status}`;
      ServerLogger.error(LogCategory.API, errorMsg, { status: aiResponse.status });
      throw new Error(errorMsg);
    }

    const data = await aiResponse.json();
    ServerLogger.info(LogCategory.API, 'Morizo AIからのレスポンス受信完了', { 
      status: data.status,
      eventType: data.event_type
    });

    timer();
    logApiCall('POST', '/api/revenuecat/webhook', 200, undefined);
    
    const nextResponse = NextResponse.json(data);
    
    return setCorsHeaders(nextResponse);

  } catch (error) {
    timer();
    logError(LogCategory.API, error, 'revenuecat-webhook-api');
    logApiCall('POST', '/api/revenuecat/webhook', 500, undefined, error instanceof Error ? error.message : '不明なエラー');
    
    const errorResponse = NextResponse.json(
      { 
        status: 'error',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
    return setCorsHeaders(errorResponse);
  }
}

