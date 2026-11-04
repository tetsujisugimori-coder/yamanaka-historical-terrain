# 新規断面証拠の案内

これはIssue #7の実装担当による新規自己検証。別担当の独立レビューではない。過去のevidenceフォルダは変更していない。

## 正式な提出用票

- `submission/summary.json`：正常62、保留Cと誇張4、故障対照40拒否＋影響しない1倍8受理。実行開始HEAD `c96c8c0bcbaf49a33ebefb57c81cba347f6e364c`。製品/runner/oracle hashを各票へ固定。
- `submission/normal.json`：Chromium/WebKit、375/390/1280px、2線・A/C・1/2倍、8ゲート競合、6回帰。実寸プロファイルは各1/2倍で完全一致。線の描画bufferの最大高さ誤差0.000024414063m。
- `submission/height.json` / `coordinate.json` / `double.json`：実際の旧版不具合ではなく、レスポンスmoduleへ故障を注入した対照。各16観測、誇張二重適用は1倍8件が正常で2倍8件だけが拒否。通信失敗等を期待FAILへ数えず、具体的な幾何エラーを要求する。
- `submission/pending-green.json` と本フォルダ直下 `pending-red.json`：実main由来の誇張によるC要求取消。修正前4 FAIL→同条件4 PASS。原因と変更はdocs/fixed-sections.md。
- `submission/geometry-and-protection.json`：2線×A/Cの全735交点/中点の独立照合、元データ/過去証拠156ファイルのbyte保全PASS。数値最大誤差1.1369e-13m、事前許容1mm。密な0.137m点照合と合成欠損/重なり等はunitにも含む。
- `submission/summary-controls.json`：集約自体の正負対照。正常0、画像ではなく必須JSONの欠落/破損、条件不足、source違い、HEAD違いはすべて子process終了1で拒否。
- `submission/*-graph.png` / `*-3d.png`：各engine×幅×2断面の24枚。実寸グラフ・線・S/E・選択点。画像は支持証拠であり、数値照合は画像類似比較ではない。
- `subpath/results.json`：ローカルのPages相当buildに対する新断面8 PASS（390/1280、両engine、2線）。公開デプロイではない。
- `regression/`：新規の隔離cwdで実行した既存9結果JSON、248/248 PASS。通常16、fallback10、cycle2、第2期A16、同fallback12、選択/高さ112、Reset4、初期camera72、subpath4。`regression-exits.json`の8連続scriptとsubpath別実行の終了0を確認。過去の原本結果をこの値で置き換えていない。
- `unit-final.txt`：26/26、`build-final.txt` / `pages-build.txt`：通常/Pages build。bundleサイズ警告は留保、lint/型専用commandは既存構成にない。
- `publication-audit.json`：新規候補を含む公開前監査。元の監査原本は上書きしない。

## 初期試行と最終票の区別

`initial-trials.json` は最初のunit試験設計上の件数閾値ミス（Aの5m面の交点数はCより少ない）とbrowser取得環境エラーの記録。数値不一致を閾値緩和で隠したものではない。全交点/中点＋密な独立点照合へ変更した。

`environment-denied.json` / `verified/` は製品に到達しないsandbox loopback拒否/timeout。`normal.json`（直下）、`browser/`、`final/`、`controls/`、`controls-final/` は開発中の途中/再試行票で、途中で実装/runnerを修正した場合も残す。初期 `browser/normal.json` のゲートFAILは、まだ非表示の比較buttonを操作しようとしたもの。読込み中から比較controlsを開く修正後は正式票でPASS。途中票を最終PASSの根拠に用いない。

最終の正常/負対照は `submission/`。元のHEAD以降が証拠・文書・CI/補助検査だけの変更であれば、製品とrunnerのhashで同一性を確認する。CIはrun/attemptごとの新しい `ci-<run>-<attempt>/` を使い、GITHUB_SHAとhash・全条件を集約で検査する。CIの最終SHA結果はPRへ追記する。

## 目視と未実施

自動実操作/数値検査と、実装担当の目視を区別する。目視サンプルはChromium375の堀グラフ、WebKit375の土塁グラフ、Chromium390土塁3D、Chromium1280堀3D。狭幅の折返し・軸・文字・凡例・S/Eと線を確認。残りの画像も保存し、独立担当が検査できるようにする。スクリーンショットは全画像の人手承認を意味しない。

実機iPhone Safari/VoiceOver/現地/歴史的位置精度/個別の標高基準補正は未検証。WebKit emulationを実機Safari完了にしない。QGIS/Blender正本の再生成・native再読込は未実施で、原本保全とGLB面照合のみ。本工程ではmerge、auto-merge、Draft解除、公開なし。
