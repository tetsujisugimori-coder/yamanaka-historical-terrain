# 施設と史料・確実性

第2期Aの追加5施設と旧westアンカーの再検討は [第2期A台帳](phase2a.md) と `public/data/nishinomaru.json` を参照。新規形状はC、B形状0。以下の第1期断面教材・概略アンカーは履歴として保全し、本期の測量根拠へ転用していない。

元の地図・図面のトレースは未実施。概略アンカーは地点を案内するためのもので、遺構境界や測量標杭ではない。数字の小数桁は計算上の格納桁で、位置精度ではない。

| 対象 | 区分・根拠 | 反映した範囲 | 留保 |
|---|---|---|---|
| 広域4×4kmの山地 | A：国土地理院DEM5A PNGと欠測部DEM10B | 現況標高、谷・尾根・斜面。Web20m | 測量年・個別の標高基準改定はUNKNOWN。戦国期の地表ではない |
| 城域1×1.1km | A：DEM1A PNG。36タイル全有効 | QGIS1m、Web5m現況地形 | 微細な堀・土塁をWeb格子から確定しない |
| 城の案内地点 | Aの地形上に位置精度UNKNOWNの案内 | 経緯度138.99242,35.15640。現況標高を表示 | 本丸等の正確な境界や基準点という意味ではない |
| 西ノ丸・障子堀 | C：三島市郷土資料館、第453号、2026年9月 | 発掘時の一例の畝上部約35cm・深さ1.8m・斜面約58°を独自教材へ反映 | 7m間隔、全体寸法、向き、30m教材配置は説明用。全障子堀へ一般化しない |
| 公園整備後の障子堀 | Aの説明、上記市資料 | 保護盛土・芝・安全な管理用の平たい畝と発掘時の差を文章で表示 | 公園を戦国期の形状と同一視しない。写真・図面は転載しない |
| 岱崎出丸方面 | Cの案内。文化財課概要・保存活用計画p65–67 | 南へ延びる尾根と視界を観察する概略地点 | 曲輪・虎口・土塁の形状、門柱位置は未実装・UNKNOWN |
| 箱根越えの交通 | D：保存活用計画p63の交通路を取り込む立地の説明 | 三島側と箱根側をつなぐ方向関係を模式線で説明 | 戦国期道路・現存旧東海道の正確な中心線ではない。現況道路地図として使わない |
| 1590年の戦闘 | 市文化財課の2026年2月更新概要 | 日付・小田原西方防御・短時間で落城と伝える背景 | 攻城経路、兵力配置、戦術の実証シミュレーションは未実装 |
| B：史料に基づく遺構全形復元 | 未実装 | UIの分類とデータ契約のみ | 地理参照可能な発掘測量図と基準点の利用条件・精度確認が必要 |

保存活用計画は三島市教育委員会、2023年3月10日発行（原本奥付確認）。p63の立地、p65–67の施設説明を参照。市の画像・PDF・本文全文をWebやリポジトリへ配布しない。

出典URL・年・条件は `public/data/sources.json` と `ATTRIBUTION.md`。地形処理したファイルと原URL・SHAは `evidence/gis-build.json` で追跡する。

## Phase3D candidates (2026-11-07)
dc-gate, dc-fence-north/south and dc-rail-north/south are C design assumptions. Existing exported triangles are read-only. Positions, dimensions, joinery and historical existence remain UNKNOWN. No new primary evidence. Bounds/clearances are model constraints only. Finish is D, disabled for A. See production/phase3d/design.json and docs/phase3d-results.md.
