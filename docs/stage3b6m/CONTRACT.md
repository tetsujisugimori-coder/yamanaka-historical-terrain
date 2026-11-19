# Stage 3-B6m: 404 If-None-Match 有無の独立比較

## 目的と既存結果
PR #55 の既存 Draft ブランチに限定する。B6aの失敗原ZIPは変更・再保存しない。既存B6a/B6l原票では、合成404についてサーバー側 96 bytes と response.finish を記録した一方、Playwrightの body は0 bytes、requestfailed、response.finished() の期限超過が観測されていた。root cause はUNKNOWN。304は別問題であり、キャッシュ使用実byteはUNKNOWN。

## 単一因子の制御
同じ合成 `missing` 応答（phase 1 = 200、phase 2 = 404・96 bytes）、同じPlaywright 1.56.1、同じブラウザ版・viewport・serviceWorkers=block・同じpage.route APIを使う。phase 2 の asset.js の `If-None-Match` だけを明示的に `"first"` にする／削除する。試験順は present → absent → absent → present。毎回新しいBrowserContextを使い、繰り返しと実要求ヘッダを照合する。**両群でroutingが使われるため、過去のroutingなし原票と同条件とは扱わない。**

## 収録する観測
各回のサーバー request/response、status・ETag・表現SHA・96 bytes、socket接続/終了/error、response.finish/close、Playwright response.body/finished、requestfinished/requestfailed、timeout、context.close、初発失敗を元の生データで残す。比較summaryはそれらの抜粋と実要求If-None-Matchを記録する。元の `runCacheDiagnostics` のdefault plansを変更せず、B6m専用の明示的planだけでrouteを有効化する。

実要求ヘッダ、404・96 bytes、サーバーfinish、二回のroute通過および同一表現が確認できない場合はINCOMPLETE。両群で通知差があっても直ちに因果確定とはしない。404の原因と304のキャッシュ実使用byteは独立にUNKNOWNのまま。

## 提出・審査
既存B6lの専用workflowへ独立した単体反例とブラウザ比較を追加し、Chromium/WebKitのpush・PR条件で実行する。B6a本番相当・他ブラウザ検査の受入ゲートや1250msの有限process閾値を変更しない。workflowのartifactに新規comparison.json、cache-diagnostic raw、各stdout/stderr相当ログとmanifestを含める。原ZIPの外部保全・独立再取得は後から独立に確認し、CI uploadだけで保存PASSとしない。

総合PARTIAL、P2 OPEN、Stage 3-B HOLD、Draft、304代替NOT_ADOPTED、限定受入NO・マージNOを維持する。
