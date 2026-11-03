# 山中城 — 歴史地形図録

国土地理院の現況標高と歴史資料を区別し、山中城と箱根西麓の地形を読む研究用Webプロトタイプです。

**制作中 / 独立再レビュー完了。公開時も研究試作の検証用であり、史実の完全復元や攻城戦ゲームではありません。**

コードと独自教材はMIT。地理院タイル由来データには国土地理院の利用条件と出典表示が必要です。三島市の図面・写真・PDFは再配布しません。

## 起動

```sh
npm ci
npm run dev -- --port 4317 --strictPort
```

`http://127.0.0.1:4317` を開く。3D表示にはWebGLが必要ですが、WebGLを利用できない環境でも施設解説と出典は閲覧できます。閲覧にQGIS・Blenderや外部の地図API接続は不要。`npm test`、`npm run build`、起動中のサーバーに対する `npm run browser` で検証できます。

## 成果物

| パス | 内容 |
|---|---|
| `production/yamanaka.qgz` | 編集可能なQGISプロジェクト、EPSG:6676。相対参照で移設検査済み |
| `production/gis/` | 現況DEM、傾斜、陰影、5A／10B出典マスク、概略観察アンカー |
| `production/yamanaka.blend` | 現況Aと推定教材Cを分離した編集可能なBlenderプロジェクト |
| `public/data/*.glb` | 広域・城域・障子堀教材のWeb用3Dモデル |
| `public/data/sources.json` | 年・利用条件・精度・反映範囲付き出典一覧 |
| `evidence/` | 実処理、制作ファイル再読込み、地理・ブラウザ検証、公開前監査 |

操作は地形の回転・拡大・移動、4つの観察地点、標高／傾斜／等高帯、城域／広域／教材、誇張倍率、交通方向の模式線、資料表示。画面の施設一覧からも選べます。

## 確定していないもの

**現在の実装は限定試作で、遺構全形の正確な地理復元の受入は未達です。** 1m・5m・10mは元データの格子区分で、測量精度ではありません。現在のDEMを1590年の完全な地表とはしません。観察地点は概略案内、堀の区画・配置はC教材。B区分の曲輪・土塁・虎口・門の確定復元は未実装。実機iPhone Safari・VoiceOver・現地照合はNOT_TESTED。

- [取得・変換・制作の再現手順](docs/reproduce.md)
- [施設と史料の対応、区分とUNKNOWN](docs/source-model-ledger.md)
- [技術比較・将来シミュレーションとの分離・次期提案](docs/design-and-next.md)
- [検証結果と受入基準](docs/validation.md)
- [出典・利用条件](ATTRIBUTION.md)

検証公開はGitHub Pages用の別ワークフローで扱います。Pagesを利用するには、リポジトリの Settings → Pages → Source で GitHub Actions を選びます。公開URLが表示されるまでデプロイ完了とは扱いません。基盤の独立レビューとマージ判断は実装担当の自己検証から分けています。

## 資料

- [国土地理院・標高タイル](https://maps.gsi.go.jp/development/ichiran.html#dem)
- [三島市文化財課・山中城跡](https://www.city.mishima.shizuoka.jp/page/2145.html)
- [三島市郷土資料館・山中城跡の障子堀](https://www.city.mishima.shizuoka.jp/site/kyoudoshiryoukan/36489.html)
- [三島市教育委員会・保存活用計画、2023年3月10日](https://www.city.mishima.shizuoka.jp/uploaded/attachment/4805.pdf)

本プロジェクトは国土地理院・三島市の公式事業ではありません。
