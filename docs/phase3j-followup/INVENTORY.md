# PR31変更の抽出台帳

元HEAD000fd77、base e67f1fc。12ファイルの元差分を確認。

|分類|ファイル|Aでの扱い|Bでの扱い|
|---|---|---|---|
|計測専用|src/performance.js|単一clock修正済49efから抽出、明示start/endを補強|同一byte維持|
|混在|src/main.js|49efのobserverのみ。shrub cache import/生成/get/diagnosticsを含めない|cacheの4箇所のみ追加|
|最適化|src/surface-support-cache.js, tests/phase3j-support-cache.test.mjs|含めない|元Jから保全抽出|
|分析/計測runner|scripts/phase3j-benchmark.mjs, phase3j-report.mjs|旧再計算用として変更せず保存。新runnerは別名|同じ新runner|
|診断runner修正|scripts/phase3c-performance-diagnosis.mjs, review-fixes-browser.mjs|現在関数名に対応する注入anchor修正を抽出|継承|
|契約試験|tests/phase3j-accounting.test.mjs, phase3j-legacy-diagnosis.test.mjs|旧拒否条件を維持|継承|
|CI|.github/workflows/phase3j.yml|旧I/J専用workflowはコピーせずA/B専用を追加|専用比較job|
|文書|docs/phase3j-performance.md|旧文書を編集せず本台帳から元PRへ参照|専用結果|

Aの追加観測ではlandscapeModelに任意measure callbackを付加し、幾何clone/mergeと材質cloneを分離。戻り値/順序は維持。公開資産・原本・地表アルゴリズムには変更しない。

PR31で本当に最適化された候補は低木支持点の重複raycast再利用のみ。地表索引、三角形探索algorithm、GLBdecoder、材質生成、描画順自体は変更していない。これらを架空の個別A/B成果として報告しない。次候補の優先度は新詳細原票から判断する。
