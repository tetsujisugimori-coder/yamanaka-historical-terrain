# 修正前の同条件画像

[元のGitHub Actions artifact](https://github.com/tetsujisugimori-coder/yamanaka-historical-terrain/actions/runs/42125592154/artifacts/13462460071) に同条件before/after24枚と性能試行画像がある。実際に取得しZIPのSHA256を照合し、独立担当が全24枚を目視した。個別画像hashはp2-artifact-provenance.json、比較結果はindependent/visual/appearance-independent-checks.jsonに記録。

画像blobのrepositoryへの追加が承認制御で拒否されたため、拒否された送信は行わず、既存artifactへの正規リンクを証拠とする。元artifactと取得済み画像は保持しており、削除・上書きしていない。Git treeにPNGを保存できたとは主張しない。Artifactの表示期限は2027-02-03T22:56:00Zであり、その後の恒久的アクセスは保証しない。

これらは修正前の画像で、黒い追加地形などP2を含む。修正後の視覚受入には新しい実行と画像確認が必要である。

約1MBの性能raw results.jsonも重複送信せず同じ元artifactで保持する。分析結果と個別SHA256は本repo内に保存。再集計はartifactからperformance/results.jsonを取り出し、`python3 evidence/phase3c/independent/performance/analyze.py <results.jsonのパス>`を実行する。入力パス指定だけを可搬化し、独立集計の計算式は変えていない。
