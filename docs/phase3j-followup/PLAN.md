# 第3期J後続 A/B 計測前計画

記録日 2026-11-09。A Issue #32、B Issue #33。旧PR31は保全。

## 固定基準と依存
main 42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8。
未統合PR26 e67f1fc81c38986ccf8170d1942a1894992c0f3aがAのbase。Aは景観差分を再制作せず、その上に計測のみを追加する。Aをmainへ直接採用するにはPR26の別判断が必要。BはAをbaseとし、低木支持点キャッシュだけを追加する。PR31の最適化をAへ混入しない。

## 事前固定
- Chromium、1280×900、DPR1、通常motion、同じモデル/同じホスト、SwiftShader。GPU内部時間は未測定。
- Aの増分負荷：旧I・A通常・A詳細の3条件、6ブロック、順序を循環/逆転。各fresh context cold→同context partial reload、計36試行。Iにも既存の粗計測があるため完全無計測との差ではない。
- B：A-pre/B/A-postを8ブロック、各cold/partial reload。計48試行。中心Bと前後Aの平均の対差、中央値、全値、min/max、IQR、記述的bootstrap区間を保存。詳細計測は別3ブロック18試行。
- 外れ値を除外しない。失敗を原票に残し、不完全な集合で集計成功にしない。技術的runner修正後は別experiment IDで全試行を新規収集し旧原票を保持。
- Bは冷間/reload双方で全体wallの改善が再現し、95%記述的paired bootstrap上端が0未満、中央値の改善が5%以上、独立環境でも同じ結論の場合のみ採用候補。それ以外は保留/不採用。小標本のbootstrapは厳密な母集団保証ではない。
- Aの採用は高速化を要しない。増分負荷と変動を明示し、既定/詳細を区別。正しい記録、欠測拒否、再集計、回帰、独立レビューで判断する。

## 境界
facility wallはregional ready後のlandscape→inner→walk開始/終了→2RAFを含む旧Jと同じ操作task。初期ページreadyは別値。2RAFは表示機会proxyでGPU完了ではない。GLB fetch/parse/geometryMaterials、詳細geometry/material、地表索引walkIndex、shrubSupport、rendererSubmissionを区別。未分離のshrubGeometryMaterialsや外部decoder内部は混合/UNKNOWNとして保持。複数spanのinclusive合計を全体時間にしない。説明率は和集合、原因解明率ではない。

旧72%はCPU profileの(program)サンプル比であり、施設全待ち時間の72%ではない。

計測負荷はcharacterizationとして扱い、n6で「差が有意でない」ことを負荷ゼロ/同等性保証に読み替えない。A通常/I差は既存粗観測に対する増分、A詳細/A通常差は詳細observer干渉。両方とも全値と範囲を報告し、計測用途の制約として明記する。新observerは49efと同一byteではなく明示start/endを追加した別版である。
