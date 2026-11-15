# Stage 3-B4 事前契約（2026-11-15 JST）

Issue #50。基準main `f6aae9afecad1d7fd55072a9efe5841583c6eb57`、tree `32e7a3c324c49ef332c717ef4e7b17710a3b1158`。新規cloneのclean状態から専用branch。PR48はマージ済み、PR49はREADME/RESULTSの2文書Draft、無条件依存・変更しない。B3履歴に残る未マージは当時の記録。

## 対象と非対象
1972年用地測量・全域図、2012年度現況測量・修復設計の事業記録から、原成果の現存・所在・利用条件を別に調べる。台帳のSEARCH_TARGETは資料の存在登録ではなく調査課題。正式名/番号/所蔵/形態を確認できないものはUNKNOWN。B3の4候補REJECTED、fit/check0、2区域未配置、geometry=null、変換NOT_TESTED、残差null、Stage3B HOLDと座標契約を維持。座標抽出・変換・3D配置・外部問い合わせ送信はしない。

## 判定契約
各対象の存在、現存、所在、閲覧/取得とA〜Fの権利を独立管理する。UNKNOWN/CANDIDATE/CONFIRMEDの三段階、権利はUNKNOWN/PERMITTED/RESTRICTED。CONFIRMEDには対象IDと検査項目に結び付く実読証拠、正式名・資料番号が必要。事業実施根拠を現存根拠に流用しない。一般Web著作権は個別原成果の許諾に流用しない。同一資料/複製の関係も証拠必須、独立資料として二重計上しない。

検査器ができるのは記録構造・相互参照・過大な状態遷移の拒否。出典の真偽や法的許諾そのものを証明せず、実読と独立レビューを別に必要とする。合成正常資料は機械的契約試験のみで実資料確認PASSではない。未知のフィールド/状態、空証拠、対象/用途違いをfail-closedで拒否する。

## 容量・保全
初期空き58GiB/inode約414万（overlay共有）。clone約0.5GiB、公開資料50MiB、局所原票20MiB、CI取得2GiB、余裕3GiBを上限予算。専用`yamanaka-b4-20261115/tmp`を子プロセスTMPDIRとして使用。共有Temp/旧資料の削除なし。原成果の画像/PDFはGitへ追加しない。既存保全済B3原ZIPを再保存しない。今回の原ログ/source/必要CI ZIPは保存後実取得・独立byte/SHA/CRC照合。ACL/保持期限未確認はUNKNOWN。

製品無変更につき追加ローカルブラウザなし。単体→全既存単体/原本確認/build→独立レビュー→最終HEAD CIと原artifact監査。旧成功を新HEADへ流用しない。
