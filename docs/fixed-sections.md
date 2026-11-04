# 固定2断面の比較（Issue #7）

提出前の自己検証と、別担当による独立レビューは区別する。Draft維持、マージ・自動マージ・公開なし。最重要条件は実GLB三角形面との幾何的一致であり、歴史的な正確さの証明ではない。

## 出発点と保全

2026-11-04 UTCのGitHub実データでPR #6のmerged=true、merge commit/main `5f54eacea3f9fed702e8caf10a3acda0c243ac14`、tree `b00b45affddc1b05526a7a70365e652478421555` を確認。提出HEAD `2bc1e6fce31123d4d50e56b5132b8ee63754207f` はその親。新規cloneのclean mainから `feat/fixed-terrain-sections`。AGENTS.md、README、関連Issue #1/#4/#5、PR #6本文・独立結果、生成scripts・既存CIを確認。既存LOGファイルなしのため今回LOG.mdを新設。

production、public/data、過去evidence、ATTRIBUTIONは元mainとのbyte比較を `geometry-and-protection.json` に保存。QGIS/Blender正本・DEM・GLB・5施設C・新規B=0を保全。native再生成・再読込はNOT_RERUN。位置精度・図面残差・旧QGISクラッシュ/旧timeout原因UNKNOWN、実機/公開受入は既存Issueへ継続。今回その結論を変更しない。

## 2本の選定と標本

| ID | S→E（ローカル東/北m） | 向き・長さ | 選定理由・測定点（Sからm） |
|---|---|---|---|
| moat | (-66,-10) → (-38,-10) | 西→東28m | N=-10の保存標本と同じ横断線。堀群と外縁を横断。西縁4、堀底10.5、東縁25。左右の縁との差を別々に表示 |
| rampart | (-15,15) → (-45,15) | 東→西30m | N=15の保存標本の範囲内。曲輪平場から西の土塁を越える。曲輪面5、土塁頂部21、外側30 |

`production/phase2a/profiles.json` は `build-phase2a-gis.py` により生成された222点。EPSG:6676のローカルE/N、m、A_1mは元DEM、A_webTriangleはWeb5m三角形、Cはphase2a解析曲面の値。生成コードと保存値・実GLBを照合し、既存phase2a.testは全点のCの対応GLB頂点、A実三角形値を1mm以内で確認する。今回の2線はその標本と対応するが、標本間の解析式補間はGLB面と同一とは限らない。標本は由来と版の照合に活用し、グラフには実GLBとの交線を新しく計算する。古い標本やDEMを今回の独立正解値に使わない。

## 座標、交線と寸法

原点はEPSG:6676 E=44862.121277226666、N=-93478.07235405142、高さ0。Blenderは東/北/上、glTFとWebは東/上/南。既存loaderがnodeのworld transformをgeometryへ焼き込む。断面はこのgeometryの実三角形をローカルの垂直平面で切り、各辺との交点を距離/高さの一次区間へ変換する。全区間端と重なり交差点で分割し、重なる場合は最上の地表面を採用。現GLBは地表専用。鉛直/縮退面は高さ場から除外、範囲外/欠損は区間を作らず、SVGも別subpathで接続しない。三角形内部も厳密な線形面、平滑化・頂点近傍近似・外挿なし。

Aはcastle.glb、Cはnishinomaru.glbの全地表。Cで施設を非表示にしてもグラフは全モデルの比較と明示し、非表示の面上の3D線/点を隠す。3Dが別範囲/切替中/失敗時も状態を明示し、対応線/点は表示しない。3DのS/Eは文字sprite、選択点は白い球。線の位置は面そのもの（高さオフセットなし）。視認のためdepthTestを無効にした補助表示で、遮蔽/見通し解析ではない。

横軸はSからの水平距離m、縦軸は実寸の「モデル基準高m」。個別の基準補正適用UNKNOWNのため絶対標高とは断定しない。数値は0.1m表示、元データの格子間隔やFloat32/PNGの格納桁は測量精度でない。代表点の座標/距離/高さを示し、点間の水平距離と符号付き比高を計算する。堀の左右縁は別の比高。Cの2.5mなどの設計仮定と実面の点間測定を区別する。

グラフはSVG、A緑実線・C茶破線と文字ラベル。全三角形交線を保持して連続面の区間だけつなぎ、破線の読みやすさを維持。軸と凡例は375pxでも常時可読、代表点はグラフを直接tap、または下の44px以上のbuttonをTab/Enterで選択。数値と主要寸法は文章で常時表示。SVGの縦横1mあたりの画素比を計算し、3D誇張とは独立に明示する。ページ内状態のみ、URL永続化・自由断面作成は対象外。

3D誇張1/2倍は実寸プロファイルには一切適用せず、3D line/marker座標だけ高さ×倍率。モデルは既存Promise cacheを共有、断面の選択revisionで古い成功/失敗を捨てる。選び直し/Resetで旧結果を消す。A/Cが揃うまで表/グラフを出さず、失敗は明示して再選択で再試行する。

## 発見した競合と修正

現main由来の誇張handlerがbeginIntentで保留中C要求まで失効させる。regional表示→C実GLB応答保留→断面変更→2倍→成功/404解放で、Cへ移らずregionalのまま、404も見えなくなる。両エンジン×成功/404の4反例を `pending-red.json` に保存。誇張操作をcameraRevisionの更新だけにし、表示要求を維持。`pending-green.json` の同条件4件はC成立/明示errorと2倍・最後の断面を確認。比較controlsはC読込み中から操作できるよう先に開く。古いモデル応答を後のA選択/Resetへ採用するものではない。

## 検証契約と再現

独立数値oracleは `tests/section-oracle.mjs`。raw GLB decode後、各三角形の水平bbox全体を索引化し、点の重心座標で高さを計算する。製品の交線/補間/座標関数はimportしない。各交線端点・中点、密な0.137m照合、共有境界/内部/端点/欠損/鉛直面/重なりを確認。事前許容1mmはFloat32変換と浮動小数計算のための数値許容で、測量/歴史精度ではない。3D Float32描画bufferも同じ1mm以内、距離・水平座標は別に照合する。

通常ブラウザはChromium/WebKit×375/390/1280×2断面×A/C×1/2倍=48観測、既存操作/施設非表示/Reset6件、ゲート成功/404×Reset有無×2engine=8件、計62件。さらに保留Cと誇張の4反例。モデルの完了をinstrumented counterと2描画frameで待ち、固定sleepで競合を成功扱いにしない。自動操作はUIのtrusted click/tap/keyboardを使用し、diagnosticsは読み取り専用。

高さ+0.1m、座標E/N取り違え、3D誇張二重適用の3故障をレスポンスのmoduleだけに注入し、同じoracle/許容差で両engineの拒否を確認する。単体にも同3負対照と欠損・重なりを含む。自己検証の中で独立計算を使うことと、別担当の独立レビューは同じではない。

```sh
npm ci
npx playwright install chromium webkit
npm test
npm run build
npm run dev -- --port 4317 --strictPort
node scripts/sections-evidence.mjs
node scripts/sections-browser.mjs
node scripts/sections-pending.mjs
node scripts/sections-browser.mjs --mutation=height
node scripts/sections-browser.mjs --mutation=coordinate
node scripts/sections-browser.mjs --mutation=double
```

WindowsローカルはPLAYWRIGHT_BROWSERS_PATHをworkspace内tools/browsers、TEST_URLを127.0.0.1:4327へ設定。sandboxでloopback拒否、sandbox外browser→sandbox内serverでもtimeoutとなった試行は製品到達前の環境失敗として保存。OS信頼CAの `--use-system-ca` でbrowser取得、server/browserとも許可された環境で実行。TLS検証の無効化なし。

既存ブラウザscriptsは過去evidenceを上書きしない別cwd（src/index/publicを同一sourceへコピー）で実行し、新規evidence配下に収集する。CIは既存jobを保持し、固定版Playwrightとubuntu-24.04で専用jobを追加、通常/故障/競合の結果とPNGをalways artifactへ保存。新しいsource hashと対象HEAD/treeを票に保存。証拠だけの後続commitは製品hashで同一性を照合する。

## 留保と独立レビュー

実機iPhone Safari、VoiceOver、現地、基準高の個別補正、歴史的配置、完全な見通し、QGIS/Blender native再生成は未検証。WebKit自動操作を実機Safari完了とは扱わない。bundleサイズ警告は既存同様に留保。独立レビューは別担当が提出HEADに対して実行し、特に交線の欠損/境界、隠した施設、2倍時の実寸と描画位置、遅延成功/404・Reset、グラフ直接tapと軸/凡例の可読性を重点確認する。指摘は修正・同条件再確認して追記、自己検証だけではIssueを閉じない。

## 提出時の自己検証結果

正式票は [evidence/sections/submission](../evidence/sections/submission/)、履歴の区別は [証拠案内](../evidence/sections/README.md)。単体26/26、通常ブラウザ62/62、C保留と誇張4/4、Pages相当の新断面8/8、既存回帰248/248がPASS。高さ+0.1m16件、座標誤り16件、二重誇張2倍8件を具体的な幾何エラーで拒否、影響しない1倍8件は受理。集約の正常/欠落/破損/条件不足/source違い/HEAD違いの6対照も期待終了を確認。幾何735点の最大誤差1.1369e-13m、3D描画buffer最大0.000024414063m、許容は双方1mm。元mainの制作正本/データ/過去証拠156ファイル保全PASS。

堀の今回測定は西/東の比高がA約1.9/2.6m、C約1.4/1.4m。土塁対応点と曲輪対応点はA約-5.4m、C2.5m、水平16m。代表点名はC形状に基づく対応位置であり、Aの同位置が実際の堀底/土塁天端であるという認定ではない。点の座標と符号を併記している。

追加の再現command：`node scripts/sections-summary.mjs`、`node scripts/sections-summary-controls.mjs`、`GITHUB_PAGES=1 npm run build` 後にsubpath previewを4320で起動し `node scripts/sections-subpath.mjs`。補助検査は既存依存だけを使用し、新規packageなし。CI・提出HEAD/tree・独立担当の結果はDraft PRへ記録し、後から自己検証票を独立結果へ改称しない。

## 独立指摘への修正（P2-01 / P2-02）

別担当は提出7e79e63を別cloneで検査し、幾何と既存回帰はPASS、次の2点をP2としてchanges requestedとした。独立承認ではない。元の独立報告と失敗票は改変せず保全し、今回の修正後自己確認と分ける。

P2-01：断面表示→実moat-study.glb応答を保留→断面教材へ切替→nm-moat施設選択で取消→旧200/404解放。両engineの4件でready=trueなのに線0/点0、説明が「3D切替中」のまま。beginIntentがcurrentModelのreadyだけを戻し、断面syncとreconstruction controlsの復帰を行わなかった。現在の表示を復帰するrestoreCurrentPresentationを1経路へまとめ、model/readiness/説明/断面/controlsを現在のstateから同期する。古い非同期要求を採用したり、その視点を適用するものではない。

実装担当も未修正の同4件を再実行して4 FAIL（終了1）を保存。修正後は施設選択直後と旧応答完了後の両方で線672値/点3・対応する面高さ・controls・説明・最新選択/カメラを照合し4 PASS。復帰処理を除去した負対照は同4件を「Section presentation missing after cancellation」で拒否。単なる通信エラーは負対照成功に数えない。

P2-02：点名はC形状で選んだ対応位置なのに、展示内ではA自身の堀底/天端と誤読できた。Aの断面最低値はS+16mで569.669983m、Cの堀底に対応するS+10.5mはA570.313007mであり、同一ではない。新たな極値計算や位置の置換は行わず、点/寸法の直前に常時表示の定義を置き、buttonと選択文に「C」「対応する水平位置」、Aの寸法に「同位置間の比高」を明記。A自身の最深部/最高部や実遺構の認定でないと説明する。折畳みの説明やGitHubを開かなくても読める。元の独立指摘4例を自己再現し、修正後の両engine×375/390/1280×2線12例で、定義の可視性/折畳み外/keyboard focus/横超過なし、旧提出と全プロファイル一致、1/2倍の数値不変を確認する。

新規証拠はevidence/sections-review-fixes/。取消の同条件runnerはscripts/sections-cancel-browser.mjs、定義の可視検査はscripts/sections-labels-browser.mjs。SECTION_REVIEW_EVIDENCEで出力先を指定する。CIにも正常/復帰除去/常時定義を追加。旧試行や独立報告を修正後PASSへ書き換えず、同じ担当の独立再レビューを待つ。
