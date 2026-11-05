# 第3期A：西ノ丸1590年景観モード（Issue #9）

総合判定は独立レビュー完了までPARTIAL。今回の成果はC推定地表の景観化、C木柵・門・外周植生、D旗・人物と定点の低視点観察。史実確定の1590年復元ではない。新規B形状0。Issue #1/#4/#5/#7/#9はOPEN、Draft解除・merge・auto-merge・公開deployなし。

基準mainはPR #8のmerge `7465eebc6667d471e35c1d2b37a0782ad654f18a`。PR #6/#8のMERGED、関連IssueのOPENを着手時に接続GitHubで確認。適用AGENTS.mdを読み、追跡された`.agents/skills`は存在しない。別clone・専用ブランチ`feat/issue-9-landscape-1590`で制作。既存制作物や過去証拠を書き換えない。

## 操作と見た目

冒頭「1590年の景観へ」から入る。上部の「C＋D景観」「Cのみ」「A現況と比較」はカメラ・注視点・選択IDを保持。Aに景観要素の対応物が無い場合や選択中Dが非表示の場合は説明を残して状態を明記する。旗・人物はDだけの描画群で、Cの地表や木柵と分離。自動アニメーションなし。reduced motionでも操作は同じ。

曲輪・土塁内側・障子堀・虎口通路の4定点がある。定点では足場を動かさず、ドラッグと矢印で見回す。カメラ高さは実GLBのA/Cの高い側＋1.7m。比較時も同じカメラを維持し、低い側では地表からの高さが1.7mを超える場合がある。現況地形と推定地形の違いによるもの。史実の通行経路ではない。

自由歩行は候補と比較したが、未確定の経路、土塁・堀・境界の衝突処理を省いて自由歩行を許可するより、定点を先に安定実装する方式を選んだ。定点では拡大・縮小ボタンを無効化し、画面と読み上げ用案内を1本指・ドラッグ・矢印による見回しへ切り替える。足場を動かすズームは行わない。「俯瞰へ」「近くで見る」「既存低視点」「断面を見る」は定点を終了し、通常のボタン・案内を復帰する。1/2倍切替は俯瞰へ戻り、景観も同じ倍率へ追従する。

HTML一覧と3Dの木柵・門・樹木・旗・人物から解説を選択。既存5施設にも表面の役割・仮定・未知・演出・編集元を補足する。画面の凡例だけで歴史性を保証せず、各要素のキャプションで確認できる。WebGL不能・景観GLB404でもHTMLの解説と出典は残る。説明JSON自体が欠落した場合は明示的な説明データエラーであり、成功fallbackではない。

## 根拠・仮定・ライセンス

出典は既存 `sources.json` の安定IDを参照し、モデルextrasには要素IDと台帳参照を保持する。史料レコードをGLBへ複製しない。将来の史料追加や形状置換は要素IDを保って行う。

| 要素 | 区分 | 使った根拠と仮定 |
|---|---|---|
| 曲輪・堀・土塁・通路の地表 | C | 既存Cの全頂点・面を維持。草、裸地、仮の踏み跡を頂点色で表現。植被・材・摩耗はUNKNOWN |
| 木柵 | C | 三島市環境整備事業の土塁一般説明を背景参照。柱穴や木柵の実在証拠ではない。既存C天端に高さ1.8m、約2m間隔の柱を仮配置 |
| 冠木門 | C | 保存活用計画は周辺曲輪の背景参照のみ。幅約5.6mの簡素な門を既存C通路開口に仮置き。虎口位置・構法・年代UNKNOWN |
| 樹木 | C | 現況地形を足場に外周へ疎配置。樹種、密度、伐採範囲、1590年植生の証明なし |
| 旗・人物 | D | 歴史史料の直接裏付けなし。無地の旗、約1.65mの簡略人物は創作。家紋・実在人物・実際の軍勢を示さない |
| 空色・照明・距離の霞 | 表示環境 | 見通しを読みやすくする描画設定。1590年当日の天候・日照を再現する主張なし |

既存の[史料とモデル台帳](source-model-ledger.md)・[第2期Aの資料支持範囲](phase2a.md)を継承。文章を参考にした独自形状で、発掘図・写真・PDFの転載やトレースなし。外部画像・外部モデル・外部textureなし。追加の原始形状・配色・配置レシピは本repoのMIT。Bへの昇格なし。図面対応点0、地理参照残差、標高改定、1590年の位置精度・見通しの歴史的正しさはUNKNOWN。

## 編集・再生成

| ファイル | 内容 |
|---|---|
| `production/landscape/recipe.json` | メートル単位、安定ID別の全部品と色・配置・観察点。独自MIT原始形状の編集レシピ |
| `production/yamanaka-1590.blend` | 既存phase2Aを実読込して保持。追加はC/Dの別コレクション、柱・門・樹木・人物ごとに独立編集可能 |
| `production/yamanaka-1590.qgz` | 既存phase2Aの10レイヤー＋要素・定点の2レイヤー。EPSG:6676、相対参照 |
| `production/landscape/*.geojson` | EPSG:6676の景観要素・定点の編集可能な候補配置。実測データではない |
| `public/data/landscape.glb` | 追加景観のみ、地形を複製しない。271部品、約0.59MB |
| `public/data/landscape.json` | C/D台帳・出典ID・仮定・未知・演出・編集元・表面解説・定点 |
| `src/landscape.js` | 形状を変えない地表の色、要素ID＋materialでの描画バッチ |

Blenderの東/北/上、glTFの東/上/南、原点E44862.121277226666 N-93478.07235405142、高さ0、1unit=1mを継承。景観の足場は生成時に既存Cの実三角形をBVHで取得。新たな地表高の式で既存Cを書き換えない。現況AのDEM・GLB・qgz・blend・固定断面の正本は非変更。

```powershell
npm ci
python scripts/make-landscape-recipe.py
$env:BLENDER_EXE = '<Blender 4.5.9>/blender.exe'
$env:QGIS_PYTHON_BAT = '<QGIS 3.44.10>/bin/python-qgis-ltr.bat'
node scripts/run-landscape-native.mjs blender
node scripts/run-landscape-native.mjs blender-check
node scripts/run-landscape-native.mjs gis
npm test
npm run build
npm run dev -- --port 4317 --strictPort
# 別terminal。Windowsでは必要ならPLAYWRIGHT_BROWSERS_PATHを指定
node scripts/landscape-browser.mjs
node scripts/landscape-picking.mjs
node scripts/landscape-browser.mjs --mutation=drama
node scripts/landscape-browser.mjs --mutation=ground
```

BlenderのGUIで各部品を直接編集した場合、同じレシピからの再生成は上書きする。継続制作ではレシピへ変更を戻すか、別の編集版blendと版付きGLBを保存して台帳の版を更新する。QGISは追加点の編集に使い、現況Aを歴史地表として上書きしない。

## 検証方法・証拠

`evidence/landscape/`に新規証拠を保存する。すべて実装担当の自己検証であり、raw GLBを別計算で照合していても独立担当レビューではない。外部runnerはnative終了0と内部完了票を両方確認する。Blenderは別プロセスで再読込、元10メッシュの座標・面hashとC/D対応・外部画像0を照合。QGISは生成後に正本を再読込し全12レイヤー・CRS・旧参照を確認。

単体試験は全景観部品のraw GLB位置・倍率・category・地面高さ・ledger、既存座標・断面・境界を検査。地面の正解には製品のraycast/補間関数を使わず、raw GLBの水平重心座標oracleを使う。数値許容1mmは計算整合用で、史料や測量の精度ではない。

ブラウザはChromium/WebKit、375/390/765/1280px、通常/reduced motion。A/C/D切替、全キャプション、4定点のA/C足場、見回し、5施設、2断面、1/2倍、touch相当、overflow、Resetを検査。200/404を解放ゲートで保留し、後続のview/selectionが古い成功・失敗で上書きされないことを確認。D非表示の除去とカメラ沈下の意図的変異は同じ検査が拒否することを確認。代表俯瞰・低視点・A/C/D画像を保存し、人が景観として読めるかも確認する。

既存回帰は隔離cwdへコード・データを複製して実行し、以前の証拠を上書きしない。正式票には対象HEADとsource hashを保存。初回の試験配信でViteのimport変換を通さなかった失敗、依存取得競合でファイルが欠けた失敗、中間版を配信中のHMRが試験を巻き戻した失敗は別フォルダーに保存し、製品の確定原因や完了票に混同しない。人物頭部のprimitive高さ定義はraw GLB検査で不整合を検出して揃えた。

性能は同じWindows PCのloopbackと同じcanvas寸法で基準mainと比較する。冷たいbrowser contextでGLB転送サイズ・ready時間・三角形・draw call・幾何数・JS heap（利用できるengineのみ）・入力＋2frame遅延を保存。GPU/全体メモリや持続FPSではない。既存C地形24,933,760 bytesを維持し、追加景観は593,620 bytes・5,696三角形、271部品を14描画batchに集約。描画三角形456,676→462,372、draw call6→20。動的LODで地形を変えて固定断面整合を失う方式は採用しない。実機負荷は別途受入する。

各条件3回の性能実測（中央値、各canvas高600pxで比較）：

| 環境・幅 | UI ready 旧→景観 | keyboard dispatch＋2frame 旧→景観 |
|---|---|---|
| Chrome156 / Intel D3D11 / 390 | 0.78→1.47秒 | 16.5→12.2ms |
| Chrome156 / Intel D3D11 / 1280 | 0.77→1.00秒 | 23.8→30.5ms |
| 自動WebKit / 390 | 0.86→1.37秒 | 46.5→50.5ms |
| 自動WebKit / 1280 | 0.98→1.44秒 | 76.0→76.0ms |
| headless Chromium141 / SwiftShader / 390 | 1.20→1.39秒 | 1304→1352ms |
| headless Chromium141 / SwiftShader / 1280 | 1.33→1.19秒 | 1796→1867ms |

Chrome390の景観readyには1.00〜3.78秒の幅があり、3.78秒の外れ値も保持。原因を確定していない。実機通信の保証値ではない。ソフトウェア描画では旧版から操作が遅く、この条件の快適性をPASSとはしない。Intel GPUでの通常Chromeは別条件として記録し、実機iPhoneと混同しない。keyboard値はsynthetic dispatchを含む描画経路の指標で、機器入力遅延やFPSではない。JS heapは観測時点・GC依存で、全メモリ/ピーク/GPUメモリではない。GPU Chrome1280の観測点は旧121〜123MB、景観124MB程度。WebKitのheap APIは未提供。原票・バージョン・範囲は`performance*.json`を参照。

再現時は`.cache/baseline`へ基準mainの別worktreeを作り、同じViteで4319に配信して`BASE_TEST_URL`を指定する。`node scripts/landscape-performance.mjs`が両engineの24試行を保存する。通常Chromeを使う場合は`PERF_CHROMIUM_CHANNEL=chrome`、`PERF_OUTPUT=evidence/landscape/performance-chrome.json`を指定。`scripts/landscape-gpu-probe.mjs`で描画driverを確認できる。

## 未確認・次工程

実機iPhone Safari・VoiceOver・現地照合はNOT_TESTED。旧QGISクラッシュと過去のブラウザtimeoutの根本原因はUNKNOWNのまま。今回の再読込成功・自動WebKit成功で解明済みにしない。初回npm auditは既存lockにhigh1件を報告（依存版変更は本作業の範囲外、後続で確認）。Viteの既存500kB超bundle警告を維持。

提出途中の自己検査では、説明欄の伸長により765pxの初期視点がズーム上限に達する不具合を検出。PCのcanvas/解説欄を600pxに固定して解説を欄内スクロールへ変更した。修正途中のflex配置でモバイルcanvas幅0が発生し、stretchを維持するよう修正。元票を`b9054a2-attempt`/`a7410e4-mobile-width-defect`に保全。旧Reset試験の厳密な状態期待値には新規landscape/drama/stationの既定値も追加した。失敗した期待値を部分一致へ緩めず、全状態のResetを引き続き検査する。

`e667286`で全28ブラウザ条件と6ジョブのValidateが成功。後続は景観5要素の観察点高さを便宜的な共通値から各C地表に対応させ、raw GLB oracleとの1mm以内一致を単体試験に追加した。再出力GLBは271部品の頂点位置・変換・category/ID・三角形集合が完全一致し、4人物メッシュの三角形順序のみ異なる。コンテナbyte同一とは扱わない。これは表示用模型の基準高で、1590年の絶対標高や歴史的精度の保証ではない。

別の実メッシュ選択検査では、カメラをUIの矢印で見回して画面内の門柱Cと人物Dをtrusted touchで選び、D非表示後は同じ人物位置のrayでDを選べないことを両engineで確認する。最初に画面外の柱を投影して失敗した試験票は`picking-first-projection-failure`に保存し、製品不具合と混同しない。

別担当による固定HEAD `fbdeac1646d7e51a345b96c9e2830052a22f88df` の独立レビューは総合PARTIAL、限定範囲のmerge判定YES、P1/P2なし。景観のまとまり、独立168断面標本、幾何・native再読込・既存659ファイル保全が確認された。追加の全62断面runnerは完走しておらず、独立全62条件PASSとはしない。

P3は定点で拡大ボタンが有効のまま無反応となり、通常の移動・ズーム案内が残る点。修正と同条件の自己再検証・変異検査は[記録](../evidence/landscape/p3-fixed-controls/README.md)に保存。固定視点の安全処理と全3D正本は維持した。修正HEADの独立再確認は未実施、総合PARTIAL・Draft維持。次は同担当の再確認、実機性能・VoiceOver、史料と測量基準点の追加、植生や門の複数案差替え、低視点の視認性改善を優先し、その後に歩行衝突を検討する。
