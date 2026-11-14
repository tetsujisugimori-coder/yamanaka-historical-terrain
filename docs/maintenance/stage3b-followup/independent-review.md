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

### phase3e既存async契約の独立再確認

提出 `eb91adf` の正式run `43581806025` でpending-resetがtimeoutし、404はPASSした旧原票を保持・独立照合した。旧テストは「cacheのみ」と説明しながら `phase3c.loaded`（sceneへ接続したinnerMeta）を待っており、今回の古い応答によるscene接続禁止と矛盾していた。

取得完了とscene接続を別観測に変更した最終候補を独立実行し、pending-reset・404の2件PASS。timeoutは延長せず、HTTP応答完了、同じacquisitionのacquired/terminal、古いwaiterのstale-discarded/terminal、scene未接続、全state・comparison・camera・target・fov不変を要求する強化を確認した。候補main SHA-256 `75d99d84d539b5c93d733a5415f0702f477472250c790c2b2f4be68a6c7875e6`、試験script `cbe9237fa296638971f9c9b2dc9706bea51ce5a8d2242a87a78d052ab6cdff74`。原票は `independent-async-final` に分離保存。これは最終提出HEADのCI成功の代用ではない。

### 植生の既存重複除外契約

初回productionの植生4mesh非表示FAILを保持した上で、既存 `docs/phase3b.md` と `landscape.js` の西方地形重複除外を確認した。Three.jsや製品 `landscapeModel` を使わずPython structで元GLBのPOSITIONとnode TRSを独立再計算し、108元nodes、重複4batchの頂点数 `[84,210,252,546]`、非重複4batch `[504,546,672,1722]` を照合した。

新検査はこの既知理由だけをsc-vegetationに限定し、西方の実mesh、祖先可視、非除外mesh可視を要求する。全非表示、別ID、未知理由、sourceFlag不整合、西方表示なし・実meshなし、祖先非表示、POSITION欠落、bounds欠落を拒否する関連単体を独立実行した。dev補助原票でも正常4可視/4除外、C OFF拒否、全植生hidden拒否を確認。利用者向けの部分除外説明も追加され、樹木が地形へ同等置換されたとは説明しない。単純な「1meshでも可視なら成功」への緩和ではない。最終production CIの成功は別途確認する。

### phase3c既存stale契約の独立再確認

提出 `ea4ec6e` の正式inner run `43583845386` の原ZIP（SHA-256 `c15214f0c889eae4335858ac3b518b618b2c9cc0b49ff53b7981a3b130c9c2af`）を再読出し、CRCとChromium/WebKitのstale-success・stale-failure計4件の45秒timeoutを独立確認した。旧検査の `loaded || unavailable` はscene接続または現操作のerror反映を待つため、古い応答をsceneへ接続しない新契約と矛盾していた。旧失敗原票を保持する。

試験器だけの修正を独立読解し、同じ保留HTTP応答・成功200/失敗404・timeout45秒を保持したまま、対応するacquisition sequenceとwaiter IDのterminal、acquired/failed、stale-discarded、scene未接続、全state・comparison・camera・target・fov不変を要求する強化であることを確認した。製品の生成・表示処理や正式期待値を成功のために変更していない。

別port・別証拠領域で同じ修正scriptを独立再実行し、Chromium390pxの通常/Reduced Motion 2条件と8故障条件がPASS、source-stabilityもPASS。stale成功/失敗の原JSONを別読み直しして、HTTP終了と取得/旧waiter終了、その後のstate不変を照合した。対象main SHA-256 `857ba83920495004526db545eed0c2afdc2949ce814ac8d0d10a0bc24ce67455`、script SHA-256 `cc223656f1de850a0ae62c9932ade909472df5ba82de694f0c5530e11b1e26e8`。補助原票は `inner-terminal-independent` に保存。これはdev配信の局所再検証であり、最終提出HEADの正式CIやWebKit再受入の代用にはしない。
