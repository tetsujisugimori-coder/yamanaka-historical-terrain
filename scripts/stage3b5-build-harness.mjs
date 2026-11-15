/** Build a separate synthetic renderer test app. Never modifies the production bundle. */
import {build} from 'vite';
await build({configFile:false,base:'/',build:{outDir:'.work/stage3b5-harness',emptyOutDir:false,rollupOptions:{input:'tests/stage3b5-harness.html'}}});
