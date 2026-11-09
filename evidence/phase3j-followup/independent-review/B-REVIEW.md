# 工程B 独立最終レビュー

対象HEAD `ef47f1b43a9118f60e5b0f9a7f380ff49342282b`、tree `67fa39fa6eaa7964629822a7d80f6c9a5f443ee0`。基準A `b55431aa8a8407e9ddcf59e24b7fe8f11d6b0e1e`。

**総合PARTIAL。性能採用HOLD、限定マージ推奨NO。** 実装の回帰確認と、全体待ち時間の改善判定を分離する。Aの計測基盤採否をこの結論で上書きしない。

## 原証拠の直接確認

別checkoutへGitHubからコードと保存済み原ZIPを取得した。ローカル48通常+18詳細のZIPは証拠commit0cb2766、SHA256 `7accd9c7e0e447ed418237dbb144957d44bbe86751e0c5d63e21a0aef0ef3290`。公式CIはrun42598198849、artifact13666490123、SHA256 `6a472e6710aad2c8f42aa2f544aa49c18a00efbee9847311371561b91a3684a1`で、GitHub API digestと一致。

全132行の配信build identity、固定順序、完全性、source/asset/runner/analyzer hashとPNGを照合した。独自Pythonの統計・固定seed paired bootstrap・境界イベント走査による区間unionは、提供summaryの全項目と一致。通常48と詳細18は合算せず、外れ値除外0。実原票に加えた18種類の不正データは各集合で拒否された。

|環境・条件|前後A平均の中央値→B中央値ms|変化|対差平均の記述的95%区間ms|改善組|
|---|---|---|---|---|
|local cold|6253.45→6093.90|-2.55%|[-1175.91,+87.69]|6/8|
|local reload|5387.35→5090.95|-5.50%|[-670.01,+982.08]|2/8|
|CI cold|5248.50→5715.40|+8.90%|[+2.87,+687.77]|2/8|
|CI reload|4674.00→5761.05|+23.26%|[-144.05,+1119.62]|2/8|

ローカルreloadの中央値だけを選ぶと短く見えるが、同じblockの対差では6/8組が遅い。双方5%以上短縮、対差区間上端<0、別環境再現という事前条件は未達。共有ホストの大きな順序ドリフトも保持し、キャッシュが全環境で必ず遅いと一般化しない。

低木支持計算の局所短縮は認められる。CI詳細のcoldではA-pre/A-postのinclusive中央値1410.2/1488.0msに対しB442.8ms、reloadでは1587.4/1571.1msに対しB447.5ms。ただし詳細18は別実験であり、全体性能の代用にはならない。wall分類率はlocal94.9491〜98.5911%、CI98.2324〜99.0231%。inclusive値を加算せず、RAFはGPU完了として扱わない。

## 実装・回帰

- Bの差分はcache module・tests・mainの4統合箇所と文書/CI。Aのobserver/計測runnerは同一byte。独立390単体試験とbuildがPASS。再buildしたI/A/BのJS SHA256は実配信原票と一致。
- 正式16条件はrun42598198884、artifact13665869204、原ZIP SHA256 `c17f382bd20f634e7ca59d03fa258223fd105f94abe9f98b7034b85f31ea3f95`。HEAD/tree、19source hash、32PNG hashを独立照合。64固定断面、128案内支持点、160歩行サンプルを原GLB三角形oracleで再検算した。
- A/Bの16条件すべてで、断面・案内座標・部品配置・低木支持座標・品質別triangle/drawcall/geometry数と32PNGが一致。代表的なdesktop Chromium/mobile WebKit画像も目視した。
- 既存public/production/evidence1577件はすべて同一blob。原地形、GLB、A/C/D分離、過去の失敗証拠は不変。
- 投稿前に対象HEADの9 workflows全SUCCESSを直接再確認。Pagesはbuildのみ成功、deploy job129096920356はskipped。未監査の補助workflow原票すべてまで確認済みとは主張しない。

旧独立40+12原票のgzip展開後bytesは元ZIPと完全一致。旧cold -1.55%、reload +1.71%、双方5/10組改善を再確認し、新実験と混ぜない。Hの72%はCPUサンプル比であり、施設wallやGPU内部時間の割合ではない。

調べた変更範囲で未解決P1/P2コード不具合は確認していない。全体性能の受入条件は未達。実機Safari、物理入力、GPU内部時間はNOT_TESTED。Draft維持、マージ・本番公開なし。
