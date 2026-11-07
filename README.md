> 第3期C：西ノ丸見張台・土橋・虎口のC候補と8地点の誘導式観察を追加。現在の提出状況と未確認事項は[第3期C結果](docs/phase3c-results.md)を参照。既存PR #12は2026-11-05にマージ済み。

> 第3期B：西櫓・西木戸口・西櫓堀のC候補と赤土・木材・限定影を追加。[制作内容と留保](docs/phase3b.md)／[検証証拠](evidence/phase3b/README.md)／[提出結果 A–H](docs/phase3b-results.md)。史実位置はUNKNOWN、実機受入は未完了。

# 山中城 — 歴史地形図録

第3期Aの作業版は、冒頭の「1590年の景観へ」から西ノ丸のC推定・D創作景観と4つの定点観察へ入れます。同じカメラでA現況/Cのみ/C＋Dを比較できます。史実確定の復元ではありません。[制作・編集元・再現・検証と留保](docs/landscape-1590.md)を参照。第3期Aの独立レビューは完了し、PR #10はマージ済みです。史実の精度・実機受入は引き続きPARTIALです。

国土地理院の現況標高と歴史資料を区別し、山中城と箱根西麓の地形を読む研究用Webプロトタイプです。

**制作中 / 第1期の独立再レビューは完了。第2期Aの独立指摘P2-01/P3-01は修正・独立再レビュー済みで、PR #6もマージ済み。公開時も研究試作の検証用であり、史実の完全復元や攻城戦ゲームではありません。**

コードと独自教材はMIT。地理院タイル由来データには国土地理院の利用条件と出典表示が必要です。三島市の図面・写真・PDFは再配布しません。

## 起動

```sh
npm ci
npm run dev -- --port 4317 --strictPort
```

`http://127.0.0.1:4317` を開く。3D表示にはWebGLが必要ですが、WebGLを利用できない環境でも施設解説と出典は閲覧できます。閲覧にQGIS・Blenderや外部の地図API接続は不要。`npm test`、`npm run build`、起動中のサーバーに対する `npm run browser` で検証できます。

## 成果物

PR #6の独立指摘P2-01/P3-01への修正・実GLB反例と引継ぎは [再レビュー修正記録](docs/review-fixes.md) を参照。第2期A初回の自己受入と、この修正後の独立再レビュー成立を混同しません。

| パス | 内容 |
|---|---|
| `production/yamanaka.qgz` | 編集可能なQGISプロジェクト、EPSG:6676。相対参照で移設検査済み |
| `production/gis/` | 現況DEM、傾斜、陰影、5A／10B出典マスク、概略観察アンカー |
| `production/yamanaka.blend` | 現況Aと推定教材Cを分離した編集可能なBlenderプロジェクト |
| `production/yamanaka-phase2a.qgz` / `production/phase2a/` | 西ノ丸候補のC配置範囲・推定地表・現況との断面比較。現況正本は相対参照 |
| `production/yamanaka-phase2a.blend` | 原ファイルの4メッシュを保全し、新規5施設と周辺地形を個別編集可能 |
| `public/data/nishinomaru.glb` / `nishinomaru.json` | 西ノ丸候補区域、安定ID・根拠・仮定・将来記事への関連付け |
| `public/data/*.glb` | 広域・城域・障子堀教材のWeb用3Dモデル |
| `public/data/sources.json` | 年・利用条件・精度・反映範囲付き出典一覧 |
| `evidence/` | 実処理、制作ファイル再読込み、地理・ブラウザ検証、公開前監査 |

操作は地形の回転・拡大・移動、4つの概略観察地点、標高／傾斜／等高帯、城域／広域／教材、誇張倍率、交通方向の模式線、資料表示。第2期Aは「西ノ丸の復元候補」から5施設を選択し、同じ視点でA現況とC復元候補を比較、施設ごとの表示切替、曲輪・通路からの低い視点を利用できます。画面の施設一覧でも選べ、WebGL不能時も5施設の説明と出典を読めます。モデルは約25MBで、実機のメモリ・通信負荷は未検証です。

## 確定していないもの

**現在の実装は限定試作で、遺構全形の正確な地理復元の受入は未達です。** 1m・5m・10mは元データの格子区分で、測量精度ではありません。現在のDEMを1590年の完全な地表とはしません。観察地点は概略案内、堀の区画・配置はC教材。B区分の曲輪・土塁・虎口・門の確定復元は未実装。実機iPhone Safari・VoiceOver・現地照合はNOT_TESTED。

- [取得・変換・制作の再現手順](docs/reproduce.md)
- [施設と史料の対応、区分とUNKNOWN](docs/source-model-ledger.md)
- [技術比較・将来シミュレーションとの分離・次期提案](docs/design-and-next.md)
- [検証結果と受入基準](docs/validation.md)
- [第2期Aの制作・根拠・再現・検証と独立レビュー引継ぎ](docs/phase2a.md)
- [初期カメラ操作のP2修正・旧版/欠陥版/修正版の比較](docs/initial-camera-fix.md)
- [出典・利用条件](ATTRIBUTION.md)

検証公開はGitHub Pages用の別ワークフローで扱います。Pagesを利用するには、リポジトリの Settings → Pages → Source で GitHub Actions を選びます。公開URLが表示されるまでデプロイ完了とは扱いません。基盤の独立レビューとマージ判断は実装担当の自己検証から分けています。

## 資料

- [国土地理院・標高タイル](https://maps.gsi.go.jp/development/ichiran.html#dem)
- [三島市文化財課・山中城跡](https://www.city.mishima.shizuoka.jp/page/2145.html)
- [三島市郷土資料館・山中城跡の障子堀](https://www.city.mishima.shizuoka.jp/site/kyoudoshiryoukan/36489.html)
- [三島市教育委員会・保存活用計画、2023年3月10日](https://www.city.mishima.shizuoka.jp/uploaded/attachment/4805.pdf)

本プロジェクトは国土地理院・三島市の公式事業ではありません。

## 固定2断面の比較（Issue #7）

障子堀横断と曲輪から土塁の2本で、現況A・推定Cの同じ水平位置を比較できます。表示GLB三角形面から断面を取得し、モデル基準高と実寸の比高・水平距離を示します。グラフの点をtap、または下のボタンをkeyboardで選ぶと3D位置と対応します。3Dの誇張1/2倍でもグラフの実寸値は不変です。幾何的一致は歴史的な正確さの証明ではありません。

[座標・取得方法・根拠と仮定・検証手順](docs/fixed-sections.md)、[提出用の新規証拠](evidence/sections/submission/)、[Issue #7](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/issues/7)。固定2断面のPR #8は独立レビュー後にマージ済み。自己検証と独立レビューは区別し、既存UNKNOWNを維持します。

### 第3期D：防御空間の接続候補（受入中）
既存8地点を攻め手・守備側の対で観察し、土橋～虎口に推定Cの門・柵を任意表示します。視線交差は模型内の確認で、史実の射程・勝敗を示しません。景観DはAから分離します。編集元・再生成は production/phase3d/README.md、検証範囲は docs/phase3d-results.md。Draft・未公開を維持します。

### 第3期E：模型上の城内探索（Draft）
1590年景観の「自由歩行」からWASD/方向キーとドラッグ、または画面ボタンとスワイプで移動できます。目線は表示地表＋1.7m、堀・急斜面・柵などは通行制限。8地点の案内は地点移動で、未接続の経路を歩いたことにはしません。土粒・木繊維の近距離D質感を追加し、現況Aと既存造形を保全します。[設計・操作・未達](docs/phase3e-design.md)。実際の史跡の安全案内ではありません。地形造形の全面精細化・実機受入は未完了。
