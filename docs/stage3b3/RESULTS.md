# Stage 3-B3 結果と再開条件

## マージ後の確定状態（2026-11-15 20:04 JST確認・P3追補）

- **PR #48は2026-11-15 19:10 JSTにマージ済み**。対象の提出HEAD `19844064df889d733951f91add8f3bdfce70e7e7`、merge commit `f6aae9afecad1d7fd55072a9efe5841583c6eb57`。本節を現状の正本とし、以下の提出当時のPENDING/NO/「マージしていない」は履歴として保存する。
- **対象HEADの正式CIはPR12+push4=16 workflowが最終的にcompleted/success**。15件はattempt1成功、内側観察はattempt1の`diagnose-render-cost`がWebKit `route.fetch` 中の`ECONNRESET`で失敗し、同一HEADの該当jobを一度再実行したattempt2で成功。初回失敗票は保持し、根本原因はUNKNOWN。最新36 checksは35 success・Pages deploy 1 skipped。build成功をPages公開実施とはしない。
- **正式原ZIP33本（初回32本＋再実行1本、合計1,071,790,701 bytes）**の正規取得・保存後実再取得・全バイト/SHA-256/CRC・適用可能manifest照合PASSは[PR最終報告](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/48#issuecomment-6892728993)の担当者記録による。本P3文書追補では33本の保存先実物を再監査しておらず、第三者監査の新規実施とも扱わない。全入力の完全保全、画像の意味内容、実効ACL・保持期限、Windows追加移管は立証していない。
- **採用範囲は資料不足と不採用点を管理する台帳・検査器のみ**。西ノ丸・西櫓の2区域は未配置、候補4件不採用、fit/check各0、`geometry=null`、実変換`NOT_TESTED`、残差`null`、歴史的位置`UNKNOWN`。測量原図・座標簿未取得、同一点・変換精度の確証なし。**総合PARTIAL、Stage 3-B全体HOLD**を継続する。
- 本追補は**マージ後の文書修正**であり、PR #48の検証済みHEADと別版。追補commit自身のCI・原証拠監査は結果が確定するまでPENDINGとし、以前のworkflow成功を流用しない。製品・地理データ・原本・検査契約の追加変更はしない。

---


## 提出版の最終確認追補（2026-11-15 18:03 JST）

対象HEAD `e770141ff8c479b9f962890d3b9b6c97f2391137` / tree `58b06b597ad3d455e7d7b1f4113831e12ecec991`。提出後のPR12+push4、16 workflowはすべて成功。Pagesのdeployはskip。正式原ZIP32本（既存専用2本＋今回補完30本）と局所bundle1本について、保存後の実再取得・サイズ・SHA-256・CRC・適用可能な内部manifestを照合済み。追加30本は取得元原ZIPとの全バイト比較も実施した。版別run/artifact/digest・検証範囲・容量・留保は[CI-EVIDENCE.md](CI-EVIDENCE.md)。

本レビュアーの変更11ファイル確認・専用69再実行はPASS、新規blocking P1/P2なし。全492成功は保存原票確認。原レビュー記録は[PR #48 レビュー](../reviews/pr-48-20261115-180330-JST.md)。測量原図・座標簿は未取得、採用fit/check0、2区域未配置、geometry=null、変換NOT_TESTED、残差null、歴史的位置UNKNOWN、総合PARTIAL・Stage3-B HOLDを維持する。

この追補とレビュー記録を追加する後続文書commitは別HEADである。後続HEADのCI・原証拠保全は提出後のPR報告で確認するため、ここでは旧HEAD成功を流用しない。現時点の限定マージ推奨NOは維持し、マージ・Draft解除・公開は実施しない。以下は提出時点の履歴として保持し、当時のPENDINGを現在の実装版の未完了と取り違えない。

---


2026-11-15 JST。対象: 西ノ丸/nishinomaru・西櫓/nishi-yagura。Issue #47。

## 対象版

基準 main `7ef4bd6a77ea0447ee0862af5b3677ac34389367`、tree `1759a757bc79e918db388eea8cfdfab048c1d27d`。PR #42/#46は開始時にmergedを確認。今回の提出HEAD/tree、CI実checkoutはPR報告と原票のidentityに記録する。文書後続commitは試験版と区別する。

## 分離した判定

|項目|判定と範囲|
|---|---|
|資料の所在|PARTIAL。1972用地測量調査と全域図作製、2012年度18,700m²現況測量・設計の公式記録は確認。原成果の正式名称・所蔵部署・座標簿の存在・個別利用条件はUNKNOWN|
|実物閲覧|公開計画書の既存保存PDF4頁と公式Web本文、報告書の目録。測量原図/座標簿/納品成果はNOT_OBTAINED|
|候補検証|B2候補4件を理由付きREJECTEDとして保持。採用点0、独立検査点0。候補0を位置検証PASSにしない|
|実資料変換|NOT_TESTED。各区域8不足条件。geometry=null、残差null、歴史的位置UNKNOWN|
|台帳・検査器|局所専用69件・全単体492件成功。合成反例と実資料の記録整合を分離。検査器は人間による同一点認定を代行しない|
|正式CI|提出後確認PENDING。旧HEADのCIを転用しない|
|独立レビュー|別担当の結果はINDEPENDENT-REVIEW.md。指摘原票・修正前後を別保存|
|証拠保全|局所原票を保持。永続保存後の実取得・独立照合と正式原ZIPは提出後確認PENDING|
|限定マージ推奨|現時点NO。正式CIと保全が未完。成果は調査台帳/検査契約のみ|
|全体|PARTIAL。Stage 3-B HOLD、A現況/B根拠ある復元/C推定/D演出の区別を維持|

## 局所検証

最終変更前の基準は単体423件/build成功。B3の初回局所確認は専用63件、全体486件成功。独立レビューの出典参照P2修正と追加試験後は専用69件・全単体492件成功。実行前に軽量source実体とhashを固定し、初回原票は上書きせず保持した。

- B2検査器回帰成功。保護台帳212原本は全hash一致。
- 基準のproduction/public/src/data/research/stage3b・stage3b2に属するtracked245ファイルのサイズ・SHA-256一致、Git差分なし。既存22模型を変更していない。
- build成功。従来の500kB超chunk警告は保持。製品コード/画面を変更していないため新規ブラウザ試行なし。必要な既存正式CIは別確認。
- QGIS 3.40.6のheadless実読取:既存projectの8 layer有効、EPSG:6676、未配置2区域nullを確認。QGIS3.44.10保存projectの版差とfontcache/AF_NETLINK警告あり。新規座標取得・実資料変換・GUI検証はNOT_TESTED。
- EPSG:6676のアプリ側E,N（m）、Web x=E-E0/y=H/z=-(N-N0)を現行入力と照合。測量X北/Y東とアプリ軸を区別。旧図のCRS、観測epoch、個別標高改定はUNKNOWN。

## 再開に必要な最小事項

1. 所蔵部署による原成果の特定:正式名称/資料番号/作成主体/図面と座標簿の有無/閲覧・複写・二次利用条件。
2. 1972または2012原図と現在基準点の同一点根拠、改修履歴、不動性、座標系・単位・読取不確かさ。
3. 条件事前固定後、独立した非共線fit点3以上と別check点2以上、分布・歪み・誤差計画。点数だけでは開始しない。
4. 同じ資料由来の写図を独立証拠と重複計上しない。選択法の詳細はPLAN.md。

問い合わせ先候補・確認事項案はRESEARCH.md。外部連絡・申請は行っていない。許諾や資料取得が必要な別工程へ自動着手しない。原図・報告画像の再配布、模型追加、区域配置、公開、マージは行わない。
