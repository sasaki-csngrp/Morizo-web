import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authenticatedMorizoAIRequest } from '@/lib/auth-server';
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

export async function GET(request: NextRequest) {
  const timer = ServerLogger.startTimer('subscription-usage-api');
  
  try {
    ServerLogger.info(LogCategory.API, '利用回数取得API呼び出し開始');

    // 認証チェック
    ServerLogger.debug(LogCategory.API, '認証チェック開始');
    const authResult = await authenticateRequest(request);
    
    // 認証失敗の場合はNextResponseを返す
    if (authResult instanceof NextResponse) {
      ServerLogger.warn(LogCategory.API, '認証失敗');
      return setCorsHeaders(authResult);
    }
    
    const { token } = authResult;
    ServerLogger.info(LogCategory.API, '認証成功', { tokenMasked: ServerLogger.maskToken(token) });

    // Morizo AIに送信（認証トークン付き）
    ServerLogger.info(LogCategory.API, 'Morizo AIに利用回数取得リクエスト送信開始');
    
    const url = `${MORIZO_AI_URL}/api/subscription/usage`;
    
    const aiResponse = await authenticatedMorizoAIRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, token);

    if (!aiResponse.ok) {
      const errorMsg = `Morizo AI エラー: ${aiResponse.status}`;
      ServerLogger.error(LogCategory.API, errorMsg, { status: aiResponse.status });
      throw new Error(errorMsg);
    }

    const data = await aiResponse.json();
    
    // 利用回数の値を取得
    const menuBulkCount = data.menu_bulk_count || 0;
    const menuStepCount = data.menu_step_count || 0;
    const ocrCount = data.ocr_count || 0;
    
    ServerLogger.info(LogCategory.API, 'Morizo AIからのレスポンス受信完了', { 
      success: data.success,
      date: data.date,
      planType: data.plan_type,
      menu_bulk_count: menuBulkCount,
      menu_step_count: menuStepCount,
      ocr_count: ocrCount
    });

    timer();
    logApiCall('GET', '/api/subscription/usage', 200, undefined);
    
    const nextResponse = NextResponse.json({
      success: data.success,
      date: data.date,
      menu_bulk_count: data.menu_bulk_count,
      menu_step_count: data.menu_step_count,
      ocr_count: data.ocr_count,
      plan_type: data.plan_type,
      limits: data.limits
    });
    
    return setCorsHeaders(nextResponse);

  } catch (error) {
    timer();
    logError(LogCategory.API, error, 'subscription-usage-api');
    logApiCall('GET', '/api/subscription/usage', 500, undefined, error instanceof Error ? error.message : '不明なエラー');
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Morizo AIとの通信に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
    return setCorsHeaders(errorResponse);
  }
}

