# PR #6：P2-01 / P3-01 修正と自己検証

追記：bf5c4b6で独立担当が見つけた初期カメラ操作の新P2は、[初期読込みの修正・三版比較](initial-camera-fix.md)に分離して記録する。以下の「共通token」は表示成立とカメラ効果の二つの有効期限へ改良した。旧77／欠陥bf／本修正版を混同しない。

対象旧HEAD：`77b015565b79493a05f45c6d959d459546e21526`。base：`d19d90332532ac6bae1eec3c6eee1a8b0548e09e`。本記録は実装担当の自己検証であり、別担当による独立再レビューはNOT_VERIFIED。Draft維持、マージ推奨NO（独立再レビュー前）。最終HEAD・CIはPR本文とIssue #4の最終コメントを参照する。

## 修正前の実GLB反例

`scripts/review-fixes-browser.mjs --baseline` を旧HEADの隔離worktreeとViteに対して実行した。`nishinomaru.glb` のHTTP応答を明示ゲートで保留し、障子堀選択→後続操作→応答解放の順に実操作する。成功応答のbodyはコミット済み約25MBの実GLB、異常系は404。DOMやgetModelをスタブに置換していない。setViewの完了を観測するカウンターだけを計測用に追加し、全要求のsettleとmicrotask完了後に実state、説明、aria-pressed、描画状態、カメラ、注視点を検査する。固定sleepで順番を作らない。

| 指摘 | 旧版の成立条件・結果 |
|---|---|
| P2-01 | 既存4地点の後続選択は新しいsetViewを開始しない。古い200応答で復元表示・障子堀選択・説明・視点へ戻り、古い404では不要なエラー状態へ移る。両エンジンで再現 |
| P2追加条件 | 後続の復元施設選択が404となる場合、旧版は最後の選択を先に確定せず、説明が既存地点のまま。全5施設で再現。成功時・Reset・別表示切替は成立する条件もあり、全操作を一律欠陥とは判定しない |
| P3-01 | CにもAの双線形sampleHeightを利用。障子堀の実C観察点575.150024mに対し注視点569.524m、差5.626024m。2倍では11.252049m。Cの曲輪・土塁・通路でも再現 |
| P3非再現条件 | 接続地形CとA側の全5施設は、今回の観察点では許容差内。A側にも常に大きな欠陥があるとは主張しない |

`evidence/review-fixes/red.json` に全5施設×A/C×1/2倍×2エンジンの期待値・実値を保存する。位置精度の保証と数値誤差を混同しない。

## 原因と代替方式

P2は「読込要求の世代」と「利用者の操作意図の世代」を同一視したことが原因。ロードを始めない選択、あるいはロード後の別callbackまで同じ失効条件で管理していなかった。新施設404時の説明不一致も、選択そのものをロード成功まで遅延させた同じ結合から生じた。

- select内でrequestを増やす局所修正：内部の表示確定selectまで世代を進め、別callbackで再び抜けやすい。
- Abortのみ：GLTFLoaderの処理済みcallbackや、ロードを伴わない後続選択を取り扱えない。中止だけを整合性の根拠にはできない。
- **採用：共通の操作意図token**。利用者の選択・表示変更・明示的な視点操作で旧意図を失効させる。選択は直ちに説明へ反映し、非同期処理の成功・失敗・視点効果はtokenが有効な場合だけ確定する。古い成功はキャッシュしても表示へ反映しない。現在の表示は保持し、一覧を長期無効化しない。同一ファイルの読込中Promiseも共有する。

P3は現在表示する面と標高の取得元を分離したことが原因。単にCメタデータへ切り替える方式も可能だが、面の将来改版やAの双線形/三角形補間差に依存する。**採用：表示中GLBの三角形を下向きrayでサンプリングする共通関数**。Cでは対象施設の形状、Aでは実表示するA形状を使用する。面がない場合は明示的に失敗し、別の面へ黙って代用しない。非表示施設を「近くで見る」場合の基準は、その施設の保持された実形状であり、表示が復活したとは報告しない。

## 許容差・高さ・比較

独立したNodeのGLB accessor読取＋barycentric計算を期待値とし、実ブラウザカメラの注視点と比較する。5施設×A/C×標高1/2倍を両エンジンで検査。Cメタデータの観察点標高も対応施設の実三角形と照合する。

許容差は基準高さ1mm、表示2倍時2mm。約500〜600mでのfloat32刻みは約0.00003〜0.00006mであり、格納丸めと三角形交点計算を十分覆う数値検査の余裕である。測量/歴史精度を1mmと主張するものではない。水平はdoubleの更新丸めを考慮して1e-8mとする。初回試験でObject.isの0/-0・末尾丸めまで誤拒否した結果は `red-initial-test-error.json` に保存し、製品欠陥と区別した。

「近くで見る」は、その時点の表示面を基準に新しい視点へ移る操作。一方、単なるA/C比較切替はカメラ/注視点を保持する。低視点も同じ面取得を使う。回転、pan、zoom、倍率、Reset、隠し施設、既存表示、WebGL不能・説明JSON/モデル404・描画接続喪失を回帰する。

## RED/GREENと負対照

自己検証の確定結果：旧版88観測と修正版112観測。P2は旧FAIL26件→同条件PASS、P3は旧FAIL16件→同条件PASS。修正版の64選択/遅延観測・40高さ観測・8低視点/比較観測がすべてPASS。高さ誤差の最大は約2.3×10⁻¹³m。修正を除去したintent16件は全て期待FAIL、height40件中16件は期待FAIL・他24件はPASS。詳細は `summary.json` と `heights.md`。

- `red.json`：旧HEADを固定した実GLB反例。成功条件も併記する。
- `green.json`：同じ操作条件に加え、375/390/765/1280px×通常/reduced motion×両エンジンの代表遅延ケース。P2、P3、低視点/同一視点比較の観測値を保存。
- `mutation-intent.json`：修正版のtoken有効判定を意図的に除去。既存4地点×成功/404×2エンジンを同じ操作で検査。
- `mutation-height.json`：表示面取得を旧A双線形へ意図的に戻す。同じ40高さ観測で誤りが検出されることを確認。
- `green-interrupted.json`：初回GREEN中断前の完了票。試験側route.fetchがWebKitでsocket hang upとなり、実行全体を成功としなかった。厳密原因はUNKNOWN。以後、変換済みモジュールを一度取得して固定配信し、コンテキスト終了と追加HTTP取得の競合を検証から分離。実GLBの取得・parse・renderは実行したままにする。
- `reset-cancel-red/green.json`：実装途中で追加した境界反例。初期Aをゲートで保留したままCを先に使用できる状態で、2倍→Reset→後続C選択→初期A応答解放。設定値だけを先にResetすると旧表示面が2倍のまま残る4件を検出した。Resetは表示設定・実表示倍率・現在の視点も即時に整合させ、非同期の表示切替だけをtokenで失効させるよう修正。これは未提出の中間実装の反例であり、旧77b0155の88観測に混ぜない。

実装除去を含む試験は安全なローカルfixtureであり、通常製品コードへその変異を含めない。fixtureの計測/変異適用が確認できない場合は成功扱いしない。

## 実行手順と独立再レビュー用引継ぎ

```powershell
npm ci
npm run dev -- --port 4317 --strictPort
node scripts/review-fixes-browser.mjs
node scripts/review-fixes-browser.mjs --mutation=intent
node scripts/review-fixes-browser.mjs --mutation=height
node scripts/review-reset-cancel.mjs
node scripts/review-reset-cancel.mjs --remove-reset-commit
npm test
npm run build
node scripts/review-fixes-protection.mjs
# 旧版は77b0155の別worktreeをVite 4319で起動
$env:TEST_URL = 'http://127.0.0.1:4319'
$env:BASELINE_DIR = '.cache/review-baseline'
node scripts/review-fixes-browser.mjs --baseline
```

旧版用serverは本作業では `git worktree add --detach .cache/review-baseline 77b015565b79493a05f45c6d959d459546e21526` と `npx vite .cache/review-baseline --port 4319 --host 127.0.0.1 --strictPort` を使用。修正版へ戻す際は上記2環境変数を解除する。実GLB bodyのhash、対象ソースhash、画面状態と前後のカメラ値を比較できる。

Reset取消の中間実装反例は `--remove-reset-commit` で即時の面/視点整合処理だけを除去して再現できる。`reset-cancel-mutation.json` の4件が期待FAILになることも確認し、通常コードへその変異を含めない。

別レビュー担当は、旧版/修正版で同じゲート順序を再実行し、rendererだけでなくstate・説明・aria-pressed・視点とエラー状態を確認する。P3の期待値を必要なら別のGLB読取/3D経路で測る。実装担当の再実行とCIを独立レビューとは数えない。

## 保全・非実施・留保

`protection.json` は旧77b0155の `production/`、`public/data/`、出典表とのbyte比較を記録する。現況A、DEM、原QGIS/Blender、Cモデル、出典は変更しない。QGIS/Blenderの再生成・再読込は本修正ではNOT_RERUN。以前の正本/GLBの対応票とbyte保全を継承するが、新規のnative検証とは呼ばない。新しい直接検査はWeb用GLBの観察点とメタデータ/カメラの対応である。

新規B=0、5施設C、位置精度/図面残差UNKNOWNを維持。旧QGISクラッシュ・旧読込timeout・途中の旧requestfailedの根本原因UNKNOWNを維持。実機Safari、VoiceOver、現地、25MBモデルの実機負荷はNOT_TESTED。Issue #1/#4/#5はOPEN、Draft、マージ/auto-merge/公開デプロイなし。
