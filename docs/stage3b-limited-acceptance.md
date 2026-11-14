# PR #42 限定受入の審査範囲と完成条件

2026-11-14 JST。文書・ソース・GitHubメタデータの照合による審査です。今回の環境で製品試験・原artifactの取得・実バイト照合を再実行した結果ではありません。**Stage 3-B全体はPARTIAL。PR #42全体のマージ推奨NOを維持し、独立して審査可能な機能と、その完成条件を整理します。**

## 対象と判断の前提

- 審査対象：[PR #42](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/pull/42)、HEAD `364afd95e6cc6f2f1899413b4bafd85adda23de9`、tree `9cdf29a33cb3c651067e114d9a37379790d13209`。open/Draft・未マージ。
- 現main：`283c65d0027c86820486e1b4ff927780ec37dd05`。PR #38採用基点 `842d5378bb1fad648f225b79933763b8e87b6afa` にPR #43のAGENTS.md変更が加わっています。PR #42のCIは旧基点との組合せの結果で、新mainとの再検査を実施済みとは扱いません。
- 全体の既存条件は[Stage 3-B初回範囲](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/blob/364afd95e6cc6f2f1899413b4bafd85adda23de9/docs/stage3b/README.md)、[継続記録](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/blob/364afd95e6cc6f2f1899413b4bafd85adda23de9/docs/stage3b/CONTINUATION-20261110.md)、[再開記録](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/blob/364afd95e6cc6f2f1899413b4bafd85adda23de9/docs/stage3b/RESUME-20261113.md)、[最終追補](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/issues/41#issuecomment-6853774253)を参照します。履歴時点の「未提出」「PR #38未統合」「QGIS未実施」は、後続記録の限定範囲で更新されています。
- 保存済み模型の数値範囲と、歴史的城域の位置・境界を別の成果として審査します。「独立して採用可能な候補」は、現在その部分だけがmainへ採用済みという意味ではありません。PRをコード分割する操作も行っていません。

## 独立した機能ごとの完成条件

「既存証拠あり」は過去の記録で技術的根拠がある状態、「追加確認」は下記の完成条件を現審査で満たしたとは確認できない状態です。いずれも正式な限定受入PASSへの昇格ではありません。

| 審査する機能 | この部分の完成条件 | 現在の根拠と判定 | この部分に含めないもの |
|---|---|---|---|
| 城域全体への入口 | キーボードとボタンで開閉できる。俯瞰は現況Aを使い、入口操作が詳細GLBの一括取得を起こさない。閉じると入口へフォーカスが戻る | 既存16条件の試験項目あり。独立審査候補 | 歴史的な城域全体の復元完了、初期化全体のGLB取得ゼロ |
| 保存済み模型の範囲表示 | 固定した5 GLB由来の22模型について、実POSITION頂点とscene変換から外接範囲を求め、出所・hash・座標系を追跡できる。既存模型を移動しない。対象外を画面で明示する | 生成器・独立oracleの既存記録あり。範囲の画面説明は追加確認 | 考古学的境界、占有面の厳密な輪郭、全runtime部品の網羅 |
| 区域資料と模型の関連 | 11区域は未配置と明示する。出典・相対関係を読め、模型への関連はソフトウェア上の関連として表示する。距離・方向は比較点なしならnull/UNKNOWN | 契約試験とブラウザ項目に既存証拠あり。独立審査候補 | 区域の地理的一致、模型と史料の誤差0mという主張 |
| レイヤー・透明度・制作管理 | A・歴史区域・模型範囲・制作区域・看板を区別し、設定が描画に反映される。制作状態は根拠記録と結び付け、現代の開発表示だと分かる。詳細へ移ると看板が消える | 既存試験は各checkboxの診断値、画面撮影、看板非表示を確認。全レイヤーの描画結果と透明度の一致は追加確認 | 看板を史跡の現場工事や1590年の造物とする解釈、模型の存在から区域全体を完成扱い |
| 詳細3Dへの移動 | 対象模型から既存詳細画面へ移り、模型を再配置せず対応する説明・選択・視点を表示する。失効した要求が新しい操作を上書きしない | 既存ブラウザではnm-baileyの詳細遷移を確認。全リンク先と遅延時の整合は追加確認 | 全区域に新しい詳細模型があるという主張 |
| 直前の視点への復帰 | 保存対象のview・landscape・drama・selected・variant、camera・target・fovが通常観察へ戻る。数値は比較方法・許容差を明示して照合する。再読込や連続操作で古い復帰が新操作を上書きしない | snapshot引渡しの独立controller記録と、詳細viewへ戻るブラウザ試験あり。実アプリの保存値との直接比較は追加確認 | 歩行ループ・定点モードの自動再開、保存対象外の全UI設定の復元 |
| 取得失敗・再試行・旧応答排除 | 503や不正座標を成功した空データとして扱わない。再試行で回復し、旧応答やdispose後の応答を採用しない。既存地形は継続利用できる | 両engineの故障4条件と独立controller記録あり。実ブラウザでの遅延・復帰・連続操作の組合せは追加確認 | browser履歴stress、全競合経路の検証完了 |
| 既存自由歩行への入口 | 既存handlerへ委譲し、地表・障害物・モード切替の既存制約を維持する | ソース接続は確認。Stage 3-Bからの開始・取消・復帰を新規に受入済みとは扱わない | 連続自由歩行の再受入、全城域の通行可能化 |

保存済み模型の対象は `phase3i.glb`、`phase3b.glb`、`phase3i-inner.glb`、`phase3d.glb`、`landscape.glb` です。CAD B0/B1/B2、実行時に生成する植生、旧v0木柵の配置範囲は対象外です。外接範囲の数値一致0mは、史実位置の精度0mを意味しません。

## 今回確認した試験の限界と次の小工程

[ブラウザ試験](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/blob/364afd95e6cc6f2f1899413b4bafd85adda23de9/scripts/stage3b-overview-browser.mjs)は復帰後のviewとoverview非表示を検査しますが、保存前後のcamera・target・fov・選択・比較状態を直接比較しません。[controller記録](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/blob/364afd95e6cc6f2f1899413b4bafd85adda23de9/evidence/stage3b/controller-recheck.json)の「restore saved snapshot」は模擬DOMであり、実アプリの最終復帰姿勢の検証ではありません。これは試験範囲の不足という判断で、実際の復帰不良を再現したという報告ではありません。

[src/castle-overview.js](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/blob/364afd95e6cc6f2f1899413b4bafd85adda23de9/src/castle-overview.js)の画面文言は「3D復元モデルの範囲（軽量表示）」「既存模型の実データ範囲」です。JSONの `runtimeModelAudit` と文書にある対象外一覧は、このUIでそのまま表示されません。限定採用する表示範囲を利用者が判断できるよう、保存済み5 GLB・22模型という対象と、CAD木柵・植生・旧柵を含まないことを画面に明示するのが次の修正候補です。

次の小工程は、上記の表示範囲の明示と、視点・選択・比較状態の直接照合、遅延中の新操作が優先される対照、レイヤーと透明度の描画反映の確認です。大容量メッシュの再生成は不要です。実施する場合は最新mainとの差分を照合し、PR #42へ追加するか別PRにするかを明示してから進めます。この文書PRは製品コードを変更せず、既存PRを分割・更新しません。

## 証拠・CI・保全のゲート

- PR #42 HEADに対応する9 workflowがcompleted/successであることをAPIで再確認しました。[Stage 3-B CI run43424808754](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/43424808754)の16条件＋故障4条件PASS、389単体、22模型・212原本の独立照合は、[最終追補](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/issues/41#issuecomment-6853774253)に記録された結果として参照します。workflow成功から全Stage 3-B受入を導きません。
- artifact `14037775186` のAPIメタデータは84,741,416 bytes、digest `sha256:e3245e2e8bfa739bef43bde2f6dfc382b5cdd1a8408007c40c1b5f793006fa47`、expired=false、期限2027-02-11T12:23:58Z。今回そのZIPを取得・再計算していないため、新規の実バイト保全PASSとはしません。期限付きartifactの存在を恒久保全としません。
- 当該CIはdev配信です。dist本体・dev JS応答bodyが原artifactにないという留保を維持し、production配信受入に読み替えません。Windows正式行列15/16 PASS・1 FAIL、その後のsubset成功、初回CIの導入失敗も置換しません。
- 限定採用する場合も、対象HEADと依存、新mainとの統合、該当機能の試験・正式CI・独立レビュー、重要な未解決P1/P2、保護212原本と証拠保全を別々に確認します。保存後の実ファイル読戻し・サイズ・全バイトSHA-256照合は現行AGENTS.mdの条件を適用します。既存保全PASSの範囲を、未照合のtraceや旧Temp全体へ広げません。
- 今回の文書・静的照合を新たな別担当レビューとは数えません。限定範囲の正式な独立レビューとマージ可否は、具体的な候補HEADに対して別途判定します。

## Stage 3-B全体に残す条件

11歴史区域の史料に基づく位置・境界、独立対応点と残差、runtime CAD/植生/旧柵の配置網羅、browser履歴stress・連続自由歩行、同条件browser性能比較、Blender再読込・GUI、実機Safari・物理touch・VoiceOver・現地確認は、既存記録どおり未受入です。QGISは対象2project・18層のnative headless再読込のみ限定PASSという最終追補を維持します。原図・報告画像の再配布を追加せず、A/B/C/Dを維持します。

歴史区域の位置が未確定でも、入口や保存済み模型の所在を確認する道具は独立した技術成果として審査できます。その採用は「城域全体の縄張りを正確に重ねた」「Stage 3-B完成」の条件を満たすものではありません。性能改善も主張しません。

## 別環境での作業と旧Temp

現在の認可済み作業領域は `/workspace/scratch/228bc9e21ae6`。今回の文書整理前に、Temp空き5,225,709,568 bytes、作業領域空き61,093,531,648 bytesを実測しました。Tempはtmpfs、作業領域はoverlayで、空きinodeはそれぞれ1,275,802・4,084,840。入力はGitHub上のソース・Markdown・メタデータのみで、ローカル文書出力は1 MiB未満を予算とし、依存導入・大型asset複製・ブラウザtrace生成は行いません。

これは旧Cloudと同一実体だと認定した測定ではありません。[旧Temp整理BLOCKED・削除0件](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/issues/41#issuecomment-6867438305)を維持し、旧環境への接続・棚卸し・削除・容量回復は今回の受入整理の前提にしません。新しい製品試験へ進むときは、その実行先の容量・実効Tempを改めて測定します。

この文書変更はREADMEの現在地表示と完成条件の整理だけです。mainへの直接変更、PR #42変更、Draft解除、マージ、Pages公開、旧Tempの削除は行いません。

## 2026-11-14 実装候補の追補

本書上部は文書審査時点の記録として保持します。最新main c0ba33b52を既存PR #42へ通常mergeし、[限定補強記録](stage3b/LIMITED-20261114.md)の実装・試験を追加中。過去HEADのCIと新候補の受入は別判定です。最終原票・正式CI・独立レビュー・保全が未完了の間はPARTIAL／マージNOを維持します。
