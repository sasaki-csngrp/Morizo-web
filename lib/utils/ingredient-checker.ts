/**
 * 不足食材チェックユーティリティ
 * 
 * レシピに必要な食材と使える食材を比較し、不足している食材を判定します。
 * 一般的な調味料や水などは不足食材として判定しません。
 */

// 不足食材チェックから除外する食材リスト（一般的な調味料・水など）
const EXCLUDED_INGREDIENTS = [
  '水',
  'はちみつ',
  'ハチミツ',
  '塩',
  'こしょう',
  '胡椒',
  'コショウ',
  '醤油',
  'しょうゆ',
  '味噌',
  'みそ',
  '砂糖',
  'みりん',
  '酒',
  '料理酒',
  '酢',
  '油',
  'サラダ油',
  'オリーブオイル',
  'ごま油',
  'バター',
  'マヨネーズ',
  'ケチャップ',
  'ウスターソース',
  'オイスターソース',
  '豆板醤',
  '甜麺醤',
  '味の素',
  'だし',
  'だしの素',
  'コンソメ',
  '顆粒だし',
  'チューブ生姜',
  'チューブにんにく',
  'ネギ分', // 「ネギ分」のような表記も除外
  'ブラックペッパー',
  'ブラックペッパ',
  'ペッパー',
  'ガーリックパウダー',
  'ガーリックパウダ',
  'にんにくパウダー',
  'にんにくパウダ',
  'パルメザンチーズ',
  'パルメザン',
  'パルメザンチーズ粉',
  'めんつゆ',
  'メンツユ',
  '栗粉',
  'くりこ',
  '片栗粉',
  'かたくりこ',
  'スープ',
  '生姜',
  'しょうが',
  'ショウガ',
  'おろし生姜',
  'おろししょうが',
  'おろしショウガ',
  'にんにく',
  'ニンニク',
  'おろしにんにく',
  'おろしニンニク',
  'ガラスープの素',
  'がらスープの素',
  '鶏がらスープの素',
  '鶏ガラスープの素',
  'ＢＰ',
  'bp',
  'ベーキングパウダー',
  'ベーキングパウダ',
  'カレールー',
  'カレー粉',
  '米粉',
  'こめこ',
  'クレージーソルト',
  'コーンスターチ',
].map(ing => ing.toLowerCase());

/**
 * カタカナをひらがなに変換する関数
 * 
 * @param text - 変換するテキスト
 * @returns ひらがなに変換されたテキスト
 */
function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (char) => {
    // カタカナをひらがなに変換（Unicode範囲: ァ-ヶ）
    return String.fromCharCode(char.charCodeAt(0) - 0x60);
  });
}

/**
 * 食材名を正規化する関数（カタカナ→ひらがな変換を含む）
 * 
 * @param ingredient - 食材名
 * @returns 正規化された食材名
 */
function normalizeIngredientName(ingredient: string): string {
  // トリムして小文字に変換
  let normalized = ingredient.trim().toLowerCase();
  
  // カタカナをひらがなに変換
  normalized = katakanaToHiragana(normalized);
  
  return normalized;
}

/**
 * 不足食材を判定する関数
 * 
 * @param recipeIngredients - レシピに必要な食材リスト
 * @param availableIngredients - 使える食材リスト
 * @returns 不足している食材リスト
 */
export function getMissingIngredients(
  recipeIngredients: string[],
  availableIngredients: string[]
): string[] {
  if (!availableIngredients || availableIngredients.length === 0) {
    return []; // 使える食材情報がない場合は判定しない
  }

  // 使える食材を正規化してSetに格納（カタカナ→ひらがな変換を含む）
  const availableSet = new Set(
    availableIngredients.map(ing => normalizeIngredientName(ing))
  );

  return recipeIngredients.filter(ingredient => {
    const normalizedIngredient = normalizeIngredientName(ingredient);
    
    // 除外リストに含まれる食材は不足食材として判定しない
    if (EXCLUDED_INGREDIENTS.some(excluded => 
      normalizedIngredient.includes(excluded) || excluded.includes(normalizedIngredient)
    )) {
      return false;
    }

    // 完全一致をチェック
    if (availableSet.has(normalizedIngredient)) {
      return false;
    }
    
    // 部分一致もチェック（「豚バラ肉」と「豚バラ」など）
    const isContained = Array.from(availableSet).some(availableIng => 
      normalizedIngredient.includes(availableIng) || availableIng.includes(normalizedIngredient)
    );
    return !isContained;
  });
}

