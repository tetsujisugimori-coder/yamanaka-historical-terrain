# Stage 3-B6 結果（提出準備時点）
2026-11-16 JST。総合PARTIAL・限定受入PENDING・限定マージNO。

基準main148317e52a7dc5efba8aa519538a476dfead18c5/tree55223ca4be5db9f7e0de56b0b795ec964744f82c。PR53 merged、Issue52 closedを実読。未マージ49（文書P3）/40/35/34/31/26に依存なし。GitHub接続本人アカウントを確認。Issue54・専用branch。

## 実装
歴史ガイド、正本adapter/検証器、既存overviewへの逆導線とfocus、狭幅CSS。正本に新関連を作らず既存1件（nishinomaru/nm-bailey、software-audit-association）を継承。10区域は登録関連模型なし、他21模型は関連区域未確証。11区域の要約・推論・A/C/UNKNOWNを別表示。権利不明の資料原文/画像は追加しない。全11未配置、候補0、実polygon/実資料変換NOT_TESTED、Stage3B HOLD。

## 局所検証と旧失敗
- 初回全647 Node中646PASS/1FAIL：既存controller隔離fixtureに新guide依存未登録。最小stubを足し期待値を変更せず同ケース成功。現在648 Node全PASS（B6契約25含む）。
- 初回B6契約24中23PASS/1診断文言不一致、relationTypeを個別理由で拒否する修正で同反例PASS。拒否の有無でなく意図理由を照合。
- build成功。保護230path/原本212/模型22集合・サイズ・SHA・基準Git bytes不変。新追加資源なし、lock変更なし。
- 局所ブラウザ初回は実行バイナリ不在NOT_TESTED。公式Playwright Chromiumを案件専用領域へ取得。次はsandboxソケット制約で起動失敗NOT_TESTED。試験成功へ読み替えない。正式CI/代表画面はまだPENDING。

## 独立レビュー
[レビュー](REVIEW.md)。重複関連、根拠なし確証昇格、模型直接入口の逆導線欠落のP2三件。旧7683cd8と修正版で同じ反例を独立確認。前2件は旧誤受理→新意味的拒否/正常維持。逆導線は実関数隔離22模型で旧0→新1リンク/21未確証、focus要求確認。画像/正式CI/原ZIPは未確認。

## 保存・限界
案件専用領域、初期空き約51GiB/4M inode、入力原本の再生成なし。局所原票は現時点ローカルのみ、Library保存と実再取得はPENDING。ACL/保持期限UNKNOWN、WindowsNOT_TRANSFERRED。正式CIと原ZIPの結論は最終HEADで追補する。実機Safari/VoiceOver/物理touchNOT_TESTED。
