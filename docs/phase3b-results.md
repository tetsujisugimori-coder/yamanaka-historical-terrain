# 第3期B 提出結果

## A. 総合判定

PARTIAL。制作・Web統合・自己検査・独立レビューの成果をDraft PR #12へ提出。限定取り込みの判断は独立各担当の所見と最終CIを併せてPRへ記録する。歴史的位置精度・実機受入は未完了。Draft解除・マージ・auto-merge・本番deployは行わない。

## B. 制作施設

西櫓の曲輪・土塁・板塀`wb-bailey`、西木戸口`wb-gate`、西櫓堀`wb-moat`、交換可能な西櫓建物`wb-building`を追加。全形状C、B0。独自の材質・経年・日照はD相当で個別切替可能。既存冠木門`sc-gate`と西木戸口は別施設。

西櫓は曲輪名、建物上部は不明。西櫓堀は単列畝堀。史料上の西ノ丸複列は左右交互の畝、既存C模型は格子状簡略化である。参考10区画・深さ9m以上等と、模型の標準7＋南端接続1＝8区画・最大切下げ6.5mを別記する。数値は未地理参照の候補寸法である。

## C. 景観品質

赤褐色の法面・畝、草・裸地・踏み跡を分離。独自128px反復素材、bump、roughness、頂点色を採用。木部は材の色差・木目・切断面・接合部・角面取りを持つ。太陽光相当Directional Light、環境光、限定1024px影、霞を追加。季節・時刻の史実主張はしない。高品質／標準／影なし軽量を選べ、標準は狭いcanvasで影を省く。

[最終画像と操作検査](../evidence/phase3b/browser/README.md)には3区域の俯瞰・低視点、赤土・木材近景、同構図の仕上げ前後を保存。[実mainとの比較16枚](../evidence/phase3b/performance/56ce3a1-run01/README.md)も初期camera・target・canvasを一致させた。独立担当が実ピクセルを確認し、門の画角P2を修正後に再確認した。市松状の反復素材はP3として残る。

## D. 3D制作物

[編集元と再生成手順](../production/phase3b/README.md)。Blender 4.5.9 LTS、QGIS 3.44.10、Python/Node/Three.jsを実使用。既存ソフトを再利用し新規導入なし。

- `production/yamanaka-phase3b.blend`：旧281メッシュを保持、新412部材を編集可能に保存。
- `production/yamanaka-phase3b.qgz`：旧12層＋追加4層。相対参照、EPSG:6676。
- `production/phase3b/`：レシピ、施設・定点・範囲GeoJSON、1m候補高TIFF。
- `public/data/phase3b.glb`：4,540,236 bytes、45,432三角形、全C。
- `public/data/phase3b.json`：安定ID・根拠・仮定・UNKNOWN・参考値と模型値・定点。

旧A/C頂点、固定2断面、元GLB、元正本、過去証拠を保全。新地表を表示するときだけ範囲内の背景indexを外し、非表示・障害・A比較では戻す。

## E. 検証

単体33/33、build、native制作・別プロセス再読込、原本保全に成功。最終自己ブラウザ28条件PASS、負対照4件検出。旧景観28条件、旧fallback10条件を別出力へ保存。最終GitHub CIはPRの固定HEAD記録を参照し、過去HEADの成功を最終HEADの成功と取り違えない。

独立技術計算ではGLB/native最大座標差約0.028mm、470固有境界点のA面との差約0.024mm、地表重複0、背景除去1100三角形の面積一致、柱脚60本の全底面頂点が地表以下。QGIS16層と候補高49点の照合成功。これらは内部計算精度であり測量・史実精度ではない。

性能48試行、各条件3回、同じWindows PC・新規context・同canvas高600px。景観entry readyと合成key＋2frameの中央値：

| 環境・幅 | ready旧→新標準 | key＋2frame旧→新標準 |
|---|---:|---:|
| GPU Chrome / 390 | 0.977→1.101秒 | 15.25→18.15ms |
| GPU Chrome / 1280 | 0.987→1.071秒 | 13.4→36.3ms |
| 自動WebKit / 390 | 1.361→1.856秒 | 46→54.5ms |
| 自動WebKit / 1280 | 1.369→2.657秒 | 72.5→109ms |

GLB2種25,527,380 bytesから追加込み30,067,616 bytesへ17.79%増。旧462,372三角形/20callsに対し観測フレームの新版は390pxで485,332/22calls、1280pxで503,836/31calls。軽量Chrome1280のkey指標は14.95ms、WebKit1280は93.5ms。広画面WebKitの負荷増は制約として残す。軽量化で固定断面の面形状を変えず、分割読込・batch・小素材・狭画面の影省略を採用した。物理入力遅延・持続FPS・全/GPU/ピークメモリの保証ではない。

## F. 独立レビュー

実装者とは別の3担当が固定HEADをレビュー。史料地理は用語・分類・GIS配置・寸法台帳、技術は独自raw GLB/native/QGIS照合、視覚は実ブラウザ・新規画像・操作・404回復を対象にした。[各担当原票](../evidence/phase3b/public-review/)に範囲・未実施を明記。自己検証を独立レビューと呼ばない。

門の視認・全体画角と台帳区画数のP2は修正し、同条件再確認へ回した。リサイズ時の影・定点名・旧Cの説明のP3も修正。テクスチャ反復のP3は非阻害残件。独立視覚担当は全幅全motion・古応答競合・性能・実機を全面検証したわけではなく、自己28条件やCIと分けて報告する。

## G. 留保

UNKNOWN：地理参照残差・正確な歴史配置・1590年標高・上部構造・門構法・植生、初期WebKit390 reduceの一度の読込みtimeoutの根本原因、以前のQGISクラッシュ等。timeout原票を保持し、同45000ms条件の最終再試験はPASS。待ち時間延長やskipで成功扱いにしていない。

NOT_TESTED：実機iPhone Safari、VoiceOver、現地照合、GUI手動編集、長時間FPS・実機通信・ピーク/GPUメモリ。既存bundle警告・依存監査のhigh1件は継続記録。史料PDFの今回の直接再読解はサイズ制限で未完了。第三者画像・図面・PDFを転載していない。

## H. GitHub

[Issue #11](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/issues/11)、[Draft PR #12](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/12)。実装主HEADは`56ce3a1`、後続は台帳訂正・検査補強・証拠を追加。最終提出HEAD、tree、CIの正確なURLと完了状態はPRへ外部記録し、自己参照のためにCI後のHEADを変えない。#1/#4/#5/#7/#9/#11はOPEN維持。GitHub PagesのPR用buildが動いてもdeploy jobは条件でskipされ、本番deployは実行しない。
