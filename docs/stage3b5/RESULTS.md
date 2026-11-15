# Stage 3-B5 検証状況

2026-11-15 23:23 JST。総合PARTIAL／限定技術受入PENDING／限定マージNO。

## 版と範囲
基準main `4b7a11d271cd6018c41ee8d78619fa69a3b8a391` tree `449d37cedbb08a9cad67945502d6f82ad08365fc`。
実装前契約ローカルcommit `a1543a7`、実装検証HEAD `3208e41850008d139ddb248b85b685c34f58d3db` tree `f58a7ce4a4c3a30512fdd912761bab20b25e2a82`。後続文書commitは別版として記録する。

11区域を個別判定し採用0、全て未配置。表示機能は独立レイヤー、既定OFF、資料記述の継承範囲・不確実性・採否理由を表示する。候補が成立しないため実区域の推定polygon表示はNOT_TESTED。合成fixtureは別ビルドの試験専用で本番バリデータは拒否する。精度UNKNOWN/null、変換NOT_TESTED、残差null。Stage3B HOLD。

## 局所検証
- 基準全Node558 PASS。実装HEAD全Node622 PASS、失敗0、skip0。
- 契約59＋UI5は上記に含む。既存B2/B3/B4、controller/overview回帰維持。
- build、合成harness build、構文・差分検査PASS。
- 保護212原本と22模型全登録、230ファイル集合・サイズ・SHAを開始mainの実blobと照合PASS。別担当が独立Pythonでも照合。
- 本番16・故障6・合成2の局所ブラウザは必要実行ファイル不足によりNOT_TESTED、工程終了1。成功へ読み替えず初回原票を保持。正式CIで別途検証予定。

## 修正履歴
1. 保全器初期集合漏れを修正。失敗script/log/exit保持。
2. 空候補時Group.add空引数によるconsole errorは同入力RED→GREEN。
3. 独立R1: 今回実物閲覧と既存記録継承を区別する表示。同反例RED→GREEN。
4. 独立R2: B4の実在しないtargets locatorをprojects/materialsに訂正。同反例58PASS1FAIL→59PASS。
5. 独立R3: 新規public/partsファイルの保全集合検出漏れを修正。同一新規入力で修正前scope再構成版exit0誤受理→新版exit1意味的拒否、正常exit0。旧実行コードの保存ではなく再構成と明記。branch名依存もtracked契約有無判定へ変更。

独立レビューは別担当、独立12変異＋正常1と既存試験再実行を区別。正式ブラウザ原票・CI・保存後再取得の独立確認は未完了。

## 証拠・残件
局所原票と後作成台帳は別分類。承認済みLibrary保全・実再取得はPENDING。正式CIと原ZIPは未確認。本人限定取得URL/IDは公開資料へ載せない。
実機Safari、VoiceOver、物理touch、OS文字拡大はNOT_TESTED。史実位置の確証・実測位置合わせを実施していない。Draft解除・マージ・Pages公開なし。

## P2-B5-FOCUS follow-up (2026-11-15 JST)
Review 5911291309 is anchored to submitted HEAD 18f7ee5. PR run 43724320094 (merge cd207d0, identical submitted tree) and push run 43724289611 both retain their failures. Each engine passed 8 production cases, stale-response control and synthetic renderer; its 503/invalid recovery cases lost retry-button focus. Four original ZIPs (14166087674, 14165793479, 14165913089, 14165567488) were saved and separately materialized; full bytes, official SHA256, all CRCs and complete manifest membership/size/hash matched. This was verified by the current reviewer using a separate Python audit, not a second-person audit. Private retrieval identifiers are omitted; long-term retention UNKNOWN.

The focused retry button now remains natively enabled during loading and reports aria-disabled=true. Its click handler ignores duplicate activation while loading. No completion-time focus() is added, so moving focus elsewhere while waiting is respected. OFF/dispose still use native disabled. The new regression failed before the fix (native disabled true), then passed; all Node tests 623 PASS, protected 230-path set / 212 originals / 22 model registrations unchanged, production and isolated synthetic builds PASS. Existing four browser counterexamples and their focus expectations are unchanged. Formal new-HEAD CI and its original artifact preservation remain PENDING until a PR comment records them. Stage3B HOLD; 0 adopted / 11 UNPLACED; actual historical polygons NOT_TESTED. Draft, no merge/deploy.
