# Issue #29: 城内探索CI取消後の未完了試験を限定実行

## 固定原票
- 元PR #56 HEAD: `1061ee060f46e3ac1b1e19766e69d2660223171f`
- 取消run: https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/44650236482
- 旧artifact ID: `14593190397`、GitHub公式ZIP SHA-256: `a40766a6501759c1a7213481623bc50ca40ce3bf637aaf62c343632d07d796a3`
- 原ZIPを読取り専用で確認：35エントリ、CRC不一致なし、ZIP SHAと公式digest一致。16条件は `browser/results.json` で全PASS（ログも全16件終了・画像SHA照合済み）。`safety/results.json` は現行HEADのChromium/WebKit各PASS、計8つの確認文、画像の前後SHA一致。元原票を別保存先で独立再取得したことの証明ではない。
- `negative/results.json` は **旧HEAD `bfea9138b5d973180a9da665484aef1a44f2f8b2`**。今HEADの負対照PASSには流用禁止。`async/results.json` は存在しない。
- workflow `.github/workflows/phase3e.yml` はjob `timeout-minutes: 25`。取消jobの開始 2026-11-20 01:06:41 UTC、終了 01:31:55 UTC。16条件と保存対象1,504件を検証した後に取消が発生。時間上限との整合は強いが、取消を実行した主体はUNKNOWN。

## 今回の変更と範囲
- 旧16条件・安全性試験は再実行しない。未確定なのは**故障反例3件**と**非同期2件**だけ。
- 新規ワークフロー `.github/workflows/issue29-exploration-remaining.yml` で、それぞれ独立したjobとして実施。テスト期待値・process上限・製品コードを変えない。
- 故障反例の原票出力先だけ `PHASE3E_NEGATIVE` で分離。旧 `evidence/phase3e/negative` の履歴を上書きしない。旧検査器の正常/故障条件はそのまま。
- 非同期は既存の`pending-reset`・`404`をChromiumで実行。固定の総job上限25分、操作は420秒以内の補助上限で失敗時は非0とする。元の404/304キャッシュ研究を本工程に再導入しない。
- 各jobは元HEADからの`src`・`public/data`・関連テスト/ブラウザスクリプト・依存固定版の不変を事前検査し、旧原票の対象と製品版の同一性を明示。GitHub PRイベントのmerge-ref `GITHUB_SHA` とcheckoutした `pull_request.head.sha` を区別。
- 各jobのstdout/stderr、exit、検査生データ、HEAD/tree/容量、SHA256SUMSを新規artifactへ収録。収録やmanifestが揃ってもテストPASSと外部保全PASSを混同しない。

## 受入
故障反例は`omit-obstacles`、`permit-moats`、`skip-edge-probes`が各旧仕様を拒否（RED exit 1）、元仕様を受理（GREEN exit 0）し、原ログが存在すること。非同期は`pending-reset`と`404`の2行がPASS、errors空、実観測結果の記録があること。

新HEADの正式CI・新規原ZIPの必要な保存・独立レビューを完了するまで全体PARTIAL、マージNO、Draft、Stage 3-B HOLDを維持する。元取消runを新規成功で上書きしたり、旧未実施を遡及的にPASSへ昇格させたりしない。
