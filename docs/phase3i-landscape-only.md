# 景観C/D限定切り出し
基準main 42ed7bbe1b1f839535ed66c76c75d1ade2ce2cc8、移植元PR26 e67f1fc81c38986ccf8170d1942a1894992c0f3a。Issue27。
## 採用
西側 E[-99,-87],N[2,23]m の既存180頂点・418三角形のZ変更（最大約.075m）。XY・indices・境界・現況A不変。
赤土/草/乾草/踏み跡、既存6低木の個体差はD。土・草・通路を区別。D無効時の材質・頂点色復元は既存apply/restoreで維持。
production/phase3i は移植元の編集可能Blender/QGIS/GPKG、生成パラメータと当時の制作記録をそのまま保全。古い制作ログは今回の実行証拠ではない。
新規再生成は別checkoutで行い、今回の証拠はevidence/landscape-onlyに保存する。旧H原本・旧研究証拠は変更しない。
## 分離
src/main.jsはPR26のI資産・説明・モデル分岐を採用するが、performance.js import、performanceLog、timedGLB、geometryMaterials/renderCPU instrumentationを移植しない。
loader.loadAsync・pending cache/retry・同期render・syncConnectedをmainと同じまま保持。遅延描画集約なし。
PR26の性能測定scripts・performance.js・performance tests・CPU/profile/性能原票は元PRに保存し、この新PRには追加しない。旧Hの静的反例main snapshotだけ契約負対照のfixtureとして使用。
phase3f workflowは今回のI景観16条件を検査。旧G/H性能比較は新受入範囲から除外し、元main/PR26に保全。
PR34/35のコードを移植しない。色定数再利用は景観計算の同等性だけを検査し、全体高速化とは主張しない。
## PR34の後続接続
PR34 ee3c3def2565b088c978694469ed86d10d92c75c はPR26をbaseにする。base refの変更だけで統合済みとはできない。
後続の専用branchで本景観版を基準にし、PR34の計測器・イベント境界・診断APIを移植する。今回復元したgetModelのloadAsync境界、geometryMaterials処理、render同期呼出し、walk準備の接続を個別確認する。
計測なし/ありの原票identity・欠測・負対照・負荷を新HEADで取り直し、16条件回帰・独立レビューを実施する。
PR35キャッシュは別検討。PR26/31/34/35のhead/base/状態は本工程で変更しない。
## 判定
技術採用、性能改善、史実確証、実機検証は別判定。性能未立証は維持。
実機Safari/物理入力/GPU内部時間/GUI手操作はNOT_TESTED。headless原本再生成はGUI操作を意味しない。
マージ・Draft解除・Pages公開は禁止。
