# B4 結果（2026-11-15 JST）

## 判定
総合PARTIAL。資料事業履歴は確認、原成果の現存/資料番号/所在/閲覧許可/分析許可/公開許可はUNKNOWN。B5実物検証は未着手。台帳技術検証は局所PASS、正式CI・原証拠保存後独立照合はPENDING、限定マージNO（最終HEADのPRコメントで追補）。Stage3B全体HOLD。

## 基準と変更
基準main f6aae9afecad1d7fd55072a9efe5841583c6eb57 / tree32e7a3c324c49ef332c717ef4e7b17710a3b1158。PR48はマージ済み、PR49は独立した2文書Draft。B4専用台帳JSON、検査器、回帰試験、専用CI、PLAN/RESEARCH/RESULTS/REVIEW、README案内1行とLOG追記のみ。製品・B2/B3・原本・模型・lockを変更していない。

## 実測検証
- B4専用59試験PASS（合成正常対照と故障、実台帳のUNKNOWN維持）。全既存を含む551試験PASS。build PASS（既存chunk size警告あり）。CAD import21asset検査成功。
- 保護212原本hash不変。基準との差分確認でproduction/public/src/data/research stage3b/B2/B3不変、22模型含む既存製品ファイル変更なし。
- 最初のnpm ciは既定cache `/home/agent/.npm`作成ENOENTで失敗。その不完全依存状態の全体試験/ビルドも失敗票保持。専用cacheを指定して依存導入成功後に全551・buildを再確認した。通過目的の期待値変更なし。
- 独立レビューで資料番号/許可scope/コピー関係の3誤受理を発見し、同じ合成JSONを保存して修正前受理→修正後意味的拒否、正常受理維持。逆方向の原本/コピー関係矛盾も修正。レビュー範囲とhashはREVIEW.md。
- 製品画面無変更。追加ローカルブラウザ、QGIS、原図座標抽出、位置合わせ、実機はNOT_TESTED。合成試験を実物/史実確認へ流用しない。

## 証拠と留保
専用CIは実行前source（隠しworkflow含む）、実checkout/tree/tool版、各コマンド終了コードと原票を保存し、失敗時もmanifestを生成する。212原本/模型実体は固定Git参照とhashで追跡しartifactへ重複しない。CI成功と原ZIP監査は別判定。今回取得する原ZIPは改変/再圧縮せず保全、後作成局所bundleは補足扱い。旧B3保全済ZIPは重複保存・再監査しない。

## 次の最小条件
1972/2012別の成果品目録・管理番号・保存移管記録・個別許可の確認。文化財課と情報公開制度はRESEARCH.md参照。問い合わせ案は未送信、本人承認が必要。原成果取得だけで対応点/1590年位置/変換受入にはしない。2区域未配置、4候補REJECTED、fit/check0、geometry=null、transformStatus=NOT_TESTED、残差null、EPSG:6676契約不変。

## 2026-11-15 P2/P3独立レビュー追補（新HEADのCIは要別確認）
- 対象review #5910717428。P2: copyOf参照先を単なる探索課題ではなく、存在CONFIRMEDのITEMに限定。P3: existence UNKNOWNと残りのfacts CONFIRMEDの矛盾を拒否。同一合成反例と正常複写対照を追加。
- 正式CI原票のmanifestにはidentity.txtが既に含まれていた。局所の後作成bundleでmanifest外だったものと混同しない。CIにmanifest全ファイル網羅・必須原票・byte/SHA検証を追加。
- 前HEAD `27b0719` の正式17 workflow成功とB4 PR/push原ZIP初回取得のCRC/size/SHA/manifest整合を別確認。ただし修正後HEADへは成功を流用せず、新HEAD正式CI・原ZIPの保存後再取得監査はPENDING。
- 問い合わせを送信しない。1972/2012原成果はUNKNOWN、B3の4候補REJECTED、2区域未配置・変換NOT_TESTED、Stage3B HOLDは不変。歴史的推定位置を今後扱う場合は史実確定と分離しC推定として別契約で審査する。
