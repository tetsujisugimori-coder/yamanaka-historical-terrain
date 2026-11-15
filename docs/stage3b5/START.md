# Stage 3-B5 開始記録
2026-11-15 23:14 JST。Issue #52、専用branch feat/stage3b5-inferred-layer。
基準main `4b7a11d271cd6018c41ee8d78619fa69a3b8a391` / tree `449d37cedbb08a9cad67945502d6f82ad08365fc`。PR51は14:07:01 UTCマージ済み。旧本文PENDINGと現在のmergedを区別。最新レビュー5911132825では台帳検査器限定PASS・全17CI success・Stage3B HOLD。過去証拠を再実行したとは扱わない。PR49未採用文書に依存しない。
既存B4作業領域を変更せず別worktreeへ分離。既存未提出変更は見当たらず、B5検索Issue0からIssue52作成。対象src/castle-overview.jsの局所統合、専用契約/台帳/試験/CI/文書のみ予定。既存main直接変更なし。

## 容量予算
専用tmpを子processのTMPDIRへ指定。overlay空き58,391,351,296 bytes、free inodes4,130,680（測定時）。input worktree約497MB、public/data71MB。局所+CI証拠予算各2GiB、空き最低4GiBを要求。旧Temp/他案件削除なし。LinuxとWindowsは別、Windows移管実施前に接続確認が必要。

## 事前保全
research/stage3b5/preservation-baseline.jsonに212保護集合、22模型全登録、baseline public/data/production/B2-B4全研究台帳のpath/size/SHAを固定。実行時に対象集合追加・欠落・byte変更を検出。新規専用inferred-regions.jsonのみ許可。既存資料の記述と今回実物を再閲覧した証拠は区別。測量原図の実閲覧なし、外部送信なし。

初回保全器は212集合に含まれるpublic/partsとsrcの列挙を現在集合に足していなかったため、集合比較FAIL。元script/log/exitを局所証拠に保持。保全対象を除外せず集合へ追加して再検査。

## 旧B3/B4検査との整合（実装前設計）
旧workflowは当時の「public/src全無変更」を旧基準から検査する。B5でUI追加が明示許可された専用branchに限り、212原本・22模型・全baseline配信データ/研究台帳の厳格なpath/size/hash検査へ接続する。旧B3/B4 branchでは旧git diff検査をそのまま実行。単体/故障/既存ブラウザ期待値は弱めない。新wrapperと依存ソースを原票へ収録する。B5以外へ無制限に無変更保証を廃止しない。
