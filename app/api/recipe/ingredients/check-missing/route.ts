import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-server';
import { ServerLogger, LogCategory, logApiCall, logError } from '@/lib/logging-utils';
import { getMissingIngredients } from '@/lib/utils/ingredient-checker';
import { CheckMissingIngredientsRequest, CheckMissingIngredientsResponse } from '@/types/menu';

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
  const timer = ServerLogger.startTimer('check-missing-ingredients-api');
  
  try {
    ServerLogger.info(LogCategory.API, '不足食材チェックAPI呼び出し開始');
    
    const body: CheckMissingIngredientsRequest = await request.json();
    ServerLogger.debug(LogCategory.API, 'リクエストボディ解析完了', { 
      recipeIngredientsCount: body.recipeIngredients?.length || 0,
      availableIngredientsCount: body.availableIngredients?.length || 0
    });

    // バリデーション
    if (!body.recipeIngredients || !Array.isArray(body.recipeIngredients)) {
      ServerLogger.warn(LogCategory.API, '無効なリクエスト: recipeIngredientsが配列ではない', { 
        recipeIngredients: body.recipeIngredients 
      });
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'recipeIngredients must be an array' 
        } as CheckMissingIngredientsResponse,
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

    if (!body.availableIngredients || !Array.isArray(body.availableIngredients)) {
      ServerLogger.warn(LogCategory.API, '無効なリクエスト: availableIngredientsが配列ではない', { 
        availableIngredients: body.availableIngredients 
      });
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'availableIngredients must be an array' 
        } as CheckMissingIngredientsResponse,
        { status: 400 }
      );
      return setCorsHeaders(response);
    }

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

    // 不足食材を判定
    ServerLogger.debug(LogCategory.API, '不足食材判定開始');
    const missingIngredients = getMissingIngredients(
      body.recipeIngredients,
      body.availableIngredients
    );
    
    ServerLogger.info(LogCategory.API, '不足食材判定完了', { 
      missingCount: missingIngredients.length,
      missingIngredients: missingIngredients
    });

    timer();
    logApiCall('POST', '/api/recipe/ingredients/check-missing', 200, undefined);
    
    const result: CheckMissingIngredientsResponse = {
      success: true,
      missingIngredients: missingIngredients
    };
    
    const nextResponse = NextResponse.json(result);
    return setCorsHeaders(nextResponse);

  } catch (error) {
    timer();
    logError(LogCategory.API, error, 'check-missing-ingredients-api');
    logApiCall('POST', '/api/recipe/ingredients/check-missing', 500, undefined, error instanceof Error ? error.message : '不明なエラー');
    
    const errorResponse = NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      } as CheckMissingIngredientsResponse,
      { status: 500 }
    );
    return setCorsHeaders(errorResponse);
  }
}

