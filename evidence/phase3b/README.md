# 第3期Bの検証証拠

総合判定は検証・独立レビューの完了後に確定。既存Issue #1/#4/#5/#7/#9と新Issue #11をOPEN継続。Draft解除・merge・auto-merge・本番deployなし。

制作内容・分類・UNKNOWN・再現は[実装説明](../../docs/phase3b.md)、[編集元](../../production/phase3b/README.md)を参照。

- `native/`：Blender制作/別プロセス再読込、QGIS保存/全層再読込、境界と支持脚の自己検査。外部終了0を要求。初期失敗票と後続成功票を区別。
- `preservation.json`：最新main基準の既存914ファイルraw byte保全、既存source5件のデータ保持。
- `browser/`：実装側runnerによるChrome/WebKit、4幅×2motion、施設・定点・比較・非表示・障害/回復・取消の原票とPNG。自動WebKitを実機iPhone Safariと扱わない。
- `legacy-landscape/`：旧景観suiteを隔離cwdで再実行した新規票。過去の証拠は保全。
- `performance*.json`と対応画像：同PC、同canvas600px、新規context、旧main対新景観と品質別の比較。
- `public-review/`：実装と独立した担当による固定HEADレビュー用の記録。

最初の門正面低視点は法面に遮られたため視覚受入FAIL。初期画像・票を保持し、修正後を別の出力先へ保存する。765pxの初期影期待値は画面幅とcanvas幅を取り違えた検査不備であり、原票を保全して修正。localhostの初期接続失敗も製品読込前の環境制約として残す。画像ファイルの存在だけで視覚品質PASSとしない。

実機Safari/VoiceOver/現地・GUI手動編集・実機持続FPS/ピークメモリはNOT_TESTED。位置、史実の構法、1590年標高、旧クラッシュや過去timeoutの根本原因はUNKNOWN。
