# 第3期H: 連続C地形拡張とD自然景観

基準main 3b08613682c794f50d90ef81b8a41170f40f8476 (G PR22統合)。Issue23。編集範囲と実変位はproduction/phase3h/parameters.json及び検証結果に記録する。既存A/G原本と固定部品JSONは変更しない。

## CとD
Cは既存面の水平輪郭と接続を保持した限定高さ修正。Gの枠外へ土橋・曲輪・虎口の既存地表をつなぎ、仮説Cとして拡張する。新通路や歴史的寸法の発見ではない。
Dはsrc/nature-finish.jsによる決定的なプロシージャル色。斜面・通行面・平坦部を識別し、赤土と草地の色・粗さを調整。position/indexを変更せず元の材質・色attributeを厳密に復元する。葉・木材・建築物は対象外。素材は独自生成で第三者画像を使用しない。

低木は6候補地点から実三角形支持が得られ、18°以下のものだけ表示。高さ約0.5m以下の低い抽象形状、D演出で樹種・分布の史実を表さない。通路外に限定し、歩行障害物や新経路として使わない。light品質では省略、balanced/highでは1 instanced draw。A/C-only/D-offでは非表示。既存植生は無断変更しない。

## 部品
Gの固定manifest、5柱位置・仮寸法・回転/scale controls・基準支持を保持。正式CAD/STEP/GLBは未連携。差替えには別固定commit/hashと単位/軸/寸法検査が必要であり、URLを置換するだけでは受入しない。現GLB=nullを成功へ書き換えない。

## 再生成と検証
scripts/phase3h-reproduce.shでBlender/QGISを実行、別プロセスで再読込。元A/Gを保存しH別版を出力。
node scripts/phase3h-browser.mjs、phase3h-evidence.mjs、phase3h-preservation.mjsで16条件・D画像・HASH・旧資産を照合。テストの合成fixtureは実ブラウザ成功と数えない。
G/H比較はscripts/phase3h-compare.mjs。両dev serverと実行を同じ環境内に置く。VERSION=G/H、TRIAL=0/1/2、画像はMODE=images LANDSCAPE_MODE=c/cd。同一cameraをtest-only HTTP注入で固定し製品を改変しない。性能は共有実行環境の値、実機FPS保証ではない。

## 未確認
実機Safari、物理タッチ、VoiceOver、実機持続性能、史実形態と植生、広域西木戸口拡張。完了した限定範囲と別々に判定する。
