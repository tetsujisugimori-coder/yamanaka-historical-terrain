# Stage 3-B5 事前受入契約

2026-11-15 JST。基準main `4b7a11d271cd6018c41ee8d78619fa69a3b8a391`（PR51マージ済み）。本契約は製品実装前に固定する。Stage 3-B全体HOLD。A現況、B根拠ある復元、C推定、D演出の区分を変えない。

## 根拠と候補採否

今回読んだものは既存 `research/stage3b/regions.json`、`source-georeference-ledger.json`、B2/B3/B4台帳と研究記録。保存活用計画の過去実閲覧記録を参照したのであり、今回原PDFを再閲覧・測量したとはしない。原資料の図・本文を再配布しない。各資料の位置・名称に関する直接記述（過去の要約）と、今回の候補生成可否の推論を別フィールドに保つ。

11区域は個別に評価し、今回の採用候補は0。各区域の理由を `research/stage3b5/ledger.json` に固定。本丸、二ノ丸、北ノ丸、元西櫓等の相対位置記述は数値座標を一意に決めず、三ノ丸・南櫓は現敷地/地形から境界を逆算できない。岱崎出丸の総称、ラオシバの未調査、西木戸の相対範囲も単一座標境界を作る根拠ではない。西ノ丸・西櫓はB3の4対応点REJECTEDを維持し、模型座標や修復施設の輪郭を代用しない。

最低条件は追跡可能な資料と該当箇所、直接記述と推論の区別、座標を得た出所、境界を生成した再現可能な手順、その条件がこの区域を支える理由、矛盾/不足の明記。地理参照できない相対関係や模型への見た目合わせだけでは不足。資料存在・利用条件UNKNOWNを暗黙に許可へ変えない。精度はUNKNOWN/null、実資料変換NOT_TESTED、残差nullを維持。現在の描画範囲は精度範囲ではない。

## データ・検査API

`validateInferredRegions(data, {allowSynthetic:false})` は正常データを返し、不正なら理由付き例外。`schemaVersion=1`, `dataKind=REAL_RESEARCH`, `crs=EPSG:6676`, `unit=m`, `axisOrder=E,N`, `defaultVisible=false`, `displayOffsetMetres=4`, `stage3B=HOLD`。sourceにはid/title/https URL/recordPath/recordSha256。各11区域はregionId/candidateId/name/status/geometry、sourceRefs(id,locator)、directStatement/statementBasis/inferenceProcedure/decisionReason/limitations、geometryBasisを持つ。名前と区域ID、候補ID、出典IDを検査する。

`UNPLACED` はgeometryとgeometryBasisがnull。`ACCEPTED_C` は技術的な描画候補で史実認定ではなく、非空根拠・手順・coordinateSourceRef・単一閉Polygonが必要。無限数、重複点、退化、自己交差、穴・複数ring・範囲外は拒否。座標生成が未実施の今回の実台帳では全UNPLACEDとし、採用に必要な事実を生成しない。歴史的位置UNKNOWN・精度UNKNOWN/null・変換NOT_TESTED・残差nullを検査する。

合成データは`SYNTHETIC`と明記し、本番は拒否する。試験専用harnessだけ明示`allowSynthetic:true`で同じvalidator/rendererへ渡す。本番の実区域推定描画を合成成功からPASSとしない。採用状態のスキーマ検査は資料の真偽や許諾の自動認定ではなく、独立の根拠審査を必要とする。

## 表示・状態契約

- 独立レイヤー、既定非表示。既存区域/模型/地形へ書き戻さない。色＋破線＋「推定C」文字で識別。
- 切替箇所・凡例・詳細に推定、史実位置未確定、精度不明、範囲は精度保証でない旨を常時確認可能にする。
- 単一地域の選択は候補IDで対応、未配置は理由を表示し形状を描かない。関連模型往復は既存詳細・俯瞰復帰処理を維持。
- 初期idle（ON時取得開始）/loading、ready-with-candidates、ready-empty、invalid、load-errorを区別。再試行は新世代要求を開始、旧世代応答は採用しない。OFF時はinflight世代を失効し、旧応答を採用しない。読込済みは切替だけ、retryは前data/形状を消して最新要求優先。非表示へ切替後の応答で勝手に表示しない。失敗しても既存地形・模型を止めない。
- 形状はEPSG:6676 E,N metresから既存原点を引き、Web x=E-E0, z=-(N-N0)。高さは現況DEMサンプル＋4mの描画調整。これは歴史的標高/精度ではない。DEM外や非数高さは描画しない。実区域0件なら埋没/ちらつきの実区域確認もNOT_TESTED。
- 切替・再試行は元ボタン/checkboxを再生成せずフォーカス維持。一覧選択はボタンへフォーカス維持。閉じる/俯瞰復帰は既存入口へ戻す。Tab/Enter/Space操作、状態通知、狭幅・Reduced Motionを検査。

## 正常・故障・回帰

正常：実台帳11未配置、合成採用Polygon、精度UNKNOWN/null。故障：根拠/locator欠落、未知区域・名前不一致・重複ID、CRS/単位相違、不正形状、未配置にgeometry、根拠なし採用、0m偽精度、残差0/変換済み偽装、合成データ混入。故障は意味的理由で拒否する。

本番buildをChromium/WebKit ×375/390/765/1280 ×通常/Reduced Motionの16条件で確認。既存地形/模型、OFF初期、ON未配置11、恒常警告、個別理由、反復切替・詳細往復・視点復帰、HTTP失敗→再試行、不正データ、遅延旧応答を確認。合成描画は別harness・別結果。実区域の推定表示は候補0につきNOT_TESTED。試験失敗/未実施を保持。

212原本・22模型は管理台帳から対象集合を固定し、開始/終了のpath/size/SHA-256と集合差を照合。既存B2/B3/B4研究台帳も不変。正式CIは最終HEADの結果を確認、実装者と別の根拠/表示/原票レビュー、原ZIP保存後再取得・独立全byte/hash/CRC/manifest照合を分離。どれか未完ならPARTIAL・限定マージNO。Draft解除・マージ・公開なし。
