# 工程Aの計測結果と再検証入口

計測コード b55431aa8a8407e9ddcf59e24b7fe8f11d6b0e1e / tree ad61595d4017b3fb9c793d28fe59bbe4aab7b1de。各環境でI・A通常・A詳細×6 block×cold/partial reload＝36試行。除外0、全36記録のstrict contract検査成功。旧Iにも粗計測があり、完全無計測比較ではない。

|環境|cache|I中央値ms|A通常ms|A詳細ms|
|---|---|---:|---:|---:|
|local|cold|5033.35|4542.90|4061.90|
|local|reload-partial|4256.60|4473.65|4414.30|
|CI|cold|5070.90|5023.65|5023.05|
|CI|reload-partial|4371.80|4722.15|4389.75|

差の符号は環境/条件で変わる。局所環境は共有ホストで特に変動が大きい。通常経路のCI再読込中央値は+8.01%だった一方、対差の記述的95%bootstrapは0をまたぐ。これは差がないという同等性保証ではなく、無視できる負荷や高速化を主張しない。詳細観測のrawも通常性能比較へ混ぜない。採用可否は計測妥当性、回帰、制約の明示、独立レビューで別判断する。

## 原証拠
- ローカル原ZIP: [local-overhead-b55431a.zip](../../evidence/phase3j-followup/local-overhead-b55431a.zip)、SHA256 3cc605c13155f44659dfdd0116c2bb000f13ba057db94315b2e1681d2a9e0999。13メンバー、raw・外部identity・config・全値のsummary・6PNG・378単体試験出力・hash台帳。新35契約試験を含む。
- [公式CI36試行](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42597854436)、artifact13665501009、ZIP SHA256 73dc74b0867da7fc5b5ea61738a36c0e67abd5a552f1d8039a5b146980102c5a。CI原ZIPはActionsの保持期限があるため記録metadataも同梱。
- 独立原票照合・最終CI・限定採用判定は [Draft PR34](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/34) を参照。実機Safari/GPU内部はNOT_TESTED。

## 再集計
ZIPを別ディレクトリへ展開して `node scripts/phase3j-followup-report.mjs raw.json raw.json.identity.json`。外部identityはsource/build/runner/analyzer/事前計画の固定hashと照合する。自己申告したidentityだけを信頼せず、掲載commitのソースと突合する。既存public/production/evidence1,577ファイルは依存基準e67f1fcから全て同一git blobで保全。

## 修正された検査器の誤受理
旧intervalとmsの不整合、全役割を同一buildとした比較、誤ったprofile、欠測stage/counter、未知stageによる偽100%を新検査器で拒否。実装担当35契約試験に加え、独立16反例で修正後の拒否を確認。元の旧40＋12原票には当該破損はなく、旧-1.55%/+1.71%の算定は保持する。
