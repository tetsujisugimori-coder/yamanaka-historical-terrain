# Stage 3-B2 判定記録

## 対象版と訂正
基準main 6d580aeb61a3b6b8f2d64b3c8f1ab45272c7b087、提出済み実装HEAD afa83d76f281f794157cce102d1398ba87d08ee4 / tree 740e7c6b07130bd70ae4e4df577e400b75223a28。
追加レビュー5907947051のP3に対応し、提出前の状態を以下へ同期する。この文書更新後のHEAD・tree・CIはPR最終報告に別記し、実装HEADの成功を新HEADの結果に読み替えない。

## 局所結果と歴史的位置
総合PARTIAL。西ノ丸 nishinomaru・西櫓 nishi-yagura とも未配置、geometry=null、独立対応点0、歴史的位置の確証UNKNOWN。変換NOT_TESTED、fit/check残差null。元西櫓と残る9区域は今回対象外。製品コード・地形・22模型・212原本を変更しない。

最終原票 unit-final.tap を再確認し、既存を含む単体423件PASS。専用 gate-tests-artifacts.tap は24件（正常2・故障22）PASS。旧「412件・正常1/故障12」は初期段階の結果であり、現行件数ではない。初期原票は保存し、書換えない。
build PASS、保護212原本PASS、生成検査22模型/11区域PASS。実QGIS3.40.6の既存8レイヤー読取・CRS・参照有効と原本不変確認。これは歴史位置合わせの実施ではない。
製品変更なしのため局所ブラウザ再実行は省略し、既存正式CIの結果とは別管理。実機Safari/VoiceOver/物理touchはNOT_TESTED。

## 独立レビュー
レビュー5907684615で、全来歴削除、baseline、標高契約、軸の不正を初版が誤受理するP2反例を確認。旧RED原票を保持し同一4反例を修正後拒否。GIS/模型差異台帳の相互整合6故障対照も拒否。未確認資料発行年はnullへ訂正。
追加レビュー5907947051は24試験を再実行し全成功、423件は原票/CIログ照合。新規P1/P2なし、P3は報告の古い状態。歴史的位置確証や原PDF/QGISの再実行は同レビュー範囲外。
これらのレビュー成功と、今後の最終HEAD CI・artifact監査を同一視しない。

## 正式CIの版別管理
実装HEAD afa83d76 の専用B2 run43650862757 はSUCCESS。PR仮merge2568b7183ac1edf2da032f5132577b076f3ca62dの実checkout treeは740e7c6で実装tree一致。
2026-11-15の今回着手時点では全11 workflow中9成功、2実行中（43650862702内部観察、43650862774西側防御）。成功したrunには43650862727基本回帰、43650862744 CAD、43650862717限定本番受入も含む。全体を先取りPASSにしない。
Pages PR build成功と公開は異なる。Configure/Upload/deployはskippedで公開なし。原ZIP中の過去HEAD票と今回run票を分離し、旧結果を流用しない。
文書更新後のCI結果、run/job、実checkout、原artifactの監査・保全はPR #46への追補を正とする。待機だけを理由に再実行しない。

## 保存済み証拠と未完了
保存済み2原ZIPはLibrary保存後の実再取得を別担当が全byte・size・SHA256・全CRC・manifest照合済み。
- local-original:128786 bytes、SHA256 cf608891395e740dd88d9036cb95e0de32a6553add345cb8a4293906c06749b6。51項目/manifest50。
- B2 CI artifact14136420571 / run43650862757:10080 bytes、API digest/SHA256 8743d39ed93a9ec376b7bb4933191abf5eafed5940117a78971d33cb3aab8931。11項目/台帳10。
以後の重要ZIPは取得・整合確認・保存・保存後再取得・独立照合を別々に記録し、未完了を保全PASSとしない。本人限定アクセス範囲/保持期限UNKNOWN、Windows移管NOT_TESTED。原図/第三者PDFは転載せず出典とhashを保持。

## 提出と停止条件
通常Git push dry-run認証不足の初回記録を保持。その後、認証済みGitHub connectorのtree/commit/非force refで履歴を維持して提出し実Git読戻しを確認済み。権限回避・資格情報抽出なし。
現時点の限定マージ推奨NO。最終HEAD CI・重要artifact保全・独立審査の完了後に調査台帳の限定採用を再評価する。2区域の位置確定やStage3-B全体の受入ではない。
Stage3-B全体HOLD、Draft維持、マージ・公開なし。
