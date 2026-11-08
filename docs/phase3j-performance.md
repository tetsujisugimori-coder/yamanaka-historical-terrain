# 第3期J 性能調査（作業中・受入未完了）

- Issue #30、関連 #28。景観限定受入 #27 / 景観継続 #29 とは分離する。
- #26 は未マージ。依存基準 `e67f1fc81c38986ccf8170d1942a1894992c0f3a`、旧性能証拠 `b190e951b23b579c887f3bf1993f27e97ef1335f`。本PRは #26 のbranchをbaseとする。
- 原本、GLB、過去の失敗・性能証拠は変更しない。マージ・公開なし。

## 分母の訂正

「未分類72%」は H の一回のCPU profileの `(program)` selfサンプル9,999.891ms / 全サンプル約13,889ms。最終Iの施設準備wall時間の割合ではない。GPU/シェーダーに帰属させる根拠ではない。元根拠は [Issue #28原コメント](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/issues/28#issuecomment-6725456152) と既存 `evidence/phase3i/H-cpu-profile.json`。

## 計測設計

詳細観測はURL `?profileJ` のときだけ有効。単調時計のstart/endを保存し、入れ子・並列区間の和集合を全体wall内へclipして説明率を計算する。各stageのinclusive値は加算しない。fetch wallは他のJSと並行し得る。render CPUは同期コマンド送出であってGPU内部時間ではない。残差には入力配送・Playwright待機・RAF・未計測処理が残る。原因を推測で埋めない。

`phase3j-benchmark.mjs` は1280×900/DPR1、同一browser/context設定、同一hostでI/JとJ/Iを交互に各10回実行する。各fresh contextのcoldに続き同contextのreloadを実行し、実際のResourceTimingから転送を記録する。reloadは完全warmと呼ばない。施設taskは従来と同じlandscape→inner→walk開始→終了→2RAF。これは初回可視施設だけでなく歩行準備を含む。個別操作wallも保存する。p95はn10 nearest-rankの不安定な参考値。

基準Iは挙動不変の計測追加commit `3ffc75f334cfdaf21e7481f44572d009b3693ac2`。`profileJ`なしの既定測定と詳細あり3回を分け、計測干渉を評価する。元Iとの完全無介入比較は別途必要。固定GLB hash、runner/source hash、HEAD/treeはCI manifestへ保存する。

## 候補最適化・実測前の限定根拠

予備1試行でsyncNatureの低木支持計算7回が各100〜161ms。6点の地表raycastの再計算が重複しているため、導出支持点だけを1状態キャッシュする。形状・表示品質・同期render・研究データは変更しない。メッシュ配列、geometry、position/normal/indexのidentity/version、world matrix、exaggeration、drawRange/groups/material sideを比較し、一つでも変われば再計算する。返す値はコピー。例外時は前の完全結果を保つが別signatureに流用しない。試験で再利用・各無効化・失敗保全を検査する。

これは候補であり、同条件の全体待ち時間短縮と独立レビューが完了するまで性能PASSではない。効果が確認できなければ採用しない。

## 未検証

最終CI、独立レビュー、16条件回帰、同条件独立性能再測定は進行中。GPU内部時間、実機Safari、物理入力はNOT_TESTED。景観品質や史実の認定は今回の性能判定とは別。

## 独立一次レビューと修正中の経過

初期HEAD fd5fc11の比較検証器にP2：HTTP失敗/終了状態/重複資源/来歴欠測の誤受理、非有限区間による偽100%説明率を検出。原票はpilotとして保全し、正式受入には使わない。runner・validatorを修正し、外部expected identity、必要6GLBの一意性と正バイト数、final ready/loaded/walk停止、HTTP失敗、完了時刻、profile有無・有限区間を検証する。新規同一反例RED→GREENは独立再確認待ち。cacheにはlayers.maskも追加。

詳細観測の残差を分けるため、試験runnerがpassive/captureで実際のtrusted click配送時刻を記録する。操作開始→clickは自動操作のactionability/scroll/配送待機区間として別表示し、アプリCPU時間へ混入しない。最後の2RAF待機も別区間。これらもGPU完了の証拠ではない。

最初の40試行は中央値cold I2620.8→J2540.9ms、reload2737.6→2678.35ms。各10対中6対が改善、分散大。全体改善確証とはしない。共有ホストで他処理との競合があり、詳細pilot収集中に単体試験も重なったので独立した正式再測定を要する。

## Observer correction after failed final comparison

Run42521001762 at6002c65 preserved40 raw trials but strict validation failed: I trial2 cold renderCPU start369.1999999999971 exceeded end367.6999999999971, reported ms0.6999999999970896. The I observer sampled clock twice; the second call was delayed. No summary or detailed12 exists for that run. Do not repair its raw intervals or retry until green.

New separate I baseline49ef2246e573ca0585763486cd8f9afbede23ba1 (parent3ffc75f334cfdaf21e7481f44572d009b3693ac2, tree93855b5fbbc27d63a6dd060e86e42685f29c65d6) changes only the observational logger to use one clock sample, matching J. The workflow and validator now require this new baseline. Fresh paired runs are a separate experiment and must not be pooled with prior3ffc results. Historical main task wall measurements remain raw observations but did not have fully identical observer implementations; historical internal coverage is arithmetic on recorded spans, not pristine observer parity. The old baseline, failure ZIP13632529700 and every prior result remain preserved. Candidate application bytes are unchanged by this correction; no acceptance relaxation occurs.
