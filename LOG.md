# Work log

## 2026-11-04 — Issue #7 固定断面

- GitHub current main 5f54eac / PR #6 mergedと祖先関係を確認、新規clean clone・専用branch、Issue #7。
- A/Cの表示三角形面に一致する固定2断面、SVG graph・3D線/端点/代表点、実寸寸法と根拠/仮定、tap/keyboard/text代替を追加。
- 保存済み断面222標本の工程/座標/版を照合し、今回は実GLB面との交線を使用。元モデル/制作正本/過去証拠を保全。
- 保留C要求が誇張変更で取り消される既存問題を両engineの4反例で再現し、視点と表示要求の失効を分離。修正後同4反例PASS。
- 自己検証・CI・別担当の独立レビュー結果は docs/fixed-sections.md と evidence/sections/、Draft PRへ記録する。未実機/未知精度の留保、Issue #1/#4/#5を維持。merge/deployなし。

- 提出自己検証：unit26、通常62、C保留4、新断面subpath8、既存回帰248がPASS。高さ16/座標16/二重誇張8を拒否し1倍8を受理、集約6正負対照PASS。元main156ファイルbyte保全。独立レビューと最終CIはPRで別記。

## 独立指摘への対応

- 提出7e79e63の独立レビューは幾何/既存回帰PASSだが、取消後の断面同期漏れとC対応点の定義不足をP2として報告。自己検証PASSを独立承認へ読み替えない。
- P2-01は未修正4 FAIL→局所修正4 PASS、復帰除去4期待FAIL。現在表示のready/controls/section同期を一元化し、旧応答・視点を採用しない。P2-02は未修正4 FAIL→常時定義/C点名/A同位置間比高を追加し12 PASS、座標・実寸値は旧提出と一致。
- 新規自己検証票と元レビューのコピーはevidence/sections-review-fixes/へ保存。全回帰・CI・同担当の独立再確認は新HEADに対して別記する。
