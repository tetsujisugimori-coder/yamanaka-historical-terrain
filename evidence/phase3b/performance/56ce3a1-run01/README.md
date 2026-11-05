# 第3期B 性能比較

48/48試行 PASS。原票は [results.json](results.json)。製品HEAD `56ce3a1a1098d8852ebbb6ca829f53dbf15d9973`、旧main `6a84b95`。原票に製品・モデル・runnerのSHA-256を保存した。後続の台帳訂正（区画数と既存C格子の説明）は、この測定の形状・コード・マテリアル・カメラを変更しない。

## 条件と測定範囲

- 同一Windows PC、loopback配信、Chrome 156（Intel UHD / ANGLE D3D11）と自動WebKit 26.0。ほかのブラウザ検査・Blender/QGIS処理を停止して順次実行した。
- 各engine × viewport 390/1280px × 旧版/新版balanced/light/high × fresh context 3回 = 48試行。地形panel高さ600px、deviceScaleFactor 1。**48試行すべてで、同じengine/幅の旧版に対する初期camera・target・canvasの数値が厳密一致**した。
- readyは地域地形が既にreadyとなった後、1590年景観へのボタン操作から必要モデルreadyまで。全ページの初回navigation時間ではない。新版は初期balancedでreadyを測り、その後に品質を切り替えるため、light/high群のready差を品質設定の因果とは扱わない。品質切替＋2frameは原票の別フィールド。
- 操作値は各試行8回の合成ArrowRightイベントから2 animation framesまでの時間。表は3試行24標本の中央値。物理入力遅延、安定FPS、長時間負荷の測定ではない。
- 読込みresourceの転送量・duration、描画三角形/calls/geometries、取得可能なendpoint JS heapも原票に保存。heapはGCの影響を受け、ピーク・GPU・全メモリを示さない。
- Windows自動WebKitのGPU文字列は「Apple GPU」と報告されるが、Apple実機で測定した証拠ではない。iPhone実機Safari、長時間FPS、ピークGPUメモリはNOT_TESTED。

## 旧版とbalancedの中央値

| engine / viewport | 景観entry ready ms 旧→新 | 合成入力＋2frame ms 旧→新 | 新版の影 |
| --- | ---: | ---: | --- |
| Chrome 390 | 977 → 1101 | 15.25 → 18.15 | OFF |
| Chrome 1280 | 987 → 1071 | 13.40 → 36.30 | ON |
| WebKit 390 | 1361 → 1856 | 46.00 → 54.50 | OFF |
| WebKit 1280 | 1369 → 2657 | 72.50 → 109.00 | ON |

## 品質と負荷のトレードオフ

| engine / viewport | light 入力＋2frame ms | balanced ms | high ms |
| --- | ---: | ---: | ---: |
| Chrome 390 | 17.80 | 18.15 | 19.10 |
| Chrome 1280 | 14.95 | 36.30 | 32.60 |
| WebKit 390 | 47.00 | 54.50 | 78.00 |
| WebKit 1280 | 93.50 | 109.00 | 109.50 |

lightは影OFF、highは影ON、balancedは実canvas幅700px以上で影ON。狭い画面での影抑制と利用者のlight選択には測定上の理由がある。広い画面のWebKitでは追加モデルと陰影による待ち時間増が残る。3試行の短い測定なので、highがbalancedより常に速い等の一般化はしない。

GLBファイル実サイズは旧 `nishinomaru.glb` 24,933,760 B＋`landscape.glb` 593,620 B = **25,527,380 B**、追加 `phase3b.glb` **4,540,236 B**、合計 **30,067,616 B（+17.79%）**。全体HTML/JS転送量や圧縮後公衆回線転送量ではない。共通の8回操作後、描画診断は旧462,372 triangles / 20 calls / 25 geometries、新390px 485,332 / 22 / 40、新1280px 503,836 / 31 / 40。品質間でこの描画カウンタは同じであり、影の追加パスの総コストを表す値ではない。

## 同じ初期構図の比較画像（16枚）

各条件の第1試行、操作イベントを送る前のviewportを保存した。

| 条件 | 旧main | 新balanced | 新light | 新high |
| --- | --- | --- | --- | --- |
| Chrome 390 | [旧](performance-images/chrome-390-base-baseline.png) | [balanced](performance-images/chrome-390-phase3b-balanced.png) | [light](performance-images/chrome-390-phase3b-light.png) | [high](performance-images/chrome-390-phase3b-high.png) |
| Chrome 1280 | [旧](performance-images/chrome-1280-base-baseline.png) | [balanced](performance-images/chrome-1280-phase3b-balanced.png) | [light](performance-images/chrome-1280-phase3b-light.png) | [high](performance-images/chrome-1280-phase3b-high.png) |
| WebKit 390 | [旧](performance-images/webkit-390-base-baseline.png) | [balanced](performance-images/webkit-390-phase3b-balanced.png) | [light](performance-images/webkit-390-phase3b-light.png) | [high](performance-images/webkit-390-phase3b-high.png) |
| WebKit 1280 | [旧](performance-images/webkit-1280-base-baseline.png) | [balanced](performance-images/webkit-1280-phase3b-balanced.png) | [light](performance-images/webkit-1280-phase3b-light.png) | [high](performance-images/webkit-1280-phase3b-high.png) |

実装担当がChrome1280の旧/新balancedを画素閲覧し、同一構図で細粒感・接地影・案内文字の背景改善を確認した。新区域の接写は [ブラウザ検査](../../browser/README.md) の各定点画像を参照。この確認は独立レビューではない。

## 再実行

旧mainと新版を別ポートで配信し、既存Playwrightブラウザを使う。例（PowerShell、リポジトリroot）:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = '<existing Playwright browser cache>'
$env:PERF_CHROMIUM_CHANNEL = 'chrome'
$env:BASE_TEST_URL = 'http://127.0.0.1:4319'
$env:TEST_URL = 'http://127.0.0.1:4317'
$env:PERF_OUTPUT = 'evidence/phase3b/performance/<new-run>/results.json'
node scripts/phase3b-performance.mjs
```

既存原票を上書きせず新しい出力先を指定する。
