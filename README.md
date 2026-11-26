# WhySteps Command Center (live)

The live version of the WhySteps Command Center, served free by GitHub Pages.

This repository holds **page code only**. It has no WhySteps data, no product code and no keys. When the page opens,
it asks for a read-only GitHub key, keeps it in that browser only, and reads the data from the private
repository (H2ONLB/whysteps, branch `cc-data`), checking for changes every minute.

Built from `internal/command-center/` in H2ONLB/whysteps by `tools/build_pages.py`. Do not edit here: change the
source there and rebuild. The Website button opens the private customer-website preview recorded in the data.

three.js (vendor/three) is open source under the MIT licence (vendor/three/r187/LICENSE).
