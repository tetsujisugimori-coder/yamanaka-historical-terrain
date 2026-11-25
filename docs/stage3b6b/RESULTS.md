# B6b 観測補強・局所結果
開始remote HEAD fb0939bbf81889fdcbf98d3b5b113815950fd636/tree ed06722009ac5cecb635d6e20267c3a93f5d26be。旧local c45b3d95は同treeの別HEAD、別cloneを作り正式remote基準から作業。旧node_modules以外に未提出変更なし。account tetsujisugimori-coder、PR55 Draft、Issue54・review5918337193確認。

## 旧原票の独立再照合・訂正
WebKit2原ZIPの全32件で先行200応答ETag＝304**要求**If-None-Match。304応答ETagは未記録。従前の『200/304応答ETag一致』という読み方は訂正する。同context/page/URL/methodの先行200は各1件、弱ETag、Vary=Originの値一致。旧body失敗32 callにはURL/status/response IDがなく一対一対応UNKNOWN。時刻近接のみで埋めない。Last-ModifiedはHARで分割されるため配列差をserver差と認定しない。

## 変更と局所確認
observer-local request/response ID、context/page、順序/時刻、許可ヘッダー、body採取失敗/保存検証失敗を分離。native IDではない。URL認証情報/queryを除き完全URLのhashで異なる要求を区別。304相関はCANDIDATE_ONLY/UNKNOWNで、実使用byteは常にUNKNOWN。304本文例外、非200、本文不一致を従来どおりFAILにし期待値を緩和しない。
旧実handlerを抽出し同じ合成304例外を渡すとstringだけで相関欠落RED。新observerはstructured記録を保持するGREEN。これは合成APIの対照であり旧WebKitブラウザREDを再実行していない。A〜Hの15合成対照。Gは保存validatorの拒否、Hは非同期完了順の対照であり実GLB障害/製品競合は既存正式runnerで別検証。
初期独立P2-CORR-01はIf-None-Match矛盾/Vary要求値差の誤候補。conditional必須・response ETag矛盾拒否・Vary値比較へ修正、同反例再確認。P3のbodyとpreserve失敗分類も分離。

## 正式ゲート
既存15workflow、push4+PR15=19run。専用2イベント×2engine、正常16+競合128+故障6条件（イベント重複を加算しない）。既存workflow/依存/製品変更なし、追加dispatch/retryなし。局所browserは既存実行バイナリ不在でBLOCKED、無断導入なし。Nodeとbuild/230保護集合不変確認。正式新HEAD結果と原ZIPは提出後確認、現時点PENDING。旧正式FAIL維持、総合PARTIAL・限定マージNO・Stage3-B HOLD。
空き29GB/405万inode、追加証拠予算4GiB。Windows移管NOT_TRANSFERRED、Library保全予定、保持期限UNKNOWN。既存の課金上限$5停止設定は今回変更せず、残額はUNKNOWN。正式CI実行に失敗しても再試行しない。

## 仕様根拠
RFC9110§15.4.5 https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.5 (304に本文なし)。Playwright response.bodyはbufferを返すAPI https://playwright.dev/docs/api/class-response#response-body 。APIの返値をブラウザ内部キャッシュ利用byteの証明へ昇格しない。
