# Stage 3-B3 提出版CI・原証拠の保全完了

確認: 2026-11-15 18:03 JST。実装版HEAD `e770141ff8c479b9f962890d3b9b6c97f2391137` / tree `58b06b597ad3d455e7d7b1f4113831e12ecec991`。本書を追加する文書版HEADの結果と区別する。

## 正式CI

PR12・push4の16 workflowがすべてcompleted/success、各attempt1。Pagesのbuildは成功、deployはskip。artifact0本はこの公開用工程がskipのrunだけで、未取得artifactを0扱いしていない。

|run|event|workflow|状態|artifact数|
|---|---|---|---|---|
|[43692270430](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270430)|pull_request|Stage 3-B2 unplaced evidence contract|completed/success|1|
|[43692270351](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270351)|pull_request|Stage 3-B3 survey correspondence evidence|completed/success|1|
|[43692270293](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270293)|pull_request|Stage 3-B castle overview|completed/success|1|
|[43692270320](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270320)|pull_request|Validate castle exploration|completed/success|1|
|[43692270402](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270402)|pull_request|Validate prototype|completed/success|6|
|[43692270322](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270322)|pull_request|Validate landscape-only C D extraction|completed/success|1|
|[43692270417](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270417)|pull_request|Deploy research preview to GitHub Pages|completed/success|0|
|[43692270370](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270370)|pull_request|Validate connected defences|completed/success|1|
|[43692270352](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270352)|pull_request|Validate western defences|completed/success|2|
|[43692270470](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270470)|pull_request|Stage 3-A pinned CAD integration|completed/success|2|
|[43692270310](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270310)|pull_request|Stage 3-B limited production acceptance|completed/success|2|
|[43692270318](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692270318)|pull_request|Validate inner observation|completed/success|4|
|[43692213212](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692213212)|push|Stage 3-B3 survey correspondence evidence|completed/success|1|
|[43692213192](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692213192)|push|Stage 3-B castle overview|completed/success|1|
|[43692213087](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692213087)|push|Validate prototype|completed/success|6|
|[43692213094](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43692213094)|push|Validate western defences|completed/success|2|

## 保存後の実バイト照合

正式32 ZIP合計1,071,432,825 bytes。専用B3の2本は既存保全済みかつ本レビューで実再取得検査済み。残り30本1,071,280,860 bytesは今回追加保存し、保存後に実再取得して元ZIPとの全バイト比較・サイズ・SHA-256・全CRCを30/30確認。原ZIPを再圧縮していない。正式32本とは別に局所bundle250,865 bytesも既存保全済みで実再取得検査済み。

今回追加30本のうち内部manifestがない28本はNOT_APPLICABLE（元artifactに存在しない）。限定閲覧Chromium/WebKitの2本は各5個、計10内部manifestの全行（計2,254参照）をサイズ・SHA-256照合PASS。既存専用2本は各manifest26件、局所bundleはmanifest89件を検査済み。内部manifestのないZIPを完全な全入力保全と主張しない。

本レビュアーが保存前検査と保存後の別プロセス読戻しを実施した。実装・CI作成者からは独立しているが、今回さらに別の人間/サブエージェントを追加したとはしない。元ZIPと読戻し実体は別ディレクトリに保持し、過去失敗票・共有Temp・原本を削除/上書きしていない。

|run|event|artifact ID|artifact名|bytes|SHA-256（公式digestと一致）|保存後全バイト/SHA/CRC|
|---|---|---|---|---|---|---|
|43692270430|pull_request|14152474230|stage3b2-evidence-5966c0b255e610b885aca089aee565382de207d0|10077|93224dd718713cd4177cf21ebcf4814001462a3941394104a66324567e9cfdb3|PASS|
|43692270351|pull_request|14152454770|stage3b3-evidence-5966c0b255e610b885aca089aee565382de207d0|75988|6b66afef0383b60c43df3aa4fb728aedbf5169bf1695636039c23e70a9c98cb8|PASS|
|43692270293|pull_request|14152629166|stage3b-overview-5966c0b255e610b885aca089aee565382de207d0|85929795|54dde3b947a04b3a2edda9afabac6c81e34f14b1295147a7a4763c014b005efa|PASS|
|43692270320|pull_request|14153755723|phase3e-e770141ff8c479b9f962890d3b9b6c97f2391137|3269998|d0b132a238177d1e01dee4c1346284054b05f88328a4f29ce1a30f7c3156442f|PASS|
|43692270402|pull_request|14153166567|landscape-1590-evidence|23489845|164b82c611eb791fc606159888f80348a417f83a422e9eb86103c419df4f6c8d|PASS|
|43692270402|pull_request|14153161143|review-fixes-evidence|2984008|d427b1ca1ae83612bc2ac50a22568b2e2b45fb09fd9b836196b4404747f92b42|PASS|
|43692270402|pull_request|14153140733|fixed-view-controls-evidence|2101023|8984095c535416fa85775510ff6ecaeceeec84f0e557b01230752d06c4c45975|PASS|
|43692270402|pull_request|14153112619|browser-evidence|31191407|3b90b7d7fd275225d9465f685d55b479f29e7c04bd76c6bf17c8bea9e05828de|PASS|
|43692270402|pull_request|14153078002|fixed-sections-evidence|96449691|8b8e398287f91ce028e54e4f0dde9c5cb57af257ea7bd2b7198caf671fa6af3c|PASS|
|43692270402|pull_request|14152629549|initial-camera-evidence|1443033|821c70b2cc911e386189f48faa57f92c26df9d0a7ec50d5b7a989c802a39d623|PASS|
|43692270322|pull_request|14153255951|phase3i-e770141ff8c479b9f962890d3b9b6c97f2391137|4885949|83c15a9a80e66b2b51c8a2ba3c7ec6cf3bda75a629f086c2cc9227ce33fb751e|PASS|
|43692270370|pull_request|14153625009|phase3d-current-head|1657837|8ab960c93ed14e646b666303d94ae5b76d41d73ed50c1f6c51035a6a5a60fd3d|PASS|
|43692270352|pull_request|14154201977|phase3b-browser-evidence|80993291|b8f5675ca0ad5251b053ae572052a752da2c48f9b8bd1fd21e9eb6ce9ed60d9c|PASS|
|43692270352|pull_request|14152939678|independent-ad-separation|11751367|0815d7a702221cfe0a64d5dda7c50bb4c8346035f37cabd14f86342d7b7096bb|PASS|
|43692270470|pull_request|14153822046|stage3a-integration-e770141ff8c479b9f962890d3b9b6c97f2391137|9940466|3671deb13b5c425c3246cc4bb96679ae7e202bf2a0e3a834be23a748444a8ea0|PASS|
|43692270470|pull_request|14152549886|stage3a-performance-e770141ff8c479b9f962890d3b9b6c97f2391137|3166|27ce8ce267b3b6575352f28823c6b3e7674614147c8e76446bc045d940b43a6b|PASS|
|43692270310|pull_request|14154061783|stage3b-limited-chromium-5966c0b255e610b885aca089aee565382de207d0|173581533|5ff6013588fd18c592726bed2ef8220bea5a0c2577e45f27a6fd181bb2ca1536|PASS|
|43692270310|pull_request|14153171855|stage3b-limited-webkit-5966c0b255e610b885aca089aee565382de207d0|177599980|f22b59f1a0f5682d7890029128f072b106d770835b19de5dae89ddb4efb4cf79|PASS|
|43692270318|pull_request|14154205411|phase3c-browser|8157240|c338ba09c809ee41ab86f9d6b61e265877a4b0c7e26b530f3a07a78146354719|PASS|
|43692270318|pull_request|14153472250|phase3c-independent-visual|4559220|398c9a93afb0b8c82c759e02b6105c4fbe1ad576f1515b49d43166263b7612dc|PASS|
|43692270318|pull_request|14152899185|phase3c-render-diagnosis|7408|a5fdf56146a3c148b023ad915273e7185cb62aafae2645fbfb857f727b4dc842|PASS|
|43692270318|pull_request|14152309881|phase3c-appearance-performance|14639875|d8b0e3a59b2674b8798e2e3e6930404393bd58ef870f13109a469d111c6d05e4|PASS|
|43692213212|push|14152628616|stage3b3-evidence-e770141ff8c479b9f962890d3b9b6c97f2391137|75977|61e7d070dab6cd3f9f24c7f0c89668d666f2e1f42323af2c6c0ca6644ac441f4|PASS|
|43692213192|push|14152439564|stage3b-overview-e770141ff8c479b9f962890d3b9b6c97f2391137|86222877|918fac207101bf3cdb580d5f4c5ce8019db8a6199cb5efbd56aef4fca4451341|PASS|
|43692213087|push|14153505088|fixed-sections-evidence|96449242|f383e0b0aab2cb45024860f26e387d118b293c2fd73c74b90f541443b48d79b4|PASS|
|43692213087|push|14152903359|review-fixes-evidence|2972902|4a7ede8dbe5039a21bd917fa68ffa62067c83b454331d722df971495515f0fcf|PASS|
|43692213087|push|14152898803|landscape-1590-evidence|23489860|c84e55901afb629cb9111b3418029fd9aacfd0f9a2ea6435cf102240b771cfc3|PASS|
|43692213087|push|14152778967|browser-evidence|31192439|4881f46a7ab6bafcd4d40b9ffa20cc69f24400e78b6dde899b2c09f223e5e5be|PASS|
|43692213087|push|14152644099|initial-camera-evidence|1461466|4d4558ec8dd0c7cd7652d674284d1ae6a290d91ad0e1bf2d15dbca0a9eacac2a|PASS|
|43692213087|push|14152109897|fixed-view-controls-evidence|2101197|8f55a622014e4d2765641ef2352c9cd0fe209b1692ca868765b96270f7b96407|PASS|
|43692213094|push|14154042353|phase3b-browser-evidence|80993299|c9ff741d01779bc26c70bd62ed40a4ed303446d3bf546f71ea85a327878dfc3a|PASS|
|43692213094|push|14152684940|independent-ad-separation|11751369|2a310446500874f10f9247110b70fb992f153a67c1546c57231269f2db2253eb|PASS|

## 範囲と限界

承認済み本人限定保管先に保存し実再取得した限定保全の判定。実効ACLの技術監査・保持期限・永久保持・Windows追加移管はUNKNOWN/未実施で、Windows確認時offlineという先行記録から現在の接続状態を推測しない。本人限定保管先としての承認は既存利用者確認による。保護212原本実体はB3 ZIPに重複収録せず固定Git基準とhash台帳を参照する。runとartifactの紐付けは公式API、実checkout/treeが内部にあるものはその記録を用い、全artifactに同一形式の内部identityがあるとはしない。

容量: 処理前空き59,827,474,432 bytes・inode4,114,394。追加ZIP取得と読戻しの実体は合計2,142,561,720 bytes。読戻し後空き57,683,951,616 bytes。案件専用領域を使用し、地形/模型の新規生成や共有領域整理は行っていない。原証拠・run/jobスナップショット・保存ID対応表は本人限定の補足台帳に保持し、署名URLや非公開保存識別子を本書へ転記しない。

この完了は実装版`e770141ff8c479b9f962890d3b9b6c97f2391137`についての結果。本書・レビュー記録・RESULTSの文書更新後HEADに対するCIと原証拠はPR追補で別記する。測量原図・同一点・歴史位置・配置は引き続き未確証で、Stage3-B HOLD・総合PARTIALを維持する。
