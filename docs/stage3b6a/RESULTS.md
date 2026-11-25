# Stage 3-B6a 結果記録

## 開始ゲート（2026-11-16 JST）
接続account `tetsujisugimori-coder`。PR55 open/Draft、branch `feat/stage3b6-comparison`、HEAD `448931146d35b58d3d49774246fd20d3b4626856`、tree `2625532908c45f33d0e483b9b08a984b71dfd374`。基準との差分なし。main `148317e52a7dc5efba8aa519538a476dfead18c5`。正式review5913448661と確定追補6900520020を読んだ。既存19workflow成功をB6a成功へ流用しない。

旧作業領域のREVIEW.md未commit追補は原位置に保持し、別証拠コピーを作成。新専用worktreeのlocal基準f6276d0は同tree、remote HEADと区別する。保護230path/212原本/22模型の開始時集合・サイズ・SHA manifestを保存し既存検査PASS。旧製品build PASS。契約SHA-256 `95ad67e1dd1545d217bd7db03fae2b93ebfa02b870dcd91b510e9fc3c968961e`は検査器編集前2026-11-15T23:29:51Zに保存・別コピー照合対象とした。

開始容量40,952,311,808 bytes/4,085,113 free inode、案件専用TMPDIR。Windowsギャラリアは開始確認時offline。承認済み代替Library経路を使用予定、アクセス範囲/保持期限UNKNOWN。旧原票・ZIP・失敗・補足資料は非破壊保持。

## 判定
現時点は実装・検証中。総合PARTIAL、限定技術PENDING、限定マージNO。新正式16条件、独立最終レビュー、原ZIP保全はPENDING。Stage3-B HOLD、11未配置/候補0/権利・精度UNKNOWN、実polygon・実変換NOT_TESTED。

## 旧製品での先行確認
- 基準製品は無変更。既存Node648件PASS、build PASS。
- before-01: previewを別execで起動したがrunnerから接続不能。全12行ERR_CONNECTION_REFUSED、実操作未到達。工程FAIL/製品検証NOT_TESTEDとして保持し、製品REDと数えない。
- before-02: 同一shellでpreview→HTTP readiness→runner→終了を明示。375px Chromium normal1（A/B）＋4意図×正常/遅延8行＋503/invalid/empty3行、計12PASS、exit0。製品不具合はこの入力で未再現。新しい旧inner operation ID対応・独立camera/focus期待値を追加して同条件を再確認する。全16条件成功とは扱わない。

## 同じ反例の製品修正
before-03で旧製品の俯瞰操作元focusがbodyへ落ちることを正常順序/遅延順序の2行で確認。10行はPASS、2FAIL、exit1。固定runner SHA-256 `9a226225612071ba6aafc426a16b01c5fcee9b6410b2625aa5c9589a82df05ad`を変更せず、activateでbuttonをdisableする直前の操作元focusを保持し、最新epoch・active・現在bodyの場合だけ完了後にopenへ戻す最小修正。別要素へ移動済み、旧操作、disposed、非操作元の場合はfocusを奪わない。

after-01は同375 Chromium・同runner・同12行すべてPASS、同2反例GREEN・残10正常維持。試験の期待値やtimeoutは緩和していない。独立担当も旧新実activate本文による対照で復帰/非奪取を確認。恒久source-slice回帰5件を追加、全Nodeは653PASS、保護検査PASS、build PASS。source-sliceは実ブラウザの代替ではなく補助。

## 局所本番Chromium全条件
full-01は8通常条件（375/390/765/1280×normal/reduced、A/B実施）＋64明示競合/正常順序対照＋既存故障3、計75PASS、exit0。runnerは同`9a226225…`。局所WebKitは未実施で正式CI待ち。旧製品の同反例と修正後の結果を別ディレクトリで保持。

実行後、未知BROWSER_FILTERで行数0が成功扱いになり得る既存検査器端点を発見。正式workflowは既知engine指定であり上記75行の存在は原票から確認。固定key集合・重複/欠落/未知engine拒否を追加し、検査器の版を分離する。新検査器の正式結果は新HEADで確認する。

## 提出検査器の固定集合ガード
matrix contractの8対照はPASS。手書きsmoke12keysを正常対照に、欠落・重複・追加・kind誤り・未知/空engineを拒否。coverage PASSと製品行FAILは別判定。runner実入口の未知engineはブラウザ起動/証拠dir作成前にexit1。最終ガード版runner SHA-256 `a3096f9b14d651163b4006599afad2b120fae59736bdc5406994e18570170b39`でguard-smoke-01の12行・coverage PASS。full-01の旧runner75行成功と、新ガード版の局所12行成功を区別。新module/testは局所実行時untrackedのためguard-sourceに別保存し、実行時sourceinventoryへ収録済みとは称さない。正式commit後のCIで全固定集合を再検査する。

提出版全Node661PASS（旧648＋focus5＋matrix8）、build/保護/差分検査PASS。提出前独立原票レビューで同2反例・Chromium75行・HAR/trace/画像/source・不変確認を照合し、新blocking P1/P2なし。正式新HEAD・WebKit・原ZIP保存後独立照合は未完のためPARTIAL/限定マージNO。
