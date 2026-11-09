# 保存時点の注記
以下はHEAD9e29d73の検証完了時点の報告。追加証拠公開についてユーザー承認を得て証拠branchへ保存した。保存再開時にはPR36は既にmergedであり、以下のDraft/未マージ表記は当時の記録である。この証拠保存操作はmainや製品コードを変更しない。

# 景観C/D限定切り出し 最終報告
## A. 総合判定
**PARTIAL。景観限定実装の技術受入PASS、限定マージ推奨YES。** 性能改善は未立証、推定C・演出Dを維持。実機・史実・GUI手操作は未検証。第3期I全体の完成ではない。
## B–D. GitHub
Issue #27 / Draft PR #36。branch `feat/phase3i-landscape-only`、HEAD `9e29d737f56f606df9688874b9510490dbce54e7`、tree `ee91f0f2742b9686ad40b001864b0408251dbbfa`。
main `42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8` 基準。既存PR #26/#31/#34/#35を変更・閉鎖・マージせず保全。マージ、Draft解除、Pages公開は実施していない。
## E. 移植した機能
PR26 e67f1fc の景観C/D・編集原本・生成経路・対応回帰を57ファイルで移植。主対象はsrc/main.js、src/nature-finish.js、src/landscape.js、production/phase3i、public/data/phase3i*、scripts/phase3i-*、景観回帰tests、phase3f workflowと文書。
指定区域E[-99,-87]m/N[2,23]mの推定C、赤土・草・乾草・踏み跡・既存6低木個体差の演出D。西木戸口新規形状、歴史通路の確証、遠景LODは対象外。
## F. 移植しなかった処理
PR26のperformanceLog/timedGLB/geometryMaterials/renderCPU観測、performance module・新性能原票、PR34計測器、PR35支持点キャッシュを含めない。mainのloader.loadAsyncと同期renderを保全し、遅延集約なし。旧mainから存在する試験側のphase3c性能CIは保全したが、H資産hashのため今回のI景観受入/性能改善証拠には使用しない。
## G. 原本・GLB
独立GLB復号で473792三角形を照合、変更418三角形/180頂点、最大約0.075m、XY/トポロジー/区域外/現況A保全。glTF index配列順は再配置される。
独立計算で断面876点・支持5点の最大差1.14e-13m。Blender/QGISヘッドレス再生成で公開GLB2件とmetadata byte一致。native保存13ファイルは時刻/UUID/属性順/デフォルト色等でbyte非一致（PNGも変化）。native全体のbyte再現性は主張しない。
既存public/production/evidence 1536パス保全。独立再生成前後ではmain由来1777パス不変（移植差分がゼロという意味ではない）。
GLB SHA256:
- phase3i.glb: 67efa0217e1e3e41b15ec5aba2508d65e4f73bacff165da9bca67d0dd18b8830
- phase3i-inner.glb: a02c5a909314af12e094ea65dc30df96887c5b215d3eedf9f0db4b803fdbe83a
## H. 試験・故障対照
最終HEAD独立単体322 PASS/0 SKIP、build PASS。Chromium/WebKit ×375/390/765/1280 ×通常/reducedの16条件、32 PNG、20 source hashesを最終CI原ZIPから照合。断面64記録、観察支持128、木柵支持320、trusted keydown16、walk move160を照合。
区域外高さ/単位/NaN/反転windingの独立4故障対照、証拠欠測・不正型・矛盾・変更検出、計測混入/遅延render負対照を確認。
旧86871fa Pages CIで浅いcheckoutに過去git objectが無く新テスト1失敗。byte一致snapshotのSHA固定参照へ局所修正。Gitなし同条件旧RED→新GREEN、改ざん拒否を独立再確認。失敗ログは保全し製品ロジック/拒否条件を緩和していない。
ローカル補助ブラウザは旧HEAD8 Chromium条件成功、WebKit依存不足exit1。最終証拠へ混ぜず保存。正式WebKitはGitHub Actions最終HEADで実行。
## I. 最終CI
7 workflows成功、17 jobs success、Pages deploy1 skipped。Pagesはrepository-subpath build成功のみで公開していない。
- [景観16条件](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982317)
- [Pages build-only](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982309)
- [prototype](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982564)
- [western](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982648)
- [connected](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982382)
- [exploration](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982592)
- [inner](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982428)
[最終原ZIP](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982317/artifacts/13678681247)、SHA256 `10e73eb0e72ea726229ae73b5f2d6759f4116c3bd8927c70a11780fc61860594`、保存期限2026-12-09。原JSON/PNG/比較結果を含む。全CI artifact ID・digest・保存期限は証拠branchのci-index.json。
## J. 独立レビュー
[正式COMMENTレビュー](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/36#pullrequestreview-5826686150)。最終HEADをGitHubから取得し独立計算・原ZIP照合・反例再実行。未解決P1/P2なし。index不変と読めるP3記述を訂正済み。
## K. PR34接続
PR34はPR26 baseのため単なるbase変更で統合完了とはしない。後続branchで本景観版を基準に計測境界を再接続し、I資産hash・同期描画・loadAsync・非同期保護・断面歩行を再検証。計測有無の同条件原票と負荷を取り直す。PR35キャッシュは別判断。
## L. 未検証・残件
実機Safari、物理タッチ、GPU内部時間、QGIS/Blender GUI手操作、史実確証はNOT_TESTED。性能改善未立証維持。native保存byte同一は保証しない。限定YESは景観コードと編集可能原本/再生成・回帰の範囲のみ。
証拠専用branch `evidence/phase3i-landscape-only` は製品CI HEADから分離し、旧失敗/新成功/独立証拠を保持。旧pre-CI独立ZIPのGit blob保存は応答不明・読戻し404のため成功扱いせず、独立計算原票はテキストで保存、正式ブラウザ原ZIPはActions Artifactに保存した。

