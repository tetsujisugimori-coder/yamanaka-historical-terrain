export function assessNativeCheck({status,signal,error},details){
 const ok=status===0&&!signal&&!error&&details?.workerStatus==='CHECKS_AND_TEARDOWN_RETURNED';
 return{status:ok?'PASS':'FAIL',exitCode:status,exitHex:status===null?null:'0x'+(status>>>0).toString(16).toUpperCase().padStart(8,'0'),signal:signal??null,processError:error?String(error):null,details:details??null,reason:ok?'Process terminated normally after checks and explicit teardown':'Native process did not finish successfully; printed PASS is not sufficient'};
}
