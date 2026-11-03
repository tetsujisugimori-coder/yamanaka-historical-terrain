# 取得・変換・再現

## 閲覧と通常のWeb開発

Node.js 22.12以上（制作時24.20.0）。生成済み地形とGLBを同梱しているため、閲覧にQGIS・Blenderや外部DEM APIへの接続は不要。

```powershell
npm ci
npm run dev -- --port 4317 --strictPort
# http://127.0.0.1:4317
npm test
npm run build
npm run browser
```

ブラウザ試験は別端末でChrome実機やiPhoneを操作するものではなく、PlaywrightのChromium／WebKitエンジン。対応バイナリが未導入なら `npx playwright install chromium webkit` を実行する。CIはこれを独立したジョブで行う。Windowsの信頼済みCAが必要な環境では `node --use-system-ca` を使い、TLS検証を無効にしない。

## GISの再処理

制作環境：Windows、QGIS 3.44.10、付属GDAL 3.12.4、付属Python 3.12。QGISをインストール済みなら次のバッチで実APIを起動できる。

```powershell
node --use-system-ca scripts/fetch-data.mjs
& 'C:\Program Files\QGIS 3.44.10\bin\python-qgis-ltr.bat' scripts\build-gis.py
```

`fetch-data.mjs` は4並列上限でPNGを取得し、既存キャッシュを保持する。失敗時はエラーで終了し、架空の高さを作らない。再取得時の最新タイルでSHAが変わり得るため、完全一致の再現には記録済みSHAのキャッシュが必要。履歴のない最新版を同一測量成果と断定しない。参照PDFも私的キャッシュに保存するが配布物には含めない。

QGIS Processingの `gdal:warpreproject`、`gdal:hillshade`、`gdal:slope` を実行する。PNGはRGB整数値を仕様に従い符号付き標高へ変換し、`8388608` をNoDataとして扱う。入力XYZのEPSG:3857からEPSG:6676へ双線形再標本化。

広域：原DEM5A PNG、城域：原DEM1A PNG。広域5Aの欠測31セルだけを、同じ解像度・範囲へ再投影したDEM10B PNGで補完。`regional-source-mask.tif` は値5=5A、10=10B。この区分は原標高の精度を表すフラグであり、Webの20m表示格子とは別。

成果：`production/yamanaka.qgz` と `production/gis/`。相対パスで保存。プロジェクトは現況地形を初期表示し、出典マスク・元5A・代替10B・1m城域・陰影・傾斜・概略アンカーを切り替えて編集可能。

広域4×4kmのGeoTIFFは20mセル。Webはセル中心値から双線形補間し201×201の頂点へ出力する。外周は半セル内側の値を保持（外挿しない）。城域1×1.1kmのGeoTIFFは1mセル、Webは5m間隔201×221頂点。1mデータをWebで1m詳細のまま表示したとは主張しない。

個別測量年・標高基準改定の適用状況はUNKNOWN。PNGの標高をそのまま正高mとして保持し、楕円体高への変換はしない。現況を1590年の地表としない。座標計算の往復精度は測量の精度と異なる。

## Blenderの再制作

```powershell
# 公式ポータブル版約399MBをtools内へ取得し公式SHAを照合
& scripts\setup-tools.ps1
& .\tools\blender-4.5.9-windows-x64\blender.exe --background --factory-startup --python scripts\build-blender.py
```

BlenderのメッシュAPIとglTF出力を実際に使用。現況A・教材Cを別オブジェクト、各ノードのextrasへ根拠・単位・原点・区分を保存。`.blend` は全代替を保持し、現況城域を初期表示する。

教材では30×30mの現況面を切り抜き、実際の現況GLBの三角形面と同じ高さの境界を持つ高密度パッチへ置換し、その面から最大1.8m切り下げる。双線形補間面を基準にはしない。現況面が堀底を覆う重ね置きではない。境界2mは接続用にフェザー処理。区画7m・配置・向きは説明用の推定で、発掘時の遺構の測量復元ではない。

CADは省略。今回の数値は独自のパラメトリック断面教材に限られ、発掘測量図を拘束条件として正確な製作図にする段階ではない。Blenderでm単位と断面のパラメータを保持できるため、別のCAD正本を増やす利益が小さい。将来、測量図の寸法拘束が得られた場合は再判断する。

## 座標契約

EPSG:6676（JGD2011／平面直角座標VIII系）。入力PNGのWeb MercatorとJGD2011間はPROJの変換を利用するが、測量時点と地殻変動を個別補正したとはしない。

原点は案内用WGS84経緯度 `(138.99242,35.15640)` を変換した `(E0,N0)=(44862.121277226666,-93478.07235405142)` m。現地基準点ではない。

| 対象 | 軸・単位 |
|---|---|
| QGIS | Easting E、Northing N、正高H、m |
| Blender | X=E−E0、Y=N−N0、Z=H、1単位=1m |
| glTF／Web | x=E−E0、y=H、z=−(N−N0)、1単位=1m |

`src/coordinates.js` が往復契約。標高誇張はWeb表示グループのyだけに適用し、測量データ・GLBは書換えない。倍率を常時明示する。

縮尺は現在の観察中心を通る水平面で、カメラ右方向の実長を投影した局所基準。見やすい実長を選び、線幅をCSSで丸めたり伸縮して距離表記と食い違わせたりしない。遠近の異なる画面全域で同じ縮尺と解釈しない。

## 検証

`npm test`：全現況GLB頂点の位置・標高、全教材頂点の切下げ・境界、現況面の切抜き、格子補間、座標の向き、縮尺投影を検査。

`node scripts/run-qgis-check.mjs`：別プロセスでQGIS検査workerを起動し、実際の終了コード0と明示解放後の完了契約を確認してからPASSを保存。内部assertionの成功出力だけでは合格しない。QGISプロジェクトを別フォルダーへコピーして読込み、レイヤー参照と欠測・マスクを検査。`scripts/browser-test.mjs`：16条件の実操作とPNG。成功／失敗の終了コードを維持し、retryやskipで失敗を隠さない。

バイナリ制作は専用ソフトが必要で、Web CIが `.qgz`／`.blend` の再生成を保証するわけではない。地理的検証は内部整合であり、現地測量・史実の位置復元の証明ではない。

QGIS再読込み検査は `node scripts/run-qgis-check.mjs` を使用する。workerを直接実行してPASSを判定しない。終了コード・シグナル・完了契約を `evidence/qgis-project-check.json` に保存する。

教材の58°は切下げ差分関数のパラメータで、傾いた元地形へ合成した全ての最終面の絶対傾斜角を58°にするものではない。茶色の教材は根拠区分の固定色で、標高・傾斜・等高帯の凡例対象外と明示する。
