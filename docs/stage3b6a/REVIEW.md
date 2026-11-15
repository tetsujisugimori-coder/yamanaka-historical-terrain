# Stage 3-B6a 独立レビュー

実装/検査器の作成に関与しない別担当が契約・既存UI/controller/adapter/前回正式レビューを実読。読取時source hashとレビュー原票を別保存。

## 設計・検査器の初期確認
- 入口をclick開始するだけではTab到達の代替にならない指摘を反映し、新contextから実Tabで入口へ到達する検査へ変更。
- 新意図の期待状態を独立にassertしてから旧解放前後の不変を確認。正常順序と遅延順序のcameraが必ず同じになるとは限らず、各意図確定時点の正当性と不変を分ける。
- 旧detail operationとphase3c inner operationのID対応、pending→終端を照合する。
- before-01の接続拒否12行を製品REDと数えない。

## 未完了
実操作の最終原票、全16正式条件、新HEAD正式CI、保存後原ZIPの独立再取得照合はPENDING。自己点検で代替しない。現時点は総合PARTIAL/限定マージNO。

## focus修正の独立局所対照
旧実装のoverview正常順序/遅延順序2件のfocus喪失を原票で確認。同runner SHA9a226225…を保持。独立exact activate関数抽出＋DOM stubで旧body残留→新open復帰、他要素移動済み/旧epoch/非操作元の場合の非奪取を確認。これは実ブラウザ受入とは別の局所対照。before03→after01の実ブラウザ原票は実装担当確認で2RED→2GREEN・他10PASS維持、独立原票確認の再開枠は一時的に確保できずPENDING。

## 提出前の独立原票確認完了
その後枠を確保し、before03/after01/full01/guard-smoke01を別担当が直接照合。同runnerの2RED→同2GREEN・他10維持、Chromium75行の正確な集合と3操作経路、旧overview/inner操作ID・応答順序を確認。各314source、計222 HAR/traceのsize/SHA/内部CRC、画像hashを照合。代表3画像（旧focus反例/375reduced/1280normal）を目視し、狭幅と未配置/UNKNOWN/史料要約と推論の区別を確認。rawtrace375reducedでTab73/ShiftTab20/Space4/Enter13/Escape2および逆リンクclickを確認した。

ガード8Node契約を独立再実行PASS、保護230path/212原本/22模型不変。新blocking P1/P2は見つからず、局所確認PASS。検査員の初回trace method名誤解でキー0件となった記録も保持し、実method keyboardPressで訂正。製品のキー未実行とは扱わない。全画像目視ではなく代表3枚、局所dirty sourceと後保存guard-sourceを正式HEAD sourceと区別する。WebKit/最終HEAD CI/保存後実物再取得の最終監査は引き続きPENDING、限定マージNO。
