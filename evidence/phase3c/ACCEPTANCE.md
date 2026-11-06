# 第3期C 受入条件と確認経路

この表は証拠への索引であり、CI未完了項目をPASSにするものではない。最終判定は `docs/phase3c-results.md` とPR本文を参照する。

| 要件 | 実装・制作 | 独立/実行証拠 |
| --- | --- | --- |
| 見張台・土橋・虎口 | `public/data/phase3c.json`、`phase3c.glb` | `geometry/report.json`、`independent/technical/v2-geometry.json` |
| 施設同士の関係・視線差 | 近接する高所、32mの通路、同じ土塁裏を外内から比較 | `geometry/relationships.json`、独立 `v2-rays.json`。幾何検査は画像確認の代替ではない |
| A/B/C/Dと史料・モデル寸法の分離 | 全新形状C、外観D、根拠不足のB昇格なし | `independent/history/REPORT-v2.md`、同 `delivery-check-v2.json` |
| 原本保護 | 旧GLB/DEM/native/証拠は無変更、別名保存 | `preservation.json`、独立 `immutable.json` |
| 編集可能正本・再読込 | `production/yamanaka-phase3c.blend`、`.qgz`、再生成scripts | `native/standalone-reproduction.json`、独立 `standalone-packaging-review.json`、`v2-qgis.json` |
| 実地表と低視点 | 8地点、実三角形の支持から物理1.7m、固定位置で方向変更 | `tests/phase3c-observation.test.mjs`、CI `phase3c-browser` / `phase3c-independent-visual` |
| 比較不能時に理由を表示 | AとCで支持差が0.25mを超えると固定カメラのままcanvasを隠して説明 | 同ブラウザ証拠。無根拠な高さ補間は行わない |
| D外観と所有権復元 | メッシュ別geometryコンテナ、UV/material/index参照復元 | `finish/` の旧RED・新GREEN・故障再投入、独立 `ownership.json` |
| 反復質感と同条件画像 | 多尺度土模様・木目、70m斜交UV | CI `phase3c-appearance-performance`。改善の定性的判定とA不変の0画素検査を混同しない |
| 断面・旧施設・1x/2x | 既存の実GLBは無変更。内側targetの標高表示は1x/2xを明示計算 | `sections/`、独立 `v2-target.json`、既存回帰CI |
| 404・遅延・連続切替・WebGL不能 | 独立遅延読込、旧西側地表依存、HTML説明 | 新旧ブラウザCI。欠落旧地表依存guardの故障再投入あり |
| 性能 | 同一runner・画角・600px地形panel、2engine×2width×2version×3quality×3trial | CI `phase3c-appearance-performance`。72試行予定、実績件数は結果JSONで確認 |
| 独立レビュー | 史料、3D技術、ブラウザ視覚の3担当 | `independent/history/`、`technical/`、`visual/`。対象hashと適用範囲を個別記録 |

## 判定しないもの

実地の安全な歩行、1590年の確定形状、防御効果の定量化、実機Safari、VoiceOver、現地照合、持続FPS、GPUメモリはこの自動検査から認定しない。土橋のモデル勾配は最大約0.498m/m（約26.5度）と急であり、歩行/アクセシビリティの保証ではない。
