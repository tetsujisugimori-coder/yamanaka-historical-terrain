# Yamanaka terrain prototype

Keep measured terrain separate from inferred reconstructions. Do not fabricate coverage, historic geometry, precision, or verification. Never deploy or merge in this task. Preserve all input provenance; raw third-party maps and report images are not redistributed. GIS geometry is EPSG:6676 metres, Blender is east/north/up, glTF is east/up/south. Research terrain remains immutable when simulation data changes.

## Development scope and storage budget（容量を優先した小規模工程）

- PRは原則として1つの区域・施設・部品・検証目的に限定する。分割の判断はコード行数ではなく、Blender・QGIS・CAD・地形データ、GLB、証拠などの**入力・中間生成・出力の容量と再生成負荷**を優先する。全城域の再生成・大容量データの一括再保存を当然視しない。
- 着手前に対象ファイル、入力総量、見込み中間生成量、書込先の容量・inode、必要な安全余裕を確認する。推定できない・余裕が不足する場合は小区域・少数部品に分割し、大量生成を開始しない。変更前後の追加バイト数・ファイル数・主な発生源を記録する。固定のコード行数制限は置かない。
- 編集原本（例：.blend / .qgz / .FCStd / STEP / GeoPackage / GeoTIFF）とWeb配信用GLB、研究資料、試験証拠、再生成可能なキャッシュを区別する。原本の完全性・出典・再現手順は保持し、変更対象だけの派生生成、既存データ参照、必要十分な軽量モデルを優先する。必要な原本や根拠を容量節約のために破棄しない。
- Git履歴へ巨大な生データ・trace・動画・重複した中間ファイルを無条件に追加しない。バイナリの追加前に差分容量と必要性を確認し、編集原本・公開成果物・外部保全物の所在、hash、再生成経路を台帳に記載する。史料画像の配布権限は別途確認する。
- 共有 /tmp の容量・inode枯渇を前提に、許可済みの案件専用一時領域を優先する。Hachibei-Lab Issue #20/#27 と Draft PR #22/#30 の共通運用・検証結果を参照する。ただし未マージ・Linux専用・未検証の仕組みを無条件に適用しない。環境変数を切り替える場合は互換性を確認し、原則として対象子プロセスだけに適用する。共有領域・他案件の無断清掃、既存ファイルの削除・移動・上書き、自動cleanupは禁止する。

## Evidence preservation and mobile-first merge gate（証拠保全）

- 保存経路の優先順位は **(1) 認可済みWindowsローカルへ直接保存、(2) 直接保存できない場合は本人限定ChatGPT Spaceへ保存、(3) SpaceからWindowsへの自動転送もできない場合は利用者が手動で転送**。GitHub Actionsの既存artifactを正規に取得できる場合はその経路も活用する。権限回避や非公開原証拠の公開GitHub投入は行わない。
- 原証拠・未提出成果は元のTempに残したまま、ZIP全体のサイズ・SHA-256・内部ファイル一覧/hash・対象HEAD・生成条件・保管先・アクセス範囲を記録する。Windowsなら保存後に独立読戻しを確認する。Spaceなら所有者限定の共有設定、保存成功、保存物のサイズと照合可能なhashを確認し、可能なら再取得した実バイトも独立検証する。確認できない検証項目は明示してPARTIAL/UNKNOWNにする。Space保存応答だけを全バイト検証済みと呼ばない。
- **WindowsまたはSpaceのいずれかで、当該証拠の所在・アクセス制限・サイズと完全性の確認を満たせば、証拠保全の限定マージ条件は満たせる**。携帯利用時にWindowsへの移管完了を一律のマージ前提としない。Space保全後のWindowsコピー・外付けバックアップは別の継続作業として追跡する。Spaceの保持期間・再取得可能性は未確認ならUNKNOWNのままにする。
- 証拠保全のPASSは製品受入やPRマージの自動許可ではない。変更対象の検証、CI、独立レビュー、未解決P1/P2、史料/位置精度の留保を別判定する。PRは小さく分け、専用branchで提出し、必要なレビューと本人のマージ承認を得る。mainへの直接変更・Draft解除・マージ・Pages公開は個別の明示承認なしに行わない。
