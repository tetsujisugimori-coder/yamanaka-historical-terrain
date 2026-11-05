# 第3期B ブラウザ自己検証

製品HEAD `56ce3a1a1098d8852ebbb6ca829f53dbf15d9973` に対する最終正試験は **28/28 PASS**、負対照は **4/4 EXPECTED_REJECTION**。原票は製品・モデル・runnerのSHA-256、条件、診断、失敗理由を含む。これは実装担当が書いた自動検証であり、独立レビューではない。画像の生成だけを視覚品質PASSの根拠にしない。

## 最終正試験

| engine | 原票 | 結果 |
| --- | --- | --- |
| Chromium（既存Chrome channel） | [final-chrome-56ce3a1-02/results.json](final-chrome-56ce3a1-02/results.json) | matrix 8＋競合4＋fallback2 = 14 PASS |
| 自動WebKit | [final-webkit-56ce3a1-02/results.json](final-webkit-56ce3a1-02/results.json) | matrix 8＋競合4＋fallback2 = 14 PASS |

matrixは375・390・765・1280px × 通常/reduced motion。新4 stable IDの台帳・C分類、旧5施設と旧4定点、3区域俯瞰、新5低視点、建物toggleと説明保持、A/C/CD・Cカテゴリ切替、カメラ・選択保持、FOV60の門定点と退出時38復帰、1/2倍、固定2断面の数値保持、キーボード見回し・drag/touch・overflow・resetを確認した。balanced/light/highの影とresize時再判定、D質感のC-only抑制も検査した。

旧応答の遅延200/404 × view/selection切替を各engine4条件確認。WebGLなしHTML解説、新GLB404時に旧景観・地形・定点が継続使用できること、再試行後の4施設復帰・警告解除を確認した。ローダのpending完了を待つQA計測を一部挿入するが、製品の状態遷移や地表補間関数をテストのoracleとして再利用していない。

新低視点の高さはraw A/C/追加GLBから独立復号した三角形で照合。門定点では視線20点の地表クリアランスと、raw GLBの門柱・扉・横木2016頂点のcamera frustum包含を検査した。最終門の最小視線余裕は約1.319m。最も厳しい765pxの水平NDC最大絶対値は約0.99348で1未満。画面形状が異なるためviewport幅とcanvas幅を混同しない。

同じ構図の質感/照明OFF→ON画像、各区域俯瞰、5定点、赤土/木材近景は上記最終ディレクトリに保存。例:

- [門の最終低視点 Chrome390 reduced](final-chrome-56ce3a1-02/chromium-390-reduce-low-wb-gate.png)：門上部・柱・扉全体の収まりを画素閲覧で確認した。
- [旧mainとの同一初期構図16画像と性能比較](../performance/56ce3a1-run01/README.md)。

## 負対照（JSON応答だけを変え、製品ファイルは変えない）

| 変異 | 期待する検出 | 原票 | 結果 |
| --- | --- | --- | --- |
| gate-sightline | 門eyeを旧位置[-200,-35]、lookDown .1へ戻す | [final-negative-56ce3a1/mutation-gate-sightline/results.json](final-negative-56ce3a1/mutation-gate-sightline/results.json) | 両engineで視線地表交差 -2.680m を検出 |
| gate-framing | 門FOVを38へ戻す | [final-negative-56ce3a1-02/mutation-gate-framing/results.json](final-negative-56ce3a1-02/mutation-gate-framing/results.json) | 両engineで水平NDC最大1.580165…を検出 |

上記は期待どおり拒否した場合にのみexit0。旧定点の地面遮蔽と狭いFOVによる門のcropを検出し、修正版の正試験では同じoracleが通る。独立視覚レビューは別担当が実施しており、この原票を独立レビューの代わりとはしない。

## 保全した途中失敗と分類

- `run-2026-11-05T10-40-36.560Z`：sandbox内ブラウザのlocalhost `ERR_NETWORK_ACCESS_DENIED`。製品読込み前。`10-40-59.334Z`：昇格ブラウザからsandbox側serverに接続できずtimeout。親担当のserver再起動後解消。
- `run-2026-11-05T10-41-57.218Z`：当初の機能検査は通ったが、画像点検で門低視点が土に遮られる製品P2を発見。定点修正後、上記sightline負対照を追加した。
- `run-2026-11-05T10-43-14.749Z`：修正前matrixを保全して停止。765pxで影の期待をviewport幅から求めたQA誤りを、実canvas幅へ訂正。
- `green-chrome-01`：matrix8＋競合4＋WebGL fallbackはPASS。新GLB404ケースは補助A地形の非同期完了前に定点を検査したQA待機不足。製品を変えず待機を直した `green-chrome-fallback-02` は6/6 PASS。
- `green-webkit-01`：matrix7/8 PASS。390px reducedの景観entryで45秒timeout、ready=false、地域地形のまま、pageerrorなし。**根本原因UNKNOWN**。並行負荷が原因と断定しない。最終固定版の同じ45秒timeout条件ではPASS。新GLB404ケースには上記QA待機不足もあった。
- `final-chrome-56ce3a1` / `final-webkit-56ce3a1` のpreflight：新規framing oracleがGLB quaternion transform未対応でbrowser起動前に停止。独立変換を追加後、最終`-02`正試験は全PASS。
- `final-negative-56ce3a1/mutation-gate-framing`：oracle自体はcropを検出したが、Playwrightのカスタム文言が例外に出ず、期待拒否の分類器がFAILとしたQA問題。閾値を変えず明示Error理由へ変更した`-02`で両engine EXPECTED_REJECTION。
- `red-gate-01` は初回sightline負対照。最新版の原票は上の最終表を使う。

失敗原票は上書き・削除していない。実機iPhone Safari、長時間負荷、物理入力遅延はNOT_TESTED。独立レビューの全範囲と最終CIはPR側の報告を参照する。

## 再実行

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = '<existing Playwright browser cache>'
$env:PHASE3B_CHROMIUM_CHANNEL = 'chrome'
$env:TEST_URL = 'http://127.0.0.1:4317'
$env:PHASE3B_EVIDENCE = 'evidence/phase3b/browser/<new-positive-run>'
node scripts/phase3b-browser.mjs
$env:PHASE3B_EVIDENCE = 'evidence/phase3b/browser/<new-negative-run>'
node scripts/phase3b-browser.mjs --mutation=gate-sightline
node scripts/phase3b-browser.mjs --mutation=gate-framing
```

既存原票を上書きせず新しい出力先を指定する。engineを分ける場合は`PHASE3B_ENGINE=chromium`または`webkit`を設定。CI workflowは正試験・両負対照とartifact保存を行う。
