# 第3期Bの編集用制作元

西櫓の曲輪・土塁・板塀（`wb-bailey`）、西木戸口（`wb-gate`）、西櫓堀（`wb-moat`）、交換可能な建物候補（`wb-building`）。全形状はC推定。色むら・侵食模様・木材経年はD相当の外観演出で、遺構の根拠ではない。

西櫓は曲輪名であり、掘立柱建物跡1棟という資料記述から今回の一層・切妻屋根の外観が決まるわけではない。木戸は既存西ノ丸の`sc-gate`とは別ID。西櫓堀の模型は一本の溝を横断する畝で、既存西ノ丸の二列交互の障子堀と分けた。平面配置は測量図への対応点を登録していない制作上の候補であり、位置精度はUNKNOWN。

`recipe.json`の`referenceDimensions`は市の参考値、`modelDimensions`は実際に採用した候補寸法である。参考値をその場所の実測値として扱わない。表面の材質は独自制作で、第三者の写真・報告書図面・テクスチャ・モデルを転載していない。

## ファイルと保全

- `../yamanaka-phase3b.blend`：既存`yamanaka-1590.blend`を実読込し、旧281メッシュの頂点・面・world変換hashを保持。追加412メッシュを別コレクションに保存。柱、板、梁、屋根を独立編集できる。
- `../yamanaka-phase3b.qgz`：既存1590プロジェクトの12レイヤーを保持。追加候補高ラスタ、施設、観察点、地形パッチ範囲の4レイヤーを含む。
- `surface-candidate-1m.tif`：Blender表面格子節点の高さ。1m、EPSG:6676、C候補。測量DEMではない。画素中心が格子節点で、画素外周は幾何パッチ境界から0.5m外側。
- `elements.geojson` / `stations.geojson` / `footprint.geojson`：EPSG:6676の編集候補。施設名・ID・C分類・模型高・UNKNOWNを保持。
- `../../public/data/phase3b.glb`：追加物だけ。45,432三角形、4,540,236 bytes。表面3メッシュは1m格子の27,500三角形、同じ頂点を共有する三角形集合を施設IDで分割している。建物と門・塀は別部品。
- `../../public/data/phase3b.json`：名称、説明、資料ID、仮定、未確認事項、寸法、観察点、模型範囲。レシピと同じ台帳。

元A・既存C・固定断面・旧GLB・旧編集元は書き換えない。追加パッチ範囲はローカルE/N `[-205,-55,-80,55]`m。5m元格子に整列した矩形境界で、境界節点は城域Aのfloat32実三角形高さへ接続する。Web側の派生表示用contextの開口は元GLBを変更せず作る。

Blender軸は東・北・上、GLBは東・上・南。原点は既存のE44862.121277226666 N-93478.07235405142、1unit=1m。模型の基準高であり、1590年の絶対標高の証明ではない。

## 再生成

Python 3.14.7、Blender 4.5.9 LTS、QGIS 3.44.10と付属Pythonを実使用した。既存ポータブルBlenderを利用し、新規ソフトを導入していない。

```powershell
python scripts/phase3b-recipe.py
$env:BLENDER_EXE = '<existing Blender 4.5.9>/blender.exe'
$env:QGIS_PYTHON_BAT = '<existing QGIS 3.44.10>/bin/python-qgis-ltr.bat'
node scripts/phase3b-native.mjs blender
node scripts/phase3b-native.mjs blender-check
node scripts/phase3b-native.mjs gis
```

最初のBlenderコマンドは既存1590正本から別名出力する。2番目は別プロセスで新正本を開き旧形状保全、全C、単位1m、外部画像0を検証する。QGISは別名保存後に再読込して全層の有効性、EPSG:6676、既存参照の保持を確認する。実プロセス終了0とworker完了票の両方を満たしたときだけPASS。

レシピから再生成すると追加正本を上書きする。GUI編集を続ける場合は変更をレシピへ反映するか、別版のblend/qgz/GLBを保存し台帳の版を更新する。今回のnative検証はbackground APIであり、GUIでの手動編集はNOT_TESTED。

`evidence/phase3b/native/`は制作担当の自己検証票。独立レビューではない。sandbox内Blender起動の終了3221225506、QGIS zip保存失敗は元票を保持した。既存アプリの同じ処理を承認済みの外側プロセスで実行すると終了0で完了したが、旧来のQGISクラッシュ原因を解明したという意味ではない。

資料IDだけを`mishima-western`へ精密化した後も幾何は同一。初回build票に記録されたレシピhashはその初回時点のものであり、後続の台帳メタデータ変更と区別する。
