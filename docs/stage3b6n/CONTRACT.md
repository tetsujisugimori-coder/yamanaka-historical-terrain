# Stage 3-B6n: 404のルーティングあり／なし単一因子比較

既存Draft PR #55に限定。Stage 3-B HOLD、304代替NOT_ADOPTED、B6a正式FAIL、マージNOを維持し、旧ZIPや1250ms閾値は不変。

## 固定条件と比較変数
Chromium/WebKitそれぞれで合成`missing`のphase 1を200、phase 2を404・96 bytesに固定し、両phaseのasset.jsを`cache-control: no-store`にする。これによりブラウザの条件付き再検証を意図的に抑制し、両群ともサーバーで`If-None-Match`欠落を検査する。page.routeなし／同一asset.jsに`route.continue()`を登録、の**有無だけ**を変える。試験順はOFF→ON→ON→OFF。各回新規BrowserContext、viewport・serviceWorkersなど共通。両群を同じエンジン・同じコミットで確認する。

## 証拠と判定
各回でserverのphase1/2 status・ヘッダ・本文サイズとSHA・response.finish、clientのresponse.status/body/finished、requestfinished/requestfailedとfailure category、socket/接続イベント、context.closeの結果とdiagnostic deadlineを記録。ルーティングONでは両phaseのroute.continue発火、OFFでは0を確認する。4回すべて404・96 bytes・同SHA・no-store・If-None-Match欠落・完了イベントが確認できた場合だけ比較成立。ONの2回、OFFの2回のシグネチャ一致・相違を別記録。ルーティングの存在と因果証明は区別する。

B6l専用CIに合成比較試験だけを追記。旧診断プラン、B6a製品コード・ブラウザ受入、process時間上限は変更しない。収録原ZIPは既存workflowのalways artifactへ同梱。CI実行成功と外部承認済み保存先からの独立実byte再取得は別判定。既存の証拠は上書きしない。

## 限界
両群とも強制no-storeなので旧B6aのキャッシュ条件とは異なる。404の初発原因や実ブラウザ使用byteは結果が示さない限りUNKNOWN。既存結果のFAILを成功へ読み替えない。
