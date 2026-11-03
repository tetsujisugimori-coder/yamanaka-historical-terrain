# 設計判断と次期開発

## 技術の比較

QGISは既存の3.44.10を使い、ProcessingとGDALで再現可能な地理処理を行う。単にQGISでファイルを開いただけという成果にはしない。DEMの基準をGeoTIFFへ固定し、編集正本のプロジェクトを保存。

Blenderは土の断面を地形と同じm単位で編集・保存できるため採用。WebへglTF2.0を書き出す。DEMを起点にしない手作りの山CGは採用しない。CADの省略理由は再現手順参照。

WebはThree.jsの小規模な局所座標シーンを選択。Cesiumの地球規模タイル・認証・実行時DEM依存や、MapLibreの道路基図中心の構成は今回の限定地形教材には過剰。Web閲覧時の外部地図API・外部フォントを不要にし、オフラインで保存データを読める。GLBは3種を必要時に取得し、1つのレンダラーだけを使う。通常はイベント時のみ描画し、連続アニメーションを行わない。DPR上限1.5、現況8万／8.8万三角形、教材約20.3万三角形。

スマートフォンは地形の次に解説を縦配置する。canvas内は1本回転・2本パン／ピンチ、canvas外はページスクロール。視点・ズーム・施設選択にはHTMLボタンを用意し、キーボードだけでも操作できる。reduced motionの有無によらずカメラは即時変更し、強制アニメーションをしない。WebGLが作れない場合も解説・出典を読む経路を残す。

状態はブラウザ内の一時状態のみ。個人情報・位置情報・外部AIサービス・APIキーを使わない。URL共有状態と保存履歴は未実装。素のES modulesとThree.jsで足りるため、Reactやサーバー、DBは導入しない。

## 将来のシミュレーション契約

研究正本 `production/gis/` とA地形は読取り専用の入力として扱う。ゲーム側で段差をならしたり地表を動かしたりする場合は別の派生データと変更履歴を作る。

将来のデータ構造は次のように分離する。現時点では戦闘経路や領域を測量済みとして埋めない。

```text
research/
  terrain: {crs, origin, units, verticalDatumStatus, sourceHashes}
  facilities: {id, geometry, category:A|B|C|D, sources, accuracy, unknowns}
simulation/
  researchTerrainHash
  traversal: {cellSize, slopeLimit, costModel, assumptions}
  regions: [{id, facilityId, polygon, sourceCategory}]
  connections: [{from,to,width,gateId,status:known|inferred|unknown}]
  obstacles: [{facilityId,passable,status}]
  strategicPoints: [{position,role,reason,category}]
```

経緯度をそのままメートルの移動距離とせず、EPSG:6676と同じローカルm座標を使う。曲輪領域、虎口接続、通行可否、攻守重要地点は次期資料照合後に追加。史料から分からない門幅や通路をゲームのために史実へ昇格させない。

## 次期の優先順

1. 発掘報告書・測量図の権利と精度を確認し、基準点を使って地理参照。位置残差を記録し、最初の曲輪・土塁・虎口1区域をB/Cに分けて制作する。
2. 公園整備の地形と発掘時の断面を同じ観察視点で比較できるようにする。今回のC教材の配置を確定復元へ置換できる設計を保つ。
3. 現地・実機iPhone Safari・VoiceOverで操作、太陽光下の文字、熱負荷、メモリ解放を検証する。
4. 標高データの測量時点・改定適用を調査し、現況の地理的な外部標高検証を増やす。
5. 上記が揃ってから通行領域と門接続のグラフ、攻守地点を別のsimulationデータへ追加する。本格ゲームはその後。

公開repoは研究共有のため。Webデプロイとマージは独立レビュー後の別判断。無関係な他作品の変更は含まない。
