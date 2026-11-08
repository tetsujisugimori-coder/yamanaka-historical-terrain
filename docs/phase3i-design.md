# 第3期I：範囲・計測・受入

基準main `42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8`、tree `38d033ca9c00e996ac82403de23121d901ca59b4`。Issue #25。マージ・公開なし。

## 景観

西側inner approachの小区間Cを改訂。西木戸口本体の新規精細化ではない。詳細・原本・再生成は phase3i-production.md。Dは赤土/草/踏み跡の多尺度色変化、6低木の個体差。種・分布・路面を史実としない。主地形・旧原本・木柵v0は不変。LOD/地形分割は導入しないため測定と歩行に別の簡略地形を渡さない。

## 計測を先行した選択

最適化前のHはローカルChromium 1280×900 DPR1、3 cold+3 same-context reload。Resource TimingはGLB fetch最大約186msに対して施設準備数秒。CPU profilerはcreateWalkWorld、色変換/頂点処理、GCを観測したが `(program)` に多くの時間が入りGPU原因を特定していない。

採用：同じフレーム内で複数回要求されたrenderを1回へ集約（最新sceneを描画、次フレーム要求は許可）。色定数の解析再利用とD頂点ループ一時Color再利用。幾何・衝突・断面精度は削減しない。

不採用：LOD/粗い遠景/メッシュ分割/段階的読み込み。今回のfetchは主待ち時間ではなく、複雑な可視性・接地契約の導入を正当化する証拠がない。品質低下を速度改善の代用にしない。

IのtimedGLBは同一originのGLB bytes取得とparseAsync、geometry/material準備を別CPU時間として記録。renderCPUはCPUコマンド送出のwall timeでGPU終了時間ではない。ログは128件上限。GPU upload/描画完了・実VRAMはNOT_TESTED。ready+2RAFはpresentation proxy。

## ローカル予備結果

H cold施設準備median7524.103ms [7377.508,8365.267]、I4523.292ms [4484.753,5457.680]。
H reload median7657.549ms [7524.356,14498.119]、I4532.781ms [4438.133,5195.863]。
H→I順の非交互pilotで約40%短縮。CI同条件比較で再確認する。G11.61秒/H12.89秒は旧CI参考値で、このローカル母集団に混ぜない。

初期2回はサーバーとブラウザを別の実行セッションに置き接続拒否。全行FAILを原票に残す。同一シェルでサーバーと試験を実行して解消。製品障害や過去H timeoutの原因判明とは扱わない。warmは実transferSizeを原票確認し、単に2回目という理由でキャッシュヒットを断言しない。

## 検証

既存H専用比較は基準H commitで固定実行し、現在版の正式16条件は新I runnerへ引継ぐ。古い故障注入先がHのままならIでは実行されないため、C/E等の既存runnerの対象GLBとhashをIへ更新。過去証拠を上書きしない。歴史的RED反例はHソースsnapshotに固定。

独立レビュー・最終HEAD CI未完了時点では受入PARTIAL。実機iPhone、GUI操作、物理タッチ、史実完全形状・正式CADはNOT_TESTED/UNKNOWN。次期Jは西木戸口本体の小区間、実機計測、GPU query、必要性が実測できた場合のLOD検討。

予備Iでは描画要求27回を10回のフレーム描画へ集約。GLB body総量はH14,795,204B→I14,802,080Bと6,876B増加。冷間transfer14,797,004→14,803,880B、再読込transfer6,872,236→6,872,964B。再読込は大きな主GLBの再転送が残る混合cacheであり、完全warm cacheではない。
