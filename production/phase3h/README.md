# 第3期H 編集原本・再生成

## 判定範囲

実行済み: Blender 4.3.2 background CLI、QGIS 3.40.6 Python bindings/offscreen、別プロセスで保存原本の再読込。GUI手操作や実地計測を実行したとは主張しない。

基準: main `3b08613682c794f50d90ef81b8a41170f40f8476` に統合済みの第3期G。Gの `.blend` からコピーしたC地形だけを編集。現況A、旧G/F原本・GLBは上書きしない。

Hも242,203 native頂点・473,792三角形を維持。XYと三角形構成を変えず、連続する限定域のZと接合輪郭を変更した。面数増加だけの改善ではない。全域の丸め込みや新規通路の創作ではない。

## 編集区域（ローカルm、east/north）

- 障子堀肩・堀底接合: E[-66,-40], N[-27,33]。旧G E[-62,-42], N[-23,29]より拡張。
- 土塁裾・地表接合: E[-43,-29], N[-25,31]。旧G E[-41,-31], N[-21,27]より拡張。
- 土橋から既存虎口アプローチの接合: E[-99,-69], N[-43,5]。旧G E[-96,-72], N[-39,-20]より拡張。

境界3mでquintic featherが0へ戻る。障子堀の既存7m軸と防御段差、既存橋幅・虎口構成は保持。肩と裾の変位はnm最大0.109680m、inner最大0.190002m。これは制作上の変更量で、発掘値や史実寸法ではない。新形態は全てC、材質/草/低木Dは `src/nature-finish.js` で分離。

Gの編集枠外にある変更面中心を独立GLB計算で確認: nm14,292面（該当面の投影面積446.625m²）、inner1,249面（624.5m²）。面中心基準の集計であり境界の厳密な面積差や考古学的面積ではない。全変更面はHの指定矩形内に収まる。

## 接地・歩行・断面

木柵初期5柱のE=-22.4/-21.2/-20/-18.8/-17.6,N=0は編集範囲外。G/H支持高は全て575.1500244140625モデルmで同一。絶対標高の追加保証ではない。

橋path1,384面と虎口path1,000面は全て38°以下（最大33.7422°、32.0510°）。これは地形面の傾斜確認で、足半径・障害物・実ブラウザ移動の受入は別工程。全城域の自由な通行を意味せず、不連続な地点間は地点移動のまま。

固定2断面に加えて橋横断/縦断を、実GLB三角形から876点再計算してpublic metadataへ保存。GUIの固定2断面は実GLBから再計算する既存方式を維持。5地点のstationSupportを更新し、他3地点は旧西方地形のまま。

内側面の投影面積3039.9999916m²（期待3040）、辺価数不正0、共有XYの高さ差0。外側の無変更三角形とcoverageはGと一致。元から存在する外周開口は塞がず、内部の新規欠損とは区別。

## ファイル

- `yamanaka-phase3h.blend`: 編集可能な13メッシュのC原本。
- `phase3h-editable.gpkg.gz`: EPSG:6676の編集済62,860面、変更矩形、実断面のGeoPackageを無損失gzipで保存。解凍後の `.gpkg` はGit対象外。
- `gis-package.json`: 圧縮前後のバイト数とSHA-256。原本の形状や格納精度は変更しない。
- `yamanaka-phase3h.qgz`: 上記GeoPackageを参照する編集可能なQGISプロジェクト。
- `phase3h-qgis-map.png`: QGIS offscreen地図書出し。GUIスクリーンショットではない。
- `parameters.json`: C制作パラメータと根拠の限界。
- `changed-triangles.json.gz`: 正確な変更前後頂点（再生成時mtime=0）。
- `public/data/phase3h.glb`, `phase3h-inner.glb`, `phase3h.json`: Web用。
- `*-check.json`, `*-reload.json`, `regeneration-*.json`, `logs/*.txt`: 原検証結果。

## QGIS原本の準備と編集

GitHubへの転送上限に合わせ、14,159,872バイトのGeoPackage原本をgzip（1,417,241バイト）でGit管理する。QGISがgzipを直接開けるとは扱わない。

1. リポジトリルートで `python3 scripts/phase3h-prepare-gis.py` を実行する。
2. 圧縮ファイルと解凍後原本のSHA-256・サイズを `gis-package.json` と照合し、同じフォルダーに `phase3h-editable.gpkg` を復元する。
3. `production/phase3h/yamanaka-phase3h.qgz` をQGISで開く。QGZの参照先は解凍後の同名GeoPackageで、既存の相対参照は変更しない。
4. CLIでの再読込検証は `/usr/bin/python3 scripts/phase3h-verify-gis.py`。準備・ハッシュ確認後、QGZの3層を再読込し62,860面のXYZを照合する。

既存 `.gpkg` が圧縮原本と異なる場合、prepareは上書きせず停止する。編集済み原本を別名へ保全してから復元すること。意図して編集・再生成した原本を登録する場合は `python3 scripts/phase3h-prepare-gis.py --pack` でgzipとマニフェストを更新し、再検証する。packは原本を変更・削除しない。

`python3 scripts/phase3h-test-gis-package.py` は一時ディレクトリで新規解凍の完全一致、同一原本の受入、編集済み原本の非破壊拒否、圧縮破損・原本hash不一致の拒否を検査する。

## 再生成

リポジトリルートで `bash scripts/phase3h-reproduce.sh`。Blender、system Python3+QGIS/GDAL、Python3+NumPyが必要。依存の自動インストールは含まない。

順序: G native読込→H編集→GLB/BLEND保存→独立GLB照合・範囲拡張・木柵支持→辺検査→別Blender原本再読込→QGIS編集原本生成→無損失gzip/原本SHA記録→別QGIS再読込/XYZ照合/地図出力。

2回の全生成に対しGLB2件、公開JSON、変更三角形gzipのSHA256一致を確認。BLEND/QGZ/GeoPackageは内部メタデータ差でbyte同一を保証せず、原本幾何とEPSG・XYZの再読込照合を別途実施する。

## 故障対照・限界

原本/GLB比較は高さ改変、軸交換、1000倍単位、面欠落、空証拠を拒否。範囲拡張/支持検証は拡張0、柱支持+1m、NaNを拒否。正常だけを通す検査とし、故障除外を実機保証とはしない。

史実形態、1590年の位置・寸法、実機Safari/物理入力は未確認。新規LOD、西櫓・西木戸方面への広域新形状は今回未実施。地形の見た目と歩行/性能の最終判定はブラウザ原票・独立レビューと合わせて行う。
