# 5B6b initial independent implementation review

独立node実行：12試験PASS。ブラウザ実行なし。reviewed-source-hashes.jsonに読取版を固定。

## P2-CORR-01: 条件付き要求の矛盾・Vary値を見落とす相関候補

先行200のETag=a/Vary=Origin/要求Origin=a、304の応答ETag=a/要求If-None-Match=b/要求Origin=bを与えると、correlate304()はCANDIDATE_ONLYとする。response ETagを優先するため要求条件の矛盾を見落とす。Vary文字列の一致だけで、指定された要求header値を照合していない。safeHeadersもOriginを保存しない。

これはusedBytes=UNKNOWNおよび正式FAILを変えないが、監査対応候補の誤認につながる。必要な安全なヘッダーだけ保存し、比較できないVaryはUNKNOWNにする。ETagの応答値と条件付き要求を別項目として扱い、矛盾する条件で一致候補を出さないこと。

## P3-OBS-02: 本文採取と保存失敗の分離

response.body()とconsume()が同じcatchでCAPTURE_OR_PRESERVATION_ERRORになる。採取済みなのに保存失敗するとbody.status=FAILになり、採取自体失敗との区別が弱い。別操作段階の記録を推奨。

## 受入範囲

304を無条件PASS化しない設計、request/responseローカルID、metadata失敗時のrunner拒否は妥当。旧32件の一対一対応と使用実バイトは未証明のまま。旧FAIL維持が必要。

## 修正後独立再確認

同じ元反例（Origin/If-None-Match双方矛盾）と、矛盾を一因子ずつ分けた2反例がUNKNOWNになった。正常な条件付き要求はCANDIDATE_ONLYでusedBytes UNKNOWNを保持。15新規試験を独立再実行し全PASS。保存失敗を注入し operation=preserve/validate、本文取得失敗のresponse.bodyとは区別されることを確認した。

P2-CORR-01はこの相関範囲で閉鎖可。P3-OBS-02もoperation分類として対処済み。正式ブラウザ観測・使用実バイトの証明は未実施。この審査は全製品受入や全安全証明ではない。旧handler REDは実コード抽出＋合成応答であり、旧ブラウザREDと称さない。新規のblocking P1/P2は読取範囲では未検出。
