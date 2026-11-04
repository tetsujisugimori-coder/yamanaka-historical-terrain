# PR #6：初期モデル読込み中のカメラ操作によるP2回帰

実装担当の自己検証。独立再レビューは親側の別担当へ引き渡し、成立まではNOT_VERIFIED。Draft維持、マージ推奨NO。最終HEAD・CIはPR本文とIssue #4を参照する。

## 三つの版と反例

- `77b015565b79493a05f45c6d959d459546e21526`：今回の初期操作8条件はPASS。以前のP2-01/P3-01は別途再現済みであり、この結果でそれらを否定しない。
- `bf5c4b66cd74f572b49a2015be571a8105f1f7e1`：初期regional.glbを明示ゲートで保留→canvas上でtrusted mouse dragまたはwheel→実GLB成功／404を解放。Chromium/WebKit各4条件、計8条件がFAIL。成功でもready=false、modelBounds=null、renderState=loading。404でもloadingのまま失敗を隠す。独立担当の指摘をWindows実GLBでも再現した。
- 本修正版：同じ8条件すべてGREEN。4幅×通常/reduced motion×drag/wheel×成功/404×2エンジン64条件に、キーボード／短いtapの8条件を加え計72条件PASS。実GLBの成功はready・実bounds・操作有効、404は明示error・3D操作無効・施設解説利用可能となる。

`evidence/initial-camera/{legacy,defect,fixed}.json` は版別のソースhash、実GLB hash、入力のisTrusted、操作前／入力後／完了後のカメラとstateを保存する。計測はsetView完了カウンターのみ。応答をsleepで遅延させず、入力と応答解放をゲートで順序化する。旧版は初期カメラの巻戻しを許す従来動作、修正版では入力後の視点保持まで検査する。

## 原因・比較・採用方式

前修正はカメラのstartも選択・表示切替と同じ操作tokenを失効させた。初期モデルがまだ存在しない場合、破棄してよい旧表示と、画面を成立させる唯一の読込みを区別できず、成功もcatchも黙って捨てた。初期カメラも読込み後に初めて配置していたため、単にtoken失効を止めるだけでは原点からの不適切な視点になる。

1. 初期入力を全面禁止：回帰を隠し、操作体験を制限するため不採用。
2. 初期成功だけ無条件採用：遅い選択や404の所有権を再び壊すため不採用。
3. **採用：表示・選択の所有権と、カメラ効果の有効期限を分離**。初期モデル前のカメラ入力はcameraRevisionだけを進める。初期モデルの成功／失敗を処理する所有権は維持し、古い既定視点への移動だけを失効する。後続の選択／表示変更は両方を失効し、既存モデルがある場合のカメラ入力は従来どおり古い非同期表示効果を取り消す。

初期await前にメタデータから有効な概略視点を配置する。利用者はその視点を動かせる。モデル成功後はデータを接続しても入力後のカメラを動かさず、入力がなければ実モデルに基づく既定視点を確定する。初期C概略視点の高さだけはC台帳を仮のseedとし、モデル成立後の「近くで見る」や低視点は従来修正どおり実GLB三角形を使う。初期モデル前のtapはヒットテスト対象がないため安全に終了し、drag/wheelはそのまま動作する。

## 負対照・回帰・失敗の扱い

`--label=mutation` はbeginCameraIntentだけを旧来の全失効へ戻す。72条件すべてでloading残留を検出する期待FAIL。ソース変異が適用されない、入力がtrustedでない、pageerrorがある、完了が観測されない場合は成立扱いしない。通常製品へ変異を含めない。

既存P2-01/P3-01の実GLBゲート112観測、Reset取消4条件、修正除去のintent16／height16／Reset4の期待FAILを再実行する。単体21、build、既存GUI・障害・操作サイクル・Pages subpathも再確認し、対応票は従来の`evidence/review-fixes/`と`evidence/phase2a/`に置く。

初回のlegacy/fixed試験起動はsandboxのloopback接続EACCESでブラウザ検査前に終了した。許可された環境で実行し直した結果のみを条件数へ含める。以前のWebKit route.fetch中断の原因UNKNOWNは維持し、変換済みモジュール固定配信という試験方式の変更を原因解消とは呼ばない。

配布subpath初回4条件は、subpath向けbuildをルート設定のpreviewで配信したためJSが404となり、初期化前timeoutでFAIL。`subpath-preview-misconfigured.json`に保存。誤設定と正設定で同じブラウザmodule要求の404/200を再現した`subpath-preview-diagnosis.json`を添える。previewにも`GITHUB_PAGES=1`を与えた4条件はPASS。製品コード修正の効果と混同しない。従来の別件timeout原因UNKNOWNは維持する。

## 再現手順・独立確認

```powershell
npm ci
npm run dev -- --port 4317 --strictPort
node scripts/initial-camera-browser.mjs --label=fixed
node scripts/initial-camera-browser.mjs --label=mutation
node scripts/summarize-initial-camera.mjs
# 配布subpathはbuildとpreview両方で同じ設定を使用
$env:GITHUB_PAGES='1'
npm run build
npx vite preview --host 127.0.0.1 --port 4320 --strictPort
# 旧77b0155は既存の隔離worktreeをVite4319で起動
$env:TEST_URL='http://127.0.0.1:4319'
$env:SOURCE_ROOT='.cache/review-baseline'
node scripts/initial-camera-browser.mjs --label=legacy
# bf5c4b6も別worktree/serverを作り同じSOURCE_ROOTとURLで--label=defect
```

独立担当は同じ成功4＋404の4条件で、新HEADのready/errorと入力後の視点維持を確認する。既存P2/P3・Resetの再確認も合わせる。自己実行とCIは独立確認ではない。

## 保全と留保

現況A・DEM・QGIS・Blender・実GLB・出典など35ファイルbyte非変更。native再生成／再読込NOT_RERUN。B0/C5施設、位置精度・図面残差UNKNOWN、旧QGISクラッシュ／旧読込timeout原因UNKNOWN、実機Safari・VoiceOver・現地・25MB実機負荷NOT_TESTEDを維持。Issue #1/#4/#5 OPEN、公開デプロイなし。
