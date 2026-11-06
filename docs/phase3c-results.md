# 第3期C 提出結果

## A. 総合判定

**PARTIAL。** 見張台・土橋・虎口の C 候補と誘導式観察を実装し、実制作物と再生成手順を保存した。独立確認で見つかった黒化と入力応答の P2 は、原因に対応する修正と反例の再確認まで進めた。史実の精度、写実品質、実機受入を含む全体 PASS ではない。

現在の証拠固定候補は 47b8a80。ブラウザ・画像・性能の確認済み結果を以下に記録する。残る描画回数診断と既存 CI の最終完了までは、マージ推奨 **NO**。本書だけを根拠に完成・公開済みと扱わない。

## B. 新規施設と景観の実装結果

- **見張台 ic-lookout:** 建物を捏造せず、土の高所と周辺地表を制作。虎口との距離はモデル上約 13.0 m。高所から入口と通路を見下ろせる。
- **土橋 ic-bridge:** 長さ 32 m、狭部幅 4 m の C 通路と両側の切り下げを一枚の地表として制作。別の浮いた床を重ねない。旧地表への境界支持を保持した。
- **虎口 ic-koguchi:** 入口地表と左右の土塁。外側と内側から同じ土塁の裏側を比べ、隠れる場所の違いを読む。既存冠木門・西木戸口と別 ID。
- 西ノ丸→見張台→土橋→虎口外→虎口内→西櫓→西木戸口→西櫓堀の **8 地点**。歩行や戦闘の再現ではなく、足場を確認した静止観察。
- D の赤土・草・木材に多尺度の不規則模様・木目を追加。短周期の格子反復と木材黒つぶれは改善した。均一な色面と面割りは残り、写実完成とはしない。

## C. 史料・推定・演出の区分

全新形状は **C、B への昇格なし**。細かな模様・色むら・光影は D。A は現在の測量地形であり、1590 年の地表ではない。

三島市保存活用計画の印刷 p78 は見張台虎口と西櫓側の役割関係を支持する。p102 は橋脚柱穴を確認できず、木橋接続を不明としている。参考寸法・実装寸法は別フィールドであり、モデルの位置、幅、勾配、年代を史料確定値にしない。建物や柵の存在を名称から確定しない。

[史料・寸法・仮定・UNKNOWN 台帳](source-model-ledger.md)と[独立史料レビュー](../evidence/phase3c/independent/history/REPORT-v2.md)を参照。原図・写真・PDF は再配布していない。見張台の土塁上への立入り制限を含め、仮想観察を現地案内に用いない。

## D. 3D 制作物と再現確認

- 編集可能な [Blender 正本](../production/yamanaka-phase3c.blend): 216,261 bytes、独立した新 7 メッシュ。旧正本を複製した大きなファイルではなく、旧成果物は別名のまま保全。
- [QGIS 正本](../production/yamanaka-phase3c.qgz): 21 有効レイヤー。C 派生標高、施設、地点、仮想視線を編集可能。
- [Web GLB](../public/data/phase3c.glb): 507,052 bytes、7,342 三角形。[JSON](../public/data/phase3c.json)、GeoJSON、派生標高、recipe と整合。
- EPSG:6676 由来のローカル m、既存原点・方位・1 unit = 1 m を維持。
- Blender 4.3.2 と QGIS 3.40.6 を実行し、**別プロセスで再読込**。独立再 export の座標差は 0。隔離した再制作でも新 7 メッシュと GLB/JSON の一致を確認。
- 旧 1,263 ファイルは byte 不変、旧出典 6 レコードを保持。固定 2 断面は別の raw GLB 計算で一致。

[制作レシピ・再現手順](phase3c-production.md)、[native 証拠](../evidence/phase3c/native/)、[独立技術レビュー](../evidence/phase3c/independent/technical/REPORT-v2.md)。旧 QGIS 版の警告、初回過密版、v1 の距離・急勾配不備と修正履歴は残している。

## E. ブラウザ観察・画面画像

Chromium と自動 WebKit、375/390/765/1280 px、通常/reduced motion を検査。製作者の観察・非同期・失敗経路 31 件と、別担当の独立検査 22 件が成功した。独立検査は実オブジェクトへの raycast と属性・状態の照合であり、製品の合格関数を再利用していない。

8 地点 × 2 engine × 390/1280 px の C+D 画像 32 枚を独立目視。通路両側の落差、虎口の外内で土塁に隠れる面の違い、西木戸口の絞りを確認した。見張台の 390 px 構図は狭く、方向操作で見回す必要がある。

**A との同一視点比較は 8 地点中 7 地点で足場が一致せず、安全に canvas を隠して理由を表示する。** カメラを勝手に持ち上げたり共通の床を創作したりしない。地点を選び直すと、表示中の実三角形面から物理 1.7 m の目線を設定する。全地点で A/C 比較できるとは主張しない。

画像と実行原票は次の公式 artifact に保存。ZIP SHA256、HEAD/tree とソース hash を照合済み。[証拠対応表](../evidence/phase3c/ci/47b8a80-provenance.json)と[独立視覚結果](../evidence/phase3c/independent/visual/FINAL-47b8a80.md)を参照。

- [観察 31 件・画面画像](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881096/artifacts/13472749491)
- [同条件外観 24 枚・性能 72 試行](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881096/artifacts/13473804018)
- [独立正常 22 件・故障再投入 2 件](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881096/artifacts/13473859588)

これらの artifact の表示期限は 2027-02-04。画像を Git に恒久保存したとは扱わない。修正前画像と性能原票も[元 artifact と hash](../evidence/phase3c/history/IMAGE-EVIDENCE.md)で保持。ローカルブラウザ起動失敗は別途記録し、CI の実行と混同していない。

## F. 既存回帰・負対照・性能

- 単体 49/49、build 成功。座標ずれ・誤 ID・B 混入・地表の割れ・旧急勾配・低すぎる目線を検査が拒否。
- 共有 geometry の UV 残留を旧 RED、新 GREEN、故障再投入で検証。表示用 geometry コンテナをメッシュ別にし、元属性・index を書き換えない。
- COLOR 属性がない新地形・旧木材等で頂点色を有効にした黒化を修正。実 419 メッシュの独立属性確認、修正後画像、旧コード再投入の Chromium/WebKit 各 1 件で専用署名による期待拒否を確認。
- 404→再試行、古い成功/失敗応答、必要な旧地表の欠落、WebGL 不能時の HTML 解説、固定断面、倍率、既存施設を回帰。
- 同一 run 内・同じ camera/target/canvas/品質の 72 性能試行で、全 12 条件の合成キー＋2 RAF 中央値が改善。WebKit 1280 は標準 1091.5→508.0 ms、軽量 918.5→457.0 ms、高品質 1094.5→507.0 ms。**別 run の絶対 ms を直接比較しない。**
- 景観入りは WebKit 1280 で約 3.22–3.25→4.17–4.20 秒。追加モデル読込を含む操作で、ページ起動時間ではない。品質切替も約 361–413→827–858 ms と増加し、P3 として残す。
- 追加 GLB は従来の景観 3 モデル合計に対し約 1.69%。広画面の最終描画は 503,836→470,898 三角形、draw call は 31→38。総 GPU 仕事量や持続 FPS の値ではない。

[独立性能集計](../evidence/phase3c/independent/performance/post-fix-47b8-REPORT.md)は固定順の v2 計測。ページ初期表示と景観入りの時間を分け、試行の前後順を交互にした v3 計測を追加する。3 試行では先行順が 2 対 1 であり、完全相殺ではない。最終 CI の原票と PR 本文で結果を区別する。

## G. 子エージェント独立レビュー

1. **史料・地理:** 支持範囲 PASS、歴史的精度 PARTIAL。66 ファイルの不変と 47b8a80 への適用を独立確認。
2. **3D・実装:** GLB 生座標、接続、視線、旧断面、native 再読込・再 export、共有属性、419 メッシュを別経路で確認。入力応答 P2 の閉鎖を支持。読込/品質コストは P3。
3. **ブラウザ・視覚:** 正常 22 件、128 地点比較の再計算と故障 2 件、実画像から黒化 P2 を閉鎖。この範囲の推奨 YES。

各報告には対象 HEAD/tree/hash と検査範囲を記録。実装担当の自己検査を独立 PASS と読み替えない。最終 commit が証拠・検査だけを変える場合も、製品差分と検査変更の適用性を再確認する。

## H. P1/P2/P3、UNKNOWN、NOT_TESTED

- 新規 P1 は未検出。黒化 P2 は修正・独立閉鎖。入力応答 P2 は実測改善を確認し閉鎖を支持、描画 3→1 回の因果実測は現在 CI 待ち。
- P3: 均質な色面と面割り、390 px 見張台の構図、景観入り・品質切替の追加時間。写実性や実スマートフォンの快適さを保証しない。
- UNKNOWN: 歴史的な正確な位置・寸法・年代・上部構造・橋形式。通行可能性や防御効果を研究確定値または戦闘 simulation 用データにしない。
- 土橋最大勾配は約 0.498 m/m（約 26.5°）。2x 見張台視線の最小余裕は約 0.0954 m。モデル上の限定結果で、歩行安全・アクセシビリティ・現地対応の保証ではない。
- NOT_TESTED: 実機 Safari、実端末の物理タッチ、VoiceOver、現地照合、持続 FPS、GPU メモリ、実ネットワークでの体感。Linux 自動 WebKit を実機 Safari と呼ばない。

## I. HEAD、CI、Issue、Draft PR

- 基準 main: ed22133f766aa1a2256dcebbb0413ec11d479106（PR #12 マージ済み）。
- 証拠固定候補 HEAD: 47b8a80d2f7f08a50a0e0cfe9b4d89d7b2d07700。
- tree: 5e44d4b1a310a45c9de1176939c6c60fb16b76d1。
- CI checkout は PR synthetic merge c239f2b36f9aa119b7c4eaf156bf47d7aa16a2e7。候補と tree が完全一致することを Git オブジェクトで確認。
- [城内観察・外観・性能・独立検査](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881096)、[既存回帰](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881170)、[西側施設・A/D 分離](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881174)。第3期Cの成功3ジョブは原票取得済み。残る描画診断はブラウザ導入で長時間待機し、次候補の同時実行制御により自動中止される。未完了の診断をPASSと扱わず、導入15分上限・pipefail・ログ保存を追加して取り直す。既存回帰の一部も完了待ち。
- [Pages build](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42152881185) 成功、deploy は skipped。
- [Issue #13](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/issues/13)、branch feat/phase3c-inner-observation、[Draft PR #14](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/14)。最終提出 HEAD と CI は PR 本文へ追記する。

## J. 今回の変更範囲に限定したマージ推奨

**NO（残る CI・描画因果診断の完了前）。** Draft を維持し、Draft 解除、merge、auto-merge、本番 deploy、既存 Issue の閉鎖は行わない。

途中段階の報告は [履歴](../evidence/phase3c/history/results-before-final-review.md)に保持。過去の pending や P2 はその時点の記録であり、本書の更新後判定と混同しない。
