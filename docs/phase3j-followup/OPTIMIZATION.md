# 工程B：低木支持点キャッシュの独立再検証

Issue #33。baseは工程A PR #34、計測採用と最適化採用を分離。PR31はDraft保全。

## 最小候補
元000fdの `surface-support-cache.js` と12契約試験をそのまま移植。mainのimport・生成・shrubSupport呼出・read-only statsのみ変更。Aのobserver、geometry/material区分、runner、validatorは完全同一。GLB/原本/表示内容/形状/地表探索算法を変更しない。

## 固定実験
[PLAN.md](PLAN.md) のA-pre/B/A-post×8block×cold/partial reload（48試行）。別枠の詳細3block（18試行）。全試行/失敗/外れ値を保存。中央Bから前後Aの平均を引いた対差と、A-post−A-preの順序ドリフトを報告する。非対称効果や非線形な時間変動を完全に除去する保証ではない。

全体性能条件未達なら保留/不採用。局所shrubSupport短縮だけで全体改善PASSにしない。旧独立 -1.55%/+1.71%は元原票から再計算し、今回の新実験と合算しない。地表索引/GLB解析/材質/rendererは今後の候補として詳細値を記録するが、未実装最適化にbefore/after効果を付けない。

## 留保
実機Safari、物理入力、GPU内部、測定した共有ホスト以外への一般化はNOT_TESTED。景観/史実の受入は別。マージ・公開なし。
