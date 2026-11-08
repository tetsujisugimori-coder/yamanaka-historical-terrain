# 第3期I：小区間の地形・景観制作

## 範囲と根拠

基準は統合済み H main `42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8`、tree `38d033ca9c00e996ac82403de23121d901ca59b4`。旧原本と旧GLBは上書きしない。

新しい推定Cは、既存内郭メッシュの西側アプローチの小区間 E=-99〜-87m、N=2〜23m。Hの編集上端N=5mを越えて連続する既存地表を、最大約0.075mの低い凸形で整える。これは西木戸口施設そのものを新規測量・復元したものではない。西木戸口へ向かう展示改善のうち今回可能な内側の小区間であり、両施設を接続する歴史的経路の確証はUNKNOWN。西木戸口本体側の追加幾何は次期候補として残す。

実変更は `ic-bridge.surface.grass` の180頂点、418三角形。XY・トポロジー・覆域は変更せず、境界では変位ゼロ。三角形数を増やすLOD/細分化ではなく、既存の細かい実メッシュ上の形状修正。nm主地形は全三角形同一。パラメータに残るmoat/rampart範囲2件は旧Hの比較・保全範囲であり、Iの新規変更範囲ではない。

試作値は史料の実測値ではない。A現況、旧H、木柵5柱位置・寸法を保全。支持高と固定断面はI GLBそのものから再計算する。歴史資料の参照は文脈であり、今回の0.075mの証拠ではない。

## 景観D

`src/nature-finish.js` はプロジェクト独自の決定的な手続き表現。赤土、草、乾草、限定的な踏み跡色、近距離の小さな色のばらつきを加える。草面をbridgeという施設名だけで通路色へ変換せず、`.surface.path`と草/土面を区別する。低木は既存6地点・本数を維持し、個体の高さ・幅・色を変える。樹種・分布・1590年の植生を確認済みとはしない。

新規画像・第三者テクスチャ・外部通信はなく、MITの独自レシピ。Dは既存のapply/restore契約に従い、A/Cへの切替時は元のmaterial/colorを厳密に復元する。地形position/indexや歩行判定は変えない。軽量品質では既存同様低木を省略する。

CSS色を毎頂点で解釈しないよう4色を一度だけ作り、頂点ループではColorを再利用する。変化は色であり、実測した光学材質・植生密度ではない。新しい草ポリゴンは追加せず、低木も既存と同数のインスタンスで描画する。

## 原本と再生成

- `production/phase3i/yamanaka-phase3i.blend`：編集可能C原本、east/north/up、m。
- `public/data/phase3i.glb` と `phase3i-inner.glb`：east/up/south、m。
- `production/phase3i/yamanaka-phase3i.qgz`：EPSG:6676。
- `production/phase3i/phase3i-editable.gpkg.gz`：可逆圧縮された編集可能な原GeoPackage。利用前に `python3 scripts/phase3i-prepare-gis.py` で同じディレクトリへ展開する。qgzは相対参照。
- `parameters.json`、`changed-triangles.json.gz`：C仮定・変更三角形の旧新座標。
- `public/data/phase3i.json`：実GLBから独立計算した断面876点・5地点の支持高。他の3地点は既存western資産に従う。

再生成はリポジトリルートで `bash scripts/phase3i-reproduce.sh`。Blender 4.3.2、QGIS 3.40.6、Python/numpy/GDALを用いた実ヘッドレス実行。既存H native masterを読み、Iにのみ保存。Blender再読込はnative三角形とGLB全座標を照合し、高さ・軸・単位・欠落・空データの5故障対照を拒否する。QGISは実保存後の別プロセスでqgzとGeoPackageを再読込し、418図形の全座標を元の変更記録と照合する。

`production/phase3i/*-check.json`、`blender-build.json`、`blender-reload.json`、`gis-build.json`、`gis-reload.json` とlogsを参照。QGISのmap PNGはnative出力でありGUI操作スクリーンショットではない。GUI実操作、実機iPhone、現地・史実形態の照合はNOT_TESTED/UNKNOWN。制作担当の検証を独立担当レビューと混同しない。

## 保全と制約

生成器は旧GLB・旧原本のhashを前後照合する。旧Hの固定4断面にIとの差は0。新しい小区間の幾何は別テストでHとの差と境界ゼロを確認する。A/H証拠は不変。

この原本を再生成しても、Webの性能や視覚品質が自動的にPASSになるわけではない。ブラウザ画像、新旧同条件性能、独立レビューは別証拠で判定する。D景観の詳細はソフトウェアの表現であり考古学的確証ではない。
