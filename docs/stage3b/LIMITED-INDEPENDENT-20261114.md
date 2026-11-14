# Stage 3-B 限定閲覧補強・独立レビュー（2026-11-14）

## 対象と独立性

実装担当とは別担当が AGENTS.md、限定受入契約、製品差分、追加ブラウザ runner を読んだ静的レビューと、独立 Python GLB oracle の実行記録です。実装担当の自己申告・既存 CI 成功を今回の再検証に読み替えません。

開始時の対象は PR #42 HEAD `364afd95e6cc6f2f1899413b4bafd85adda23de9` と main `c0ba33b52c86b252ef570467b7b5058fb33d87d2` の通常 merge 後候補。追加 runner レビュー時の commit は `c303073ec2e3f5cbb4ce70b5e12367c5f6edf3d1` / tree `ea4323ee74dcf7b8777c854e57debc46e73421d3` で、runner に未コミット変更が存在しました。最終候補・最終 CI の認定ではありません。

## 発見と追跡

| ID | 優先度 | 発見 | 現在の確認範囲 |
|---|---|---|---|
| P2-01 | P2 | destination を現在読込済みの features のみで判定すると、既存 dc 詳細が未読込のため「対応なし」となり、遷移前に取得できない | 明示的22ルートの契約、lazy-load後の存在・intent確認への変更を静的確認。実ブラウザ到達は別確認 |
| P2-02 | P2 | loadInner/loadConnected の false を無視すると、対象GLBなしでも詳細選択・camera移動が進む | 取得失敗で停止し、成功後にのみ setView する変更を静的確認。故障・回復原票は別確認 |
| P3-01 | P3 | 復帰ボタンをdisabledにした後のfocus復帰がない | open.focus追加を確認。ただしpending open中のdisabled入口は別の実ブラウザ条件 |
| P2-03 | P2 | runner の response到着待ち＋cameraの2回一致は、旧応答body/parse/旧操作の終了前でも成立し、遅い上書きを誤受理し得る | readonly detailOperations の同一ID terminalをfinallyで記録し、旧ID完了後に比較する修正を静的確認。初期terminal値とrunner期待値の不整合を追指摘、修正・原票待ち |
| P2-04 | P2 | runner が製品の available=false を無条件に「理由付き未対応」として受理すると、全詳細リンク未接続でも行列PASSになり得る | 固定22件すべて available=true を要求する修正を静的確認。単に説明があるため未対応を受理する経路は通らなくなった。原票待ち |

修正前のP2-01/02は静的制御経路の指摘です。ブラウザで同一反例のREDを独立再現したとは記録しません。P2-03/04もrunnerの制御・受入条件の不足であり、故障注入実測済みという意味ではありません。

## 独立範囲計算・原本保護

既存 `scripts/stage3b-independent-oracle.py` を新しい証拠領域へ実行しました。製品 generator/Three.js を呼ばず、Python structによるPOSITION読取と独立4×4行列演算で照合しています。

- 5保存GLB由来22模型：最大数値差 **0 m**。
- 保護212原本：改変 **0件**。独立oracleと保全検査器双方で確認。
- 履歴原票・GLBの再生成や編集はしていません。
- 原票名：`independent-review-bounds/coordinate-oracle.json`。保全先・SHAは最終証拠台帳に対応付ける必要があります。
- この0 mは計算整合であり、史実位置・境界の精度ではありません。

## 暫定判定と未実施

**PARTIAL、限定マージ推奨NO。** 製品側の初期P2は修正を静的確認しましたが、runner P2の閉鎖、固定16条件、故障・回復・遅延の原票、最終HEADのCI、保存後実バイト独立読戻しの確認は本記録時点で未完了です。

Stage 3-B全体PARTIAL、11歴史区域未配置、位置根拠・残差・runtime網羅・連続歩行・履歴stress・性能・Blender GUI・実機Safari/touch/VoiceOver・現地検証のUNKNOWN/NOT_TESTEDを維持します。Draft解除、マージ、公開の承認は本レビューに含めません。

## runner追補レビュー

P2-03に対し、保留中の旧操作ID取得、新操作の完了、旧応答解放、同一旧操作IDのterminal、not-completed、実snapshot比較という順序を静的確認しました。P2-04の22件可用性強制も確認しました。修正したrunnerによる実行結果はまだ本担当で読戻していません。旧smokeの成功をこの修正後runnerの成功として扱いません。
