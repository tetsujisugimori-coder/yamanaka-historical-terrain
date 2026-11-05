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
