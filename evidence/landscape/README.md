# Issue #9 提出証拠

総合 **PARTIAL**。C/D景観と定点観察を実装し、自己検証を保存した。fbdeac1の独立レビューはPARTIAL（限定範囲merge YES、P1/P2なし、P3一件）。P3修正後の独立再確認、実機iPhone Safari、VoiceOver、現地照合は未実施。Draft解除・merge・auto-merge・本番deploy・Issue閉鎖は行わない。

[Issue #9](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/issues/9) / [Draft PR #10](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/10) / [制作・資料・再現・留保](../../docs/landscape-1590.md)。最終HEAD/treeと最新CIはPR本文を参照。基準mainは`7465eebc6667d471e35c1d2b37a0782ad654f18a`。

## 代表画面

同じ俯瞰カメラで[A現況](final-images/chromium-1280-a.png) / [Cのみ](final-images/chromium-1280-c.png) / [C＋D](final-images/chromium-1280-cd.png)。[曲輪の低視点](final-images/chromium-1280-low-bailey.png) / [障子堀の低視点](final-images/chromium-1280-low-moat.png)。[390pxの景観](final-images/chromium-390-cd.png) / [390pxの低視点](final-images/chromium-390-low-bailey.png)。両engine・2幅・計20画像とカメラ/表示IDは[画像票](final-images/results.json)。

土塁内側・虎口通路を含む4低視点の画像は[e667286の全条件票](e667286-full-browser/)にも保存。後続の観察点高さ修正で、271部品の頂点・変換・ID/category・向き付き三角形集合は完全一致、4人物メッシュの三角形列挙順だけが変わることを[比較票](caption-height-geometry.json)で確認した。GLBのbyte同一とは扱わない。

「1590年の景観へ」から入る。C＋D/Cのみ/Aは同じ視点・選択IDで比較。4定点は足場を固定し、ドラッグ・矢印で見回す。史実の経路ではない。俯瞰/近くで見る/既存低視点/断面を見るで定点を終了する。

## 証拠と範囲

| 票 | 結果・対象 |
|---|---|
| [定点操作P3修正](p3-fixed-controls/README.md) | 修正前32反例、同条件修正後32、別ページのtrusted touch見回し8、ズーム/案内の変異4。旧画像は旧UIの履歴、新しい定点画像と留保はこの記録を参照 |
| [unit-final.txt](unit-final.txt) | 28単体試験。既存のGIS/GLB/固定断面と、全景観部品の座標・category・出典参照・観察点高さ |
| [native-blender.json](native-blender.json)、[native-blender-check.json](native-blender-check.json) | Blender4.5.9、終了0。実生成と別プロセス再読込、旧10メッシュhash・271追加部品・C/D・外部画像0 |
| [native-gis.json](native-gis.json) | QGIS3.44.10、終了0。原10＋2レイヤー、全12レイヤー有効・EPSG:6676・再読込 |
| [preservation.json](preservation.json) | 既存production/public/data/evidenceの659ファイルraw byte一致 |
| [全ブラウザ票](e667286-full-browser/matrix.json) | 28 PASS：Chromium/WebKit、375/390/765/1280、通常/reduced motion、遅延200/404、WebGL不能/新GLB404。詳細回帰は両engineの390/reduceで5施設・2断面・1/2倍・全4定点も検査 |
| [実メッシュ選択](picking/results.json) | 2 PASS。trusted touchで門C・人物Dを選択し、D非表示では同じ人物位置のrayで選択不能 |
| [built subpath](built-subpath/results.json) | 両engineの静的Pagesサブパスで新GLB/説明/選択/D非表示 2 PASS。ローカルpreviewで、本番deployではない |
| [D漏れ](browser/drama.json)、[沈下](browser/ground.json) | 意図的欠陥を各2engine、計4期待FAILとして検出。runner終了0。正常PASSの不存在を意味するFAILではない |
| [Reset取消](reset-cancel/green.json)、[復帰除去](reset-cancel/removed-label-restore.json) | 初期A保留→C＋D→Reset→後続C選択→旧200/404。正常4 PASS。分類復帰除去4期待FAILを具体的なstale C+D labelとして拒否 |
| [CI履歴](ci-history/) | 修正前失敗・superseded取消を保全。取消はPASSにしない。e667286と1bf68daは6ジョブValidate SUCCESS。最新はPR本文参照 |

全票は実装担当の自己検証。独立した数値oracleやCIを、実装に参加していない担当者のレビューと混同しない。source hash・対象版・条件は票ごとに保持する。e667286後の変更は観察点高さの整合、分類の画面内表示と取消時の復帰、追加検査・証拠で、既存A/C地形は変更していない。

## 性能

旧C GLB24,933,760 bytesを維持し、景観GLB593,620 bytesを遅延取得。271編集部品を14batchへまとめ、全景観時の三角形456,676→462,372（＋5,696、約1.25%）、draw call6→20、GPU幾何数11→25。

同一Windows PC、loopback、同一canvas高600px、各条件3回。GPU Chrome156/Intel D3D11では、UI ready中央値は390pxで旧0.78→景観1.47秒、1280pxで0.77→1.00秒。synthetic keyboard＋2frameの中央値は16.5→12.2ms、23.8→30.5ms。390px景観のreadyには1.00〜3.78秒の幅があり、3.78秒の外れ値と原因UNKNOWNを残す。

[GPU確認](chrome-gpu-probe.json) / [Chrome生票](performance-chrome.json) / [Chrome集約](performance-chrome-summary.json)。[自動Chromium/WebKit生票](performance.json) / [集約](performance-summary.json)には別の24試行を保存。SwiftShaderのheadless Chromiumでは旧版から1.3〜1.8秒程度の描画操作待ちがあり、この条件の快適性をPASSとはしない。自動WebKitの景観は同指標約50〜76ms。

入力指標は機器入力遅延や持続FPSではない。JS heapはGCに依存した観測時点の値で、総メモリ・GPUメモリ・ピークではない。WebKitではheap API未提供。実機iPhone・セルラー通信の性能を保証しない。既存25MB地形の最適化と実機受入は次工程。

## 未確認と履歴

親担当が手配した独立レビューはfbdeac1で実施済み。景観のまとまり、独立168断面標本、幾何・native再読込・既存659ファイル保全を確認。追加の全62断面runnerは完走していない。自己検証/CIの全62条件と独立レビューを混同しない。P3修正HEADの独立再確認は未実施。実機iPhone Safari・VoiceOver・現地はNOT_TESTED。旧QGIS内部クラッシュ・過去ブラウザtimeout根本原因・地理参照残差・1590年位置/植生はUNKNOWN。新規B形状0。

初回harnessのimport変換不足、依存取得競合、中間版配信中の失敗、765px初期ズーム上限、途中修正のモバイル幅0、旧Reset期待値のschema不一致、最初の画面外点のpick検査は、それぞれ別票で保存。成功票へ上書きせず、製品不具合と試験不備を分ける。`b9054a2-attempt`等の中間票は最終版の判定票ではない。

独立レビューでは固定HEADのソース・GLB・native正本・資料支持範囲・画像・同じ反例と新しい反例・CIを確認する。その後に実機受入と遠景/通信量の最適化を行う。Draftのまま、Issue #1/#4/#5/#7/#9をOPENで維持する。
