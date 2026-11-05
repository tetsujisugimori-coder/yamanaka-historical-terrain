# 独立P3：定点の操作可能性と案内

対象は独立レビュー済み `fbdeac1646d7e51a345b96c9e2830052a22f88df` に対する局所修正。以下は実装担当の自己検証で、修正HEADの独立再確認ではない。最終HEAD/treeとCIはDraft PR #10本文で固定する。

## 原因・修正

「1590年の景観へ」→「曲輪に立つ」→有効な拡大ボタンを押してもカメラ/注視点が変わらず、ホイールや2本指の通常案内が残る。`zoom()`の定点早期returnは安全のため意図した制限だが、ボタン有効状態と案内が同期していなかった。

`src/main.js` の `syncNavigationControls()` で読込状態と定点状態から拡大・縮小ボタンを無効化し、画面/ariaの案内を見回しへ切り替える。定点入場、model読込完了、定点終了で同期する。既存zoom早期return・足場計算・カメラ安全処理は非変更。俯瞰で通常案内とズームを復帰する。

## 同条件と負対照

| 票 | 結果 |
|---|---|
| [修正前](red.json) | Chromium/WebKit ×390/1280 ×1/2倍 ×4定点、32期待FAIL。有効な拡大を実際にクリックしeye/target不変、誤った有効状態を検出 |
| [修正後](green.json) | 同32 PASS。拡大/縮小disabled、固定用表示/aria、Equal/Minus不動、ArrowRightとtrustedドラッグで見回し、A/CD比較時のeye/target維持、俯瞰で元HTML/ariaとズーム操作復帰 |
| [同一ケース比較](same-cases.json) | 全32で修正前後の初期eye/targetが完全一致。A/C raw GLB別計算の高い地面＋1.7m、許容1mm |
| green.jsonのtouchRows | 別ページでChromiumのtrusted touch drag、4定点×1/2倍＝8 PASS。eye固定・target変化。32条件のmobileでは両engineのtrusted定点tapとdisabled zoom tapを検査 |
| [zoom変異](mutation-zoom.json) | disabledの定点条件のみ除去。両engine、計2期待FAILを具体的なenabled理由で検出 |
| [案内変異](mutation-guidance.json) | 固定中も元案内を表示。両engine、計2期待FAILを具体的な案内理由で検出 |
| [単体](unit.txt)、[build](build.txt) | 28/28、production build成功。既存500kB超bundle警告あり |
| [保全](preservation.json) | 前提出の5編集対象以外886ファイルを照合。バイナリは生byte同一。テキストの既存CRLF/LF差は生hashと別記し、内容を変更していない |

新しい定点画面：[PC](green-chromium-1280-1.png) / [390px](green-chromium-390-1.png) / [WebKit390](green-webkit-390-1.png)。比較用の[旧390px](red-chromium-390-1.png)も保存。低視点の景観形状・配色・全GLB/制作正本は変更しない。通常の俯瞰・A/C/D代表画像と性能実測は親フォルダーの旧提出票を継承し、性能の再測定はしていない。

## 検証手順の失敗と限界

[初回green](green-first-timeouts.json)では、同じmobileページでCDP連続touch drag後にPlaywright tapを混在させると後続定点に入れずtimeoutとなった。途中票を成功票に上書きしていない。[同じ混在手順](harness-with-cdp.json)ではtrusted pointerdown/upは届くがclickなし、[CDP dragだけを除いた手順](harness-without-cdp.json)ではclickと定点入場が発生した。[自己診断source](harness-sequence-source.mjs)と[画像](debug-bank.png)を保存。ブラウザ内部原因はUNKNOWN。最終検査は共有ページのtap検査と、新規ページでのCDP touch見回しを分離する。この失敗を製品全体のtouch PASSへ読み替えない。

[最初の保全検査](preservation-first-eol-failure.json)はGit archiveのLFと既存作業ツリーCRLFを生byte比較し20テキストでFAILとなった。修正版は生hashを残しCRLF→LFだけの差を分類する。3Dバイナリへ正規化を行わない。

連続trusted touch dragのWebKit確認、実機iPhone Safari、VoiceOver、現地はNOT_TESTED。キーボード・mouseドラッグとtrusted touch tapの自動WebKit成功を実機確認と呼ばない。独立レビュー原票はここに含めない。fbdeac1の独立レビュー要約は親担当提供であり、修正後独立再確認は未実施。追加全62断面runnerも独立完走していない。

```powershell
npm run dev -- --port 4317 --strictPort
# 別terminal
node scripts/landscape-fixed-controls.mjs --label=green
node scripts/landscape-fixed-controls.mjs --label=mutation-zoom --mutation=zoom
node scripts/landscape-fixed-controls.mjs --label=mutation-guidance --mutation=guidance
node scripts/landscape-p3-preservation.mjs
```

`red`は旧fbdeac1のsourceを配信した環境でのみ再現する。新source上でredを実行して旧反例の代用にしない。CIは新しい出力先へgreenと両変異を保存し、元ローカル票を上書きしない。
