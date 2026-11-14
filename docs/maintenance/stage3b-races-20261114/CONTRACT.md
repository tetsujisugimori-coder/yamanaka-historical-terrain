# 遅延5経路：証拠種別と受入契約（2026-11-14）

対象PR #42 / Issue #41。開始HEAD 9319dd887b073598765a820d44b9b5fde0915b78、tree 95be42dbcd98380b01f2e3ad5b99709d88bef7dc、base c0ba33b52c86b252ef570467b7b5058fb33d87d2。追加レビュー5904216394に対応。過去の4経路×2engineのNOT_TESTED原票を保持し、成功へ書換えない。

## 判定軸

`evidenceType` は UI_REACHABLE / UI_UNREACHABLE / CONTROLLER / FAULT_INJECTION の試験種別。`status` は PASS / FAIL / NOT_TESTED / BLOCKED / N/A で別管理する。UI_UNREACHABLEのPASSは到達不能性を確認した意味だけで、内部安全性や当該UI競合の実行成功ではない。N/Aは対象と根拠を限定し、未実施を隠さない。

| 経路 | 通常UIの契約・根拠 | 別に検査する内部契約 | 故障注入との区別 |
|---|---|---|---|
| 1 取得中close | 初回JSON中はopen無効・close非表示。開く時のregionalは取得済み。従来の遅延close実行はNOT_TESTED保持 | 実overview controllerの保留open→close/取消→新操作→旧終了。active/group/状態を上書きせず、新操作成立 | hidden操作の直接呼出しはCONTROLLERでありUI操作でない |
| 2 旧詳細中に別模型 | 模型一覧は操作可能。旧GLB保留→新詳細完了→旧解放・terminal→state/camera/viewport不変を両engineで検査 | 共有取得と操作所有権、最新waiterが生存し旧scene接続を拒否 | 意図的な所有権破壊は負対照 |
| 3 retry逆順 | pending中retry hidden/disabled、要求数2を確認。UI逆順実行NOT_TESTED保持 | 実reloadの世代識別。旧失敗/新成功、旧成功/新失敗をともに検査 | controllerから並行開始しても通常UI直列化契約は変更しない |
| 4 古いrestore | capture前のview/variantはcache済み。通常UIで独立保留可能なHTTP境界がない。UI競合NOT_TESTED保持 | 実restore callback/intentを使いasync境界で新操作。view/landscape/drama/selected/variant/camera/target/fovを比較 | 模擬bindingのsnapshot引渡しだけで実restore成功としない |
| 5 dispose後応答 | 通常UIにdispose操作がない。通常UI dispose実行NOT_TESTED保持 | 実overview disposeおよび所有権制御で保留応答のterminal、scene非再接続、資源非復活・追加取得なし | native WEBGL_lose_contextは別FAULT_INJECTION。通常disposeと同等としない |

## 固定検証方針

旧要求開始/保留→新操作完了→旧応答解放→旧処理終了を観測後に比較する。任意sleepや即時応答だけで競合成立としない。正常・逆順・失敗・取消・破棄・同一資源共有を分ける。負対照は故障用コピーだけを変更し、検出されたassertionと期待理由を照合する。起動失敗、timeout、構文エラーは意味的REDに数えない。製品から抽出する関数がある場合は抽出境界とsource hashを保存し、模擬周辺依存と実関数の境界を明記する。

既存production固定16＋開始状態6＋故障6＋逆順2＝30条件、484模型遷移、hidden対照、独立回帰、dev/既存正式CIは変更・緩和しない。新CONTROLLER証拠は別集計。最終HEAD/treeとCI合成SHA/treeを照合する。PR累積105ファイル（開始時）もマージ候補に含まれ、今回の差分だけの承認ではない。

## 資源と保全

既存checkout/public 72,149,293 bytesを参照し、大容量GIS/GLB/CADを複製・再生成しない。開始空き38,889,050,112 bytes、inode 3,886,143、overlay。同じ物理容量上の案件専用証拠/Tempを使用。局所証拠予算100 MiB、正式原artifact取得/再取得予算3 GiB、空き安全余裕1 GiB。共有Temp/他案件/旧FAILの削除なし。

元ZIPを再圧縮せずLibraryへ保存し、別ファイルとして実再取得して独立size/SHA/CRC/manifest照合。アクセスACLと保持期限は取得できなければUNKNOWN。Windows追加移管は必須にしない。既存原本212件の不変と生成データ検証を維持する。

## 判定境界

本契約は通常UIで不可能な4競合をUI PASSと偽装するための変更ではない。新しい内部証拠と到達性根拠に基づき限定受入を再審査する。全Stage3BはHOLD。歴史区域11件の位置・境界、史料精度、runtime網羅、連続歩行/履歴stress/性能、実機Safari・touch・VoiceOverは未受入のまま。Draft解除・マージ・main更新・Pages公開なし。

## 開始時の累積範囲

mainとの差分は105ファイル、32,656追加/30削除（今回変更前）。既存src5、public1、research7、production3、scripts18、tests6と文書/原票等を含む。今回の内部試験追加だけをマージするという意味ではない。保護212原本は基点842d5378との検査で全件不変、生成22模型/11未配置区域はverify一致。これらは史料や位置精度の保証ではない。

## 追加検査の実装範囲

`scripts/stage3b-controller-contract.mjs` は製品main.jsのrunAction/setView/loadInner/restoreとoverviewのreload/activate/deactivate/disposeの一意な実ソースを切り出し、VMで実行する。createIntentControllerとThree.jsのGroup/geometry/materialも実実装。DOM表示、GPU描画、getModelの実通信等の周辺はfixtureであり、実ブラウザ全体の証拠ではない。sliceサイズ/SHA、元source全byte、正常15件・意味的故障10件の個別結果を保存する。故障箇所数・変換前後hashと期待した拒否理由を検査する。

`dispose-response` はmainのloadInnerにrenderFailed境界を与えた内部契約、`overview-dispose` は実overview.disposeでscene親除去・geometry/material disposeと後着reloadを実行する。前者をmain全teardownの実行としない。実ブラウザのnative context-loss証拠が別途補完する。全8復帰項目の通常正常対照と、旧restore/new-operation・camera-onlyの棄却を別々に確認する。

初回検査器案に対する独立指摘（模擬runAction、reload/dispose不足、広すぎるAssertionError受理）を改め、実関数の抽出・正当な正常対照・期待理由一致を追加した。これは製品不具合を修正したという記録ではない。製品コード・原本・正式30条件は無変更。
