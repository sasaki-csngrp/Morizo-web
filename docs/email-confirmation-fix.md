# Supabase メール確認エラー (`email_not_confirmed`) の解決方法

ダミーユーザーやメールを受信できないユーザーで `email_not_confirmed` エラーが発生した場合の対処方法です。

## 方法1: Supabaseダッシュボードから操作（推奨）

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. **Authentication** > **Users** を開く
4. 対象のユーザーを検索して選択
5. ユーザー詳細画面で：
   - **「Confirm email」ボタンをクリック**、または
   - **「Email Confirmed At」** フィールドに現在の日時を設定

これが最も簡単で安全な方法です。

---

## 方法2: SQL Editorで直接更新

1. Supabaseダッシュボードで **SQL Editor** を開く
2. 以下のSQLクエリを実行：

```sql
-- 特定のメールアドレスのユーザーを確認済みにする
-- 注意: confirmed_atは生成カラムのため、email_confirmed_atのみを更新します
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-dummy-user@example.com';
```

3. **「Run」** をクリックして実行
4. 結果を確認

**注意**: メールアドレスを実際のダミーユーザーのメールアドレスに置き換えてください。

---

## 確認方法

メール確認が成功したかどうかは、以下の方法で確認できます：

1. **Supabaseダッシュボード**: Authentication > Users でユーザーの `Email Confirmed At` が設定されているか確認
2. **アプリケーション**: 再度ログインを試みて、`email_not_confirmed` エラーが解消されたか確認

---

## トラブルシューティング

### SQLクエリでエラーが出る場合

- `auth.users` テーブルへの直接アクセス権限があるか確認
- Supabaseのプロジェクトオーナーまたは管理者権限が必要です

---

