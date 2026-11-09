# PR36 景観C/D限定切り出し 独立最終レビュー

実装担当とは別にGitHubコミット、原本再生成、独立幾何計算、原CI ZIPを確認したレビュー。

対象HEAD: 9e29d737f56f606df9688874b9510490dbce54e7
対象tree: ee91f0f2742b9686ad40b001864b0408251dbbfa

## 判定
- 総合PARTIAL。景観限定の技術受入PASS、限定マージ推奨YES。実機・史実・性能の未検証範囲は残る。
- 性能改善は未立証のまま。景観受入と連動しない。
- 推定C・演出Dを維持。実機Safari、物理タッチ、GPU内部時間、Blender/QGIS GUI操作はNOT_TESTED。

## 実装から独立した検証
GitHubから対象コミットを独立取得した。製品コード・既存証拠は変更せず、独自GLBデコーダとNumPy連立一次方程式による高さ計算を使用。

1. GLB 473792三角形のXY対応照合で、変更418三角形・180頂点を確認。変更は指定区域のic-bridge.surface.grassに限定され、XY・トポロジー・区域外を保持。GLBエクスポート時のindex配列順は同一でない。
2. 区域外高さ、単位相違、NaN、反転windingの独自故障注入4例をすべて拒否。
3. 固定断面を含む876点・木柵支持5点を独立計算。最大差1.1368683772161603e-13m。
4. 3316affで原本再生成を実行。最終HEADとの差分は文書・hash対象追加・浅いcheckout対応テストのみで原本/製品/再生成コード同一。公開GLB・metadataはbyte一致。旧main1777パスは『再生成の前後』で不変。PR全体がmainの全パスを変更しないという意味ではない。
5. ネイティブ原本等13ファイルはbyte非一致。GPKG差は保存時刻、QGISはUUID・属性順・デフォルト色等も差分となりPNGも変化する。Blender保存もbyte同一保証しない。公開ジオメトリの一致とネイティブ保存の決定性を分離した。
6. 最終HEADで単体322 PASS・build PASS。独自ブラウザprobeのChromium390/1280はA/C/D復元・同期誇張表示にPASS。ローカルWebKitは依存不足で起動不可のためNOT_TESTED、実行exit1の原票を保持。

## 計測・最適化からの分離
src/main.jsには新しいperformanceLog、timedGLB、renderCPU、計測モジュールの導入がない。同期render・GLB読込・既存の非同期選択保護が保持されている。PR35の低木支持点キャッシュも混入していない。

旧phase3c-performance.mjs等はmainから変更されておらず、CI内での外部計測は製品計測コードの混入ではない。ただしhash一覧がH資産のままのため、現在表示されるI資産の完全な同定根拠にできない。この旧比較を今回の性能改善や景観受入の立証に使わない。新phase3i受入検証器はI資産、景観ソース、最終HEAD/tree/hash、16条件とPNGを対象にしており分離可能。

PR34の後続統合にはsrc/main.jsのI資産選択と同期描画を維持して計測境界を再接続し、最新I資産hashで別に再実測する必要がある。旧性能の数値をそのまま採用しない。

## 指摘
P3：indices不変と読める説明を、XY/トポロジー保持・index再順序可へ訂正する必要があった。最終HEADで修正済み。
現在までに未解決P1/P2は検出していない。最終CI原ZIPの独立照合を完了した。

## 最終CIと失敗修正
旧86871faのPages build-onlyが浅いcheckoutでgit show依存テストに失敗した。製品変更ではなくテスト可搬性の局所修正として、mainのsrc/main.jsとbyte完全一致の既存snapshotをSHA256固定して参照する方式へ変更した。独立Gitなし環境で旧RED(exit1)、新6試験GREEN(exit0)、baseline改ざん拒否(exit1)を確認し、拒否条件の弱体化がないことを確認。最初のレビューハーネスで必要な既存テストファイルをコピーし忘れたENOENTは別の失敗原票として保持し、製品不具合に数えない。

最終9e29で独立単体322 PASS / 0 SKIP、build PASS。最終CI7 workflows成功。Pagesのbuildは成功、deploy jobはskippedで公開成功とは扱わない。western最終回帰2 jobsもsuccessを確認。

正式16条件原ZIPを独立照合：16条件、32 PNG、20ソースhash、断面64記録・観察支持128記録・木柵支持320計測、trusted keydown16・walk move160、既存保全1536パスのgit blob一致を確認。製品検証器に加え独立audit_ci.pyでもHEAD/tree/hash/画像/測定整合を確認した。代表WebKit390 D画像と旧実行のChromium1280画像を目視した。旧86871fa ZIPと最終9e29 ZIPは別々に保全・判定した。

- [最終16条件CI](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982317)
- [原ZIP artifact 13678681247](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982317/artifacts/13678681247)
- ZIP SHA256: 10e73eb0e72ea726229ae73b5f2d6759f4116c3bd8927c70a11780fc61860594
- [最終western回帰](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982648)
- [Pages build-only](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42621982309)
- [証拠専用ブランチ既保存commit](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/tree/053465eb479700ee5de35af628af32e99d8b6e96)

## 残存制限・引継ぎ
実機Safari・物理タッチ・GPU内部時間・ native GUIの手操作・史実の確証は未検証。原本再生成はヘッドレスでありネイティブ保存byte一致を保証しない。景観採用は性能改善未立証と独立で、PR34の統合時は計測境界・I資産hash・同期描画を改めて確認する必要がある。

未解決P1/P2は検出していない。COMMENTレビューとして限定採用を推奨するが、マージ判断はユーザーに委ねる。マージ、Draft解除、Pages公開は行わない。景観限定PASSは第3期I全体・史実確証・性能改善の完成を意味しない。
