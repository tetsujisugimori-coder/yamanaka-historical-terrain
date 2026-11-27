# 西木戸口・共通部品D0試験導入（Issue #65）
- 基準山中城 main 16e22645ee0d0c03926c4e15a753c7e64fb2c450。供給元 castle-3d-parts PR #53、受入済み固定HEAD 090e86ec7e88f49546a246a91d576f4aa4612ba1、YAM-WEST-LEFT-LEAF D0 / D / reference_only。
- 正本は供給元の `cad/stage4b/west-gate-left/spec.json`、FCStd/STEP、`blender/stage4b/west-gate-left-leaf.blend`。山中城にコピーするのは配信用GLBのみ。原ファイル `cad/stage4b/west-gate-left/west-gate-left-leaf.glb`、4356 bytes、SHA-256 `3eced51663e41b05656ab5508769b130265fbd8ce2380ebcd9326cfc68da253d`。既存C GLBの上書きなし。
- D0は六枚の板と二本の横桟を同一平面・20 mmの設計隙間・横桟面接触で組み立てた参考設計。門柱なし。Cの段違い中心列、横桟位置、角落としとの完全互換性なし。
- glTF m、+X幅/+Y高さ/-Z背面。Cの板群中心（E約-190.456、N-33.850）、制作角+0.20 rad、板底=模型支持高+0.05 mに仮配置する。D0板群中心(.86,0,-.065)をこの基準に合わせ、Y回転 π/2−0.20、GLTF→既存世界 E/up/−N。縦倍率は剛体配置後にYのみ適用。史実の寸法・支持・接地・接合・強度・開閉はUNKNOWN。
- 左門扉の定点観察に水色の輪郭を任意重畳。初期OFF、右門扉・現況A・観察地点離脱・D表示解除・描画失効時は消去。元C模型は置換せず、描画・歩行・衝突の既存模型に追加しない。水色は比較用のD演出で遮蔽物越しにも見える。実架設や安全性の意味はない。
- 実GLB取得時に固定サイズ・SHA-256を検証し、実ノード名、D0タグ、8部材の外形を確認してから表示。異常は表示せず、遅延応答は世代番号と現在の条件で拒否。取得先は同一配信元。
- 配信用GLBは `src/assets/west-gate-left-leaf-d0.glb` からViteが同一バイトの独立ファイルとして出力する。D0の表示状態は観察・景観の切替時に同期する。
- 単体試験で原バイトSHA、ノード個数、座標変換、負対照。既存専用ブラウザCIへD0正常/破損応答、C描画と視点不変、右選択時消去を追加。正式CI・保全・独立審査は別判定。現地、実機Safari、物理タッチ、実GPU異常はNOT_TESTED。#55及びStage 3-B全体HOLD。
