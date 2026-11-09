# 工程A 独立最終レビュー

対象HEAD `ee3c3def2565b088c978694469ed86d10d92c75c`、tree `93bd613ba8fb9614ed713d8dca661647208d286a`。依存PR26は未マージの `e67f1fc81c38986ccf8170d1942a1894992c0f3a`。

**計測基盤として、調査・比較用途への限定採用は可。負荷ゼロ・性能同等性・高速化のPASSは付けない。** 同じobserverと固定条件で比較し、観測あり/なしを混ぜず、既定経路の追加負荷を開示することを条件とする。mainへの統合は依存PR26の景観判断と別承認が必要で、このレビューはマージや本番公開を実行・許可するものではない。工程Bの最適化採否とは別判断。

## 記録の妥当性

GitHubから別checkoutへ原証拠を直接取得。local36、旧HEADのCI36、最終HEADのCI36を別実験として検証した。HEAD/tree、全source/asset/runner/analyzer hash、固定計画・順序、配信build、完全な原票、PNG hashを照合。独自Pythonの統計・固定seed paired bootstrap・境界イベント走査によるunion計算が全summaryと一致。

初期独立レビューで検出した自己比較、variant/profile混同、欠落entries/counters、未知stageによる偽100%分類率は修正済み。同じ反例のRED→GREENをリモート固定codeで確認し、実原票に加えた18種類の故障は各集合ですべて拒否した。明示start/end、ms整合、overflow/drop、必要資産記録、失敗・不完全runの拒否を確認した。実原票では6資産すべてのfetch/parse/geometry記録が揃い、render記録数もsubmission counterと一致する。

Aにはshrub-support cacheを含めず、sourceの追加は観測wrapper、正確な時刻境界、geometry/material区分と診断runner修正。最適化はBに隔離されている。

## 計測負荷の評価

中央値ms。Iにも旧粗loggerがあり、完全無観測との差ではない。ADはAの詳細observer有効。

|実験・条件|I|A通常|A詳細|
|---|---:|---:|---:|
|local cold|5033.35|4542.90|4061.90|
|local reload|4256.60|4473.65|4414.30|
|旧CI cold|5070.90|5023.65|5023.05|
|旧CI reload|4371.80|4722.15|4389.75|
|最終CI cold|4445.90|4424.50|4433.50|
|最終CI reload|4204.25|4460.85|3903.25|

A通常のreload中央値はlocal +5.10%、旧CI +8.01%、最終CI +6.10%。この不利な値も残す。最終CIの同block対差平均は+24.08ms、記述的95%区間[-282.35,+330.13]ms。小標本n6と共有ホストの変動が大きく、非有意を同等性や「無視できる負荷」の証明にはしない。詳細observerが短く見える条件を高速化成果とも扱わない。

詳細のwall区間分類率はlocal96.2614〜98.3421%、旧CI98.1002〜99.0929%、最終CI97.7078〜98.9832%。inclusive値の重複をunionで除き、stageを加算しない。fetch/parseは非同期wall、renderはCPU側送出、2RAFは表示機会proxy。GPU内部原因・残差はUNKNOWN/NOT_TESTED。旧Hの71.9979705%はCPUサンプル分母であり、施設wallの割合ではない。

## 回帰と保全

独立378単体試験とbuild PASS。再buildしたI/AのJSは原票の実配信hashと一致。既存public/production/evidence1577件は同一blob。

最終HEADの正式16条件はrun42599971927、artifact13666517138、原ZIP SHA256 `7a9f2863c98b57a266198fcb84054154f888acef41af12d15209d1fc0fc078d7`。GitHub API digestと照合し、19source hash/32PNG hash、64固定断面、128案内支持点、160歩行サンプルを原GLB三角形oracleで再検算した。desktop Chromium/mobile WebKit代表画像を目視。A/C/D、支持座標、2倍誇張と1.7m視点、停止動作・品質変更の回帰を確認した。計測用のcontrols-only PNGは地形視覚検証に数えていない。

投稿直前に最終HEADの9 workflows全件SUCCESSをGitHubから再取得して確認した。Pagesはbuild job129101725882のみ成功、deploy job129105491774はskipped。原ZIPを直接監査したprimary evidenceと、補助workflowの成功状態は区別し、補助workflow全原票まで監査済みとは主張しない。実機Safari、物理入力、GPU内部時間、一般的な本番負荷への外挿はNOT_TESTED。調べた変更範囲で未解決P1/P2は確認していない。Draft維持、マージ・本番公開なし。

原ZIP：local `3cc605c13155f44659dfdd0116c2bb000f13ba057db94315b2e1681d2a9e0999`、旧CI `73dc74b0867da7fc5b5ea61738a36c0e67abd5a552f1d8039a5b146980102c5a`、最終CI `08a52c0281deb60990e835a7362bf658011d870ca363fca4c1de583a9425fa52`。旧/新CIの一方を選別せず、両方を再確認・保全した。
