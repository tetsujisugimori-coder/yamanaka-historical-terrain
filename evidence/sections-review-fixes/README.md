# 独立指摘2件の修正と新規自己確認

修正製品HEADは `be3f4e1d408d64346188b41421f4e5a7f30be443`、tree `20e279caa1794b9c99b21e187156d570b9cca84b`。このフォルダを追加する後続commitは証拠のみ。実装担当の自己確認であり、同じ独立担当の再レビューは待機中。Draft/Issue OPEN、マージ推奨NO。

## P2-01：取消後の3D対応表示

元の独立反例と同じ4条件（Chromium/WebKit、実moat-study.glbの200/404、390px）。断面表示→断面教材応答を保留→nm-moat施設を選択→古い応答を解放する。

- `cancel-red.json`：元提出7e79e63で4/4 FAIL、runner終了1。readyは戻るが線0/点0、説明は3D切替中、比較controlsも非表示。
- 原因：beginIntentがready/app statusだけを復帰し、sectionと比較controlsは以前の切替中表示を保持。古い要求は正しく無効なので、その後にもsyncが起きなかった。
- 修正：現在の可視モデルの復帰をrestoreCurrentPresentationへまとめ、ready/比較controls/断面/説明を現在のstateで同期する。古い応答やカメラを採用しない。
- 正式な `submission/review-fixes/cancel-green.json`：同4件PASS、施設選択直後と古い応答完了後の両方で672値の線/3点/controls/説明/最新選択/視点を照合。復帰したC面の最大数値誤差0m（この4条件の実面頂点上。全体検査のFloat32許容は1mmを維持）。
- `submission/review-fixes/cancel-mutation.json`：復帰処理を除去すると同4件すべて `Section presentation missing after cancellation` で拒否。通信や別の失敗は期待FAILに数えない。

## P2-02：Cで選んだ対応位置の定義

計算自体は正しいが、Cで選んだ「堀底」等の同じ水平位置をAの極値と誤読できた。Aのプロファイル最低値はS+16mで569.669983m、Cの堀底対応位置S+10.5mではA570.313007m。点を別の位置へ動かして数値を替える修正はしていない。

- `labels-red.json`：未修正の両engine/2断面4件で、画面内の常時定義欠落をFAIL（終了1）として保存。
- 修正：点/寸法の直前、折畳み外に「Cで選んだ対応位置」「Aは同じ水平座標」「A自身の最深部・最高部や実遺構ではない」を常時表示。button/選択文にCの位置、Aの比高に「同位置間」を明記。
- `submission/review-fixes/labels-green.json`：両engine×375/390/1280×2断面12 PASS。常時可視・折畳み外・keyboard/focus・横超過なし、旧提出のA/Cプロファイル完全一致、1/2倍不変。
- `submission/built-labels/labels-green.json`：Pages相当のローカルbuildでも同12 PASS。公開デプロイではない。

## 残りの自己確認

`summary.json` が集約。`submission/summary.json` は既存の正常62、C保留/誇張4、高さ16/座標16/二重誇張8拒否と影響しない1倍8受理。集約の正常/欠落/破損/条件不足/source違い/HEAD違い6対照もPASS。`unit-final.txt` は26/26、通常/Pages build成功（既存bundleサイズ警告は留保）。`submission/subpath/results.json` の新断面8件PASS。

`regression/` は今回の新しい隔離cwdで実行した既存9結果JSON、248/248 PASS。8連続runnerの終了0はregression-exits.json、別途subpath4件も結果JSONとlogへ保存。元の提出証拠を上書きしていない。元main156ファイルのbyte保全はsubmission/geometry-and-protection.json、旧提出7e79e63のproduction/public data/evidence/sections/ATTRIBUTIONのGit差分も0。新たな依存packageやモデル生成変更なし。

`review-original/` は別担当の7e79e63に対する原報告・反例・execution-summaryのbyte一致コピー。原本は別workspaceにあり変更していない。SHA256はsummary.jsonへ記録。この原報告は旧提出に対するchanges requestedであり、修正後の独立承認ではない。

直下のgreen/mutation/labels-greenは修正をcommitする前の開発中自己試行（旧HEAD表記と実ソースhashを併記）。正式な修正製品HEADの票は `submission/`。REDや原レビューを後からGREENへ書き換えていない。

## CIと履歴

修正製品be3f4e1のPR Validate `41901030494` は5/5 SUCCESS、Pages build `41901030452` SUCCESS・deploy SKIPPED。専用jobログでも新4 PASS/復帰除去4拒否/常時定義12 PASSを確認。checkout仮マージ `5ff874ebb2d075d26cc78cb72c045e85373645c9` のtreeは製品HEADと同一の20e279ca。これは実際のmainへマージした意味ではない。証拠commit後の最終SHAのCIはPRへ別記する。

`prior-ci/` は旧提出7e79e63のpush CI attempt 1がAPT取得で24分以上続き、実装担当が中断したCANCELLEDのログ/metadata。断面検査本体は未実行、製品PASS/FAILへ数えない。厳密な取得長時間化原因はUNKNOWN。同じHEAD/依存でその1ジョブを再実行したattempt 2は全5ジョブSUCCESSまで確認。新しい製品HEADのCIへ流用しない。

実機Safari/VoiceOver/現地/標高補正/歴史的位置精度は未検証。幾何一致を歴史的復元の正確さの証明にせず、旧QGISクラッシュ/timeout原因UNKNOWNとIssue #1/#4/#5 OPENを維持。独立再確認前のDraft解除・マージ・公開なし。
