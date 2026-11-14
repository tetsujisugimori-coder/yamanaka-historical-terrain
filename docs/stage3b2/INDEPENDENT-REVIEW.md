# Stage 3-B2 独立レビュー

実装担当と別のレビュー担当が、提出候補 `685f7cfa8542f360dea29b63f7d814f8088adcee`（tree `bf2e50e79651f3dbba0531c1ca2e7c537c457ebb`）と後続修正worktreeを確認した。これは歴史位置の確証・専門家による現地測量の認定ではない。

## 独立確認
- 原PDFを別プロセスで全byte読取：13,209,527 bytes、SHA256 `611656844f9c993b2042c98b301f2a63a8e3d14a2be24830c34838b6c995d2d8`。図3-35画像を目視した。西ノ丸、西櫓、元西櫓の名称・位置関係は読み取れるが、これだけで測地座標を同定できない。未配置判断は妥当。
- `git show 6d580ae:<path>` と各実ファイルを独立に比較。src/public/production 234ファイル全byte一致。登録保護原本212件、22模型、11区域を確認。新しい歴史座標や既存模型移動を導入していない。
- 空の位置/残差を0で埋めない契約、原図転載回避、既存EPSG:6676原点・正標高mと軸契約を確認。

## P2指摘と同一反例
`inspect`に対する次の反例を独立作成し、最初はすべて誤受理した（原票 `independent/review-red.json`）。
1. sources全削除、各region.sourceIds/controlPointIdsを空、controlPointsを空にする。
2. verticalを `WGS84 ellipsoidal feet` に置換。
3. webAxesを `x=N,y=E,z=H` に置換。
4. baselineを40桁の0に置換。

実装担当が固定参照集合とbaseline/vertical/webAxes照合を追加。その後、上記の**同じ入力変異**を再実行し4件すべて拒否、正常台帳はPASSを維持した（`independent/review-green.json`）。拒否理由は順にcontrol set mismatch、vertical mismatch、axes mismatch、baseline mismatch。構文エラーやtimeoutを検出成功に数えていない。

## 残る検査範囲
本ゲートは固定未配置台帳の検査器であり、史料の真偽、実測点の同一性、図面歪みの実数評価、将来の配置可否を自動認定しない。独立対応点0、変換・残差計算はNOT_TESTED。合成台帳異常拒否を実測地理参照の成功に読み替えない。
正式CI、最終HEADとの対応、原ZIP保全読戻しの最終判定は別途の実取得結果を要する。

## 相互整合の追加確認
初版はnode側がGIS/模型差異台帳を検査対象にしておらず、その範囲のCI保証が欠けていた。実装担当は `inspectArtifacts` を追加し、GIS ID・null geometry・status・nameを区域台帳へ、模型ID・asset・hashとUNKNOWN/null差異を既存22模型へ照合した。
同じ6異常（架空GIS ID、座標付与、配置済みへ昇格、模型hash差替え、距離0への偽装、模型重複）を独立再実行し、それぞれGIS identity/GIS unplaced contract/model difference provenance/model setの予定理由で拒否した。正常成果物はPASS。最終追加試験24件PASS、独立原票 `independent/artifacts-green.json` と `independent/final-tests.tap`。この局所レビューで未解決のblocking P1/P2はない。最終commit/CI/保全の対応確認は依然別工程。

独立相互整合ハーネスの初回入力には配列閉じ括弧の転記漏れがあり、実行前SyntaxErrorで停止した。これは故障検出件数に含めず、括弧のみ訂正して同じ6変異を再実行した。経緯は `independent/artifacts-initial-harness-error.txt` に保存。
