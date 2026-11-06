# Local browser startup blockers

Chromium `/usr/bin/chromium` was attempted with Playwright both normally and with accepted `require_escalated` local test execution. Both terminated before page creation with `FATAL:chrome/browser/process_singleton_posix.cc:297 socket() failed: Operation not permitted (1)`. Escalation did not change the sandbox syscall outcome. No local browser verification or screenshots are claimed.

WebKit `/tmp/yamanaka-browsers` failed before page creation because GTK4, graphene, WOFF2, Harfbuzz ICU, hyphen, manette and GLES libraries are missing. Exact failure is retained in `webkit-startup.log`.

Automated browser verification should run in the repository CI's supported Playwright environment. Hardware Safari, VoiceOver, and on-site verification remain NOT_TESTED.
