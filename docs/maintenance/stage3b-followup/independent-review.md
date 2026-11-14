# 独立レビュー（作業候補・2026-11-14）

## 範囲と版

対象は PR #42 の限定閲覧補強。開始 HEAD は `9d8a4cc336a87871b2aac49519a08b64ba3adf75`。
以下は未commit作業候補を独立担当が検証した記録であり、開始HEADそのものの成功や最終CIの成功を意味しない。
最終確認時の `src/main.js` SHA-256 は `674d51811137cd2962a9fcf169f621c01f014d82c8148644133a496328172406`。
最終提出HEAD・CI原artifact監査は別追補で結合する。

## 独立反例と再確認

1. **表示設定がOFFの模型をcompleted扱いするP2**
   - Chromiumの通常UIで城内景観→「C 推定施設を表示」をOFF→俯瞰→ic-lookout→詳細。
   - 修正前：operation completed、説明は選択中だが、実mesh 2個とも祖先groupが非表示。
   - 修正後：同じ操作でnot-completed、設定は保持し「非表示／詳細未完了／CをONにして再試行」を表示。
   - CをONにして同じ詳細操作を再実行するとcompleted、両meshと祖先が可視、説明も通常に戻る。局所閉鎖。
2. **共有取得Promiseが古い操作に束縛され、最新の同資源要求も破棄されるP2**
   - ic-lookoutのGLBを保留し、通常UIでic-bridge詳細を要求してから解放。
   - 修正前：両操作not-completed、選択はcastleのまま。
   - 修正後：取得のみ共有し、各待機操作が所有権を別判定。旧操作not-completed、新操作completed、選択ic-bridge。局所閉鎖。
3. **故障対照の正常／故障で元配信JSが異なる比較不成立**
   - 予備hidden-controlの正常JSは747,063 bytes、SHA `01cb3a34da0f72b727274636cdf3812be51b1b446ccf520f944bffcaf6d8806c`。
   - 故障側の元JSは748,229 bytes、SHA `74b73e72c9f5a574e025e25df311af020408b20ebbe3183e7609e1d1fa63960f`。
   - 保存実物のhashと故障挿入の単一変更自体は一致するが、両者の画素比較を一因子の成功と扱えない。旧証拠は保持しNOT_COMPARABLE。
   - 検査器へ正常JSと故障側元JSの実hash一致を必須化。不一致はNOT_COMPARABLE／非zero終了。最終の固定build再実行が必要。

## 関連確認

- 関連単体6件を独立実行し成功。
- 遅延inner応答が選択・cameraを変えずとも描画を変える旧原票を照合。`loadInner` / `loadConnected` がsceneへ追加する前のintent確認が必要であることを確認した。
- 実meshの可視状態、祖先可視、POSITION、boundsの検査と、実HTTP entity bytes・build bytesの保存方式を確認。entity bytesは圧縮済み通信パケットそのものではない。
- 22模型のPNG保存だけを全模型の描画認識成功とは扱わない。代表故障対照、実物画像の独立確認範囲と区別する。

## 証拠と残件

独立反例・trace・PNG・JSONは案件証拠領域の `independent-review`、`independent-review-after`、`independent-review-after2`、`independent-recovery` に分離保持。作業途中原票であり、最終原artifactへ成功として混ぜない。

このレビュー時点で最終WebKit、全正式条件、最終CI、Library保存後再取得の独立照合は未確認。限定受入・限定マージの総合判定は保留。Stage 3-B全体、実機Safari、物理タッチ、VoiceOver、史料精度や歴史区域の配置は受入対象外。

### 固定build対照の独立再照合

`hidden-fixed` の保存実物13ファイルをmanifest・size・SHAで再照合。正常と故障元JSはともに `a89b6bf7021f064db8ea8971e288de58383292d467bf0bda874bd4ab8a6f7cb0`。故障JSは指定位置へのtarget mesh非表示コードの単一挿入と実バイト一致。両者のcamera/target/fovは同一、各条件の無変更control PNGは一致、正常／故障PNGは不一致。正常GREEN・非表示理由によるSEMANTIC_REDを独立確認した。これは固定buildの局所対照であり、最終HEAD CIやLibrary保全の代用ではない。

独立反例を正式CIで再検証できるよう `scripts/stage3b-review-regressions-browser.mjs` に2ケースを固定した。Chromium/WebKitごとに実行し、非表示拒否→回復、同資源の最新操作成功を別々に記録する。
