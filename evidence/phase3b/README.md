# 第3期Bの検証証拠

総合PARTIAL（歴史的位置精度・実機受入の留保）。最終CIの確定結果・提出HEADは[Draft PR #12](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/12)へ記録する。既存Issue #1/#4/#5/#7/#9と新Issue #11をOPEN継続。Draft解除・merge・auto-merge・本番deployなし。

制作内容・分類・UNKNOWN・再現は[実装説明](../../docs/phase3b.md)、[編集元](../../production/phase3b/README.md)を参照。

- `native/`：Blender制作/別プロセス再読込、QGIS保存/全層再読込、境界と支持脚の自己検査。外部終了0を要求。初期失敗票と後続成功票を区別。
- `preservation.json`：最新main基準の既存914ファイルraw byte保全、既存source5件のデータ保持。
- `browser/`：実装側runnerによるChrome/WebKit、4幅×2motion、施設・定点・比較・非表示・障害/回復・取消の原票とPNG。自動WebKitを実機iPhone Safariと扱わない。
- `legacy-landscape/`：旧景観suiteを隔離cwdで再実行した新規票。過去の証拠は保全。
- `performance*.json`と対応画像：同PC、同canvas600px、新規context、旧main対新景観と品質別の比較。
- `public-review/`：実装と独立した担当による固定HEADレビュー用の記録。

最初の門正面低視点は法面に遮られたため視覚受入FAIL。初期画像・票を保持し、修正後を別の出力先へ保存する。765pxの初期影期待値は画面幅とcanvas幅を取り違えた検査不備であり、原票を保全して修正。localhostの初期接続失敗も製品読込前の環境制約として残す。画像ファイルの存在だけで視覚品質PASSとしない。

実機Safari/VoiceOver/現地・GUI手動編集・実機持続FPS/ピークメモリはNOT_TESTED。位置、史実の構法、1590年標高、旧クラッシュや過去timeoutの根本原因はUNKNOWN。

## 最終自己検証

- `unit-final.txt` / `build-final.txt` / `checks.json`：台帳を8区画へ訂正したworking treeで単体33/33、fail/skip0、build終了0。記載HEADは実行時の親コミットで、未commitの最終台帳修正を含む。最終コミットの再確認はCIに分離する。
- [ブラウザ28条件と負対照4件](browser/README.md)：両engine×4幅×2motionの16条件、200/404取消8条件、fallback/回復4条件PASS。地面遮蔽・門の画角を壊す2変異×両engineは期待どおり拒否。
- `legacy-landscape/matrix.json`：旧景観28条件PASS。`legacy-fallback/results.json`：旧fallback10条件PASS。隔離runnerのChrome起動指定のみGPU Chromeへ変更し、過去証拠を上書きしていない。最終CIでは既存runnerをそのまま実行する。
- [性能48試行・同視点画像16枚](performance/56ce3a1-run01/README.md)：同PC・新規context・同canvas。後続修正は区画の数え方と説明のみで、測定した形状・描画コード・材質・カメラは不変。
- `preservation.json`：原本・過去証拠を含む914既存ファイルのraw bytes一致。明示UI/検査/文書編集10ファイルを除外、出典の既存5レコードは全項目保持。
- `public-review/`：制作・自己検査と別担当の独立史料地理、3D技術、ブラウザ視覚レビュー。担当ごとの実施範囲と未実施を各文書に記載。

## 重要指摘と修正

| 指摘 | 対応と証拠 |
|---|---|
| 自己視覚P2：旧門定点が法面に遮られる | 失敗画像保持。位置・注視・FOVを改良し、raw視線検査のRED→GREEN |
| 独立視覚P2：門全体が画角に入らない | 眼位置-197m・FOV60・門中央への仰角。独立再確認と実GLB2016頂点の画面内投影PASS |
| 独立史料P2：台帳7区画と実模型の8底部が不一致 | 幾何を保全し「標準7＋南端接続1＝8」へ訂正。raw GLBの8底部を数える単体検査を追加 |
| P3：リサイズ時の影／定点ラベル | 影の再計算・対応施設選択を修正し、独立再確認 |
| P3：旧C模型を交互畝と説明 | 史料上の複列の交互畝と、既存Cの格子状簡略化を分けた |
| P3継続：地表等の市松状反復 | 非阻害の外観改善候補としてIssue #11へ引継ぎ |

初回CIの旧fallbackは同URLの複数出典を一意と仮定してstrict違反、旧断面保全検査は出典追記を変更扱いにした。出典ID＋題名＋hrefの厳密確認と、旧sourceレコード全項目・順序を守るappend-only確認へ修正した。初期新runnerのquaternion未対応・定点待機不足・負対照理由識別不備も原票を保全して訂正した。製品不具合・環境制約・検査不備を区別し、失敗を成功件数へ加算しない。
