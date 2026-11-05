# 第3期B P2-01：現況AとD外観の分離

対象はPR #12、旧固定HEAD `5fca33c5f1bf7be66e8b44e33b057b2fea4c5c31`。
追加レビュー5789436339の静的指摘から開始した。実ブラウザの確認完了前に閉鎖と扱わない。

## 表示契約と根本原因

追加Cモデルの可視条件と、D材質・照明の許可条件が別々だった。旧 `syncWestern` のD条件には `comparison === 'restored'` がなく、C+DからAへ移った後も保持された `state.drama` によってDが適用された。

修正では景観が有効、復元C表示、D選択の3条件をD許可条件とする。質感スイッチと品質UIの無効化だけに依存せず、実際のmaterial、shadowMap、light、fog、backgroundを戻す。AはC非表示/D非適用、CのみはC表示/D非適用、C+DはD適用可能、終了時は従来表示へ復帰する。

もう一つの所有権問題として `createSurfaceFinish` は無効時にも元materialのvertexColorsとmeshの影属性を書き換えていた。元materialは変更せず、D頂点色を外したC用materialが必要な場合だけ別cloneを用意する。D有効時のみtextureを設定し、無効時には元shadow flagsとUVを復元する。位置・index・原GLBは変えない。

## 試験方法

`scripts/phase3b-separation-red-green.sh` は同じ検査を旧固定src、新src、修正条件を意図的に欠落させた変異へ適用する。旧srcは実行時に退避/復元し、成果物のsource hashも記録する。通常コードの判定関数をoracleへ流用せず、ブラウザの実material map、light座標と強度、shadowMap、fog、backgroundを直接読む。

Chromium/WebKit × 375/390/765/1280 × 通常/reduced motion。Aへの遷移直後とDスイッチOFF後の同一canvas PNGを完全一致比較する。許容差は設けない。検査用read-only計測をVite応答へ挿入し、旧条件の復活は負対照だけで行う。実browser click、programmatic stale-control dispatch、画面resizeを区別する。実機Safari検証ではない。

単体 `phase3b-finish.test.mjs` は3条件。同じ試験で旧版3 FAIL/exit1、新版3 PASS/exit0。Canvasの代替は所有権試験に限り、実ピクセルの代替とはしない。全36単体とbuildはローカル成功。lint/typecheckは本repoに専用scriptなし。

## 環境上の未実施

この実装環境ではChromiumの起動がOSのsocket拒否で終了し、許可された昇格実行でも同じ制約だった。WebKit取得は公式配布fallbackで成功したが共有library不足。ここでのブラウザ動的再現はNOT_TESTED。GitHub Actionsで新規実行し、その実測とartifactを別記する。CIをまだ実行していない段階の設定を成功と扱わない。

## 保護と留保

既存地形・資料・制作正本・旧証拠を改変しない。既存ブラウザ28条件、旧景観/fallback/固定2断面等は既存CIを維持する。追加検査でもquality、繰返し遷移、resize、1×/2×、終了復帰を確認する。

P3の反復texture、広画面WebKit負荷増、初期timeout原因UNKNOWN、史実位置・構法UNKNOWNを維持。実機Safari・VoiceOver・現地照合NOT_TESTED。Bへの昇格なし。Draft維持、merge/auto-merge/deploy/Issue閉鎖なし。

独立レビュー・最終HEAD CI・artifactの結果はPRと新しい証拠へ追記する。実装・独立検証完了まではP2閉鎖NO、マージ推奨NO。

## 候補7e7e9f9の独立ブラウザ初回実測

実装とは別担当が作成した `independent-review/browser-ad.mjs` をGitHub Actions Ubuntuで新規実行した。旧固定HEADのREDは16条件で80件の想定違反、新版GREENは16条件×9項目＝144 PASS、D照明/霞をAへ戻す故障は16条件で48件の想定違反。全条件の後続工程到達とexecution失敗0を原票から別途確認した。

同一Aモデル・同一カメラ・同一canvas寸法で、Dの設定ON/OFFに起因する旧画像の差は153,424〜518,823画素。新版の16組はdecoded pixel差0、許容差0。PNG生成の成否を画面正しさと取り違えず、実material、灯光、影、霧、背景と合わせて判定した。入力は自動ブラウザのclick/keyboard/mouse API、実機タッチではない。

候補HEAD `7e7e9f94992d862f23470fed57c8e9de328a51e0` のtreeは `39a3de0b189eba4a0939203651b1f5e4e65f4a3e`。PR仮merge `365df0f7` と同treeであることを独立照合した。これはこの候補の結果であり、後続の最終HEADに対する成功を先取りしない。

独立Node所有権検査の当初8項目原票を保持し、追加2項目を含む10項目は別名 `material-ad-10.mjs` と `material-*-10.json` に保存した。固定候補に対する原票は `material-green-fixed-7e7e9f9.json`。自己3単体やブラウザ144項目と混ぜて数えない。

## 検査コード自体の修正と留保

初回の独立ブラウザexpected-failure集約は、意図したA判定失敗の後に処理が中断されても、期待拒否を成功扱いしうる契約の穴があった。初回原票は実際には全後続工程へ到達しexecution失敗0だったため、上記観測は保持できる。独立担当は期待拒否にも必須工程の完了・例外なしを要求するよう集約を補強した。製品の新しい表示不具合とは区別し、初回版はcommit履歴とartifactに残す。補強版を含む最終HEADのCIで再実行する。

自己側の旧/故障検査はA shadowMapの意図した違反を検出した時点でその条件を終了する設計。後続回帰まで実施したとは数えない。新版のみ全工程の成功を要求する。自己CI、補強した独立CI、最終HEAD/artifactの確認が終わるまでは、P2閉鎖と限定取り込みYESを確定しない。最終判断・実行URLはPRへ対象HEADとともに記録する。
