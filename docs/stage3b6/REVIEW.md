# Stage 3-B6 独立レビュー（局所・正式CI前）

2026-11-15 UTC。製品作成に関与していない別担当が、既存AGENTS、B5台帳、B4の存在/権利境界、正本overview、B6契約、製品・検査器を直接読んだ。旧対象 `7683cd8` と未commit修正実体を比較した。正式CI・保存後ZIP監査・代表画面目視はこの時点ではNOT_TESTED。これを最終レビュー済みとは扱わない。

## 同一反例の独立再確認

|指摘|旧版|修正版|確認範囲|
|---|---|---|---|
|P2-B6-1 同一region/model関連の重複がindex採番で隠れる|実adapter相当で誤受理|`duplicate relationship pair`で拒否|同じJSONから実際の公開adapterへ入力|
|P2-B6-2 模型詳細から区域への逆導線がない|22模型すべて逆リンク/未確証表示なし|関連1模型に戻るボタン、残21模型に関連区域未確証|両版の実`select`関数をDOM stubで実行。リンク押下がnishinomaru/focus=trueを渡すことを確認|
|P2-B6-3 根拠なくconfirmedと座標を与えても受理|誤受理|`unplaced geometry`で拒否|同じhonmaru確証昇格・Point座標のJSON|

正本正常入力は旧版・新版とも受理。修正版契約試験を独立実行して **25件PASS、0FAIL、0skip**。単純な起動失敗を意味的拒否に数えていない。P2三件の局所修正確認はPASSだが、逆導線の実ブラウザ操作・表示・フォーカス確認は正式原票で別途必要。

## 実体識別

- 旧contract SHA-256: `0f7bd55bf9ed15c189adfd6874e16d735242123a12526d0ee51c55b765964921`
- 修正contract SHA-256: `ea4395c85b87fd34c1317a126131c146594e56c8547c4fef841e9ababddd63f8`
- 旧overview SHA-256: `110ed579a8c51ab589c57ddfab3af842614af58eda9c2f2d5bda3794377d9b07`
- 修正overview SHA-256: `71c4c8d59a619e32f142a6986190c535897de03766a86c98c9b06de7b0e66506`

実行スクリプト・変異入力hash・結果・レビュー時sourceを専用証拠領域へ保管。後続変更がある場合は上記hashとの差分を確認すること。

## 根拠・保護境界

史料の既存要約と確認範囲、推論、C、A、UNKNOWNを分離し原図本文を転載しない。現状の唯一の関連は西ノ丸/nm-baileyのsoftware-audit-associationであり、歴史的位置や史実上の関連の新認定ではない。他21模型への無根拠な新関連はない。
`stage3b5-preservation.mjs`を独立実行し、保護230-path集合、212原本、22模型のsize/SHA/Git blob照合PASS。保護対象自体を変更していない。

## 未確認・停止条件

- 正式16条件・代表画像・原ZIP保存後独立読戻しは未実施。
- Node source-sliceの成功はWebGL/実機操作の成功ではない。
- 実モデルの非表示を表示成功と数えない検査、遅延応答と区域/俯瞰競合は対応する正式原票で要確認。
- Stage3B HOLD、実歴史polygon/実変換NOT_TESTED、現存/権利UNKNOWN維持。
- 現時点の総合PARTIAL・限定マージNO。最終CI/証拠/実画面を確認後に追補する。
