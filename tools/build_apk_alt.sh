#!/bin/bash
# Alternative APK build when Google's Android SDK download (dl.google.com) is unavailable.
# Tools: Ubuntu packages aapt2 (aapt), dalvik-exchange, zipalign, apksigner, android-framework-res;
#        Maven Central org.eclipse.jdt:ecj and org.robolectric:android-all (compile classpath only).
# Usage: tools/build_apk_alt.sh <ecj.jar> <android-all.jar> <out.apk> [<keystore> <password-file> [alias]]
# Without a keystore the result is an unsigned, aligned APK. Never commit keys or password files.
set -euo pipefail
ECJ=$1; AALL=$2; OUT=$3; KS=${4:-}; PW=${5:-}; ALIAS=${6:-ridleydesk-personal}
ROOT=$(cd "$(dirname "$0")/.." && pwd); SRC=$ROOT/app/src/main
FRAMEWORK=/usr/share/android-framework-res/framework-res.apk
W=$(mktemp -d); trap 'rm -rf "${W:?}"' EXIT; mkdir -p "$W/gen" "$W/classes" "$W/dex"
aapt2 compile --dir "$SRC/res" -o "$W/res.zip"
aapt2 link -o "$W/base.apk" -I "$FRAMEWORK" --manifest "$SRC/AndroidManifest.xml" --java "$W/gen" -A "$SRC/assets" "$W/res.zip"
java -jar "$ECJ" --release 8 -encoding UTF-8 -warn:none -classpath "$AALL" -d "$W/classes" $(find "$SRC/java" "$W/gen" -name '*.java')
(cd "$W/classes" && jar cf ../classes.jar .)
dalvik-exchange --dex --min-sdk-version=26 --output="$W/dex/classes.dex" "$W/classes.jar"
# dx does not desugar lambdas; ART cannot bootstrap LambdaMetafactory -> crash on launch (0.6.12).
if grep -aq 'LambdaMetafactory' "$W/dex/classes.dex"; then echo 'ERROR: classes.dex references LambdaMetafactory (undesugared lambda)'; exit 2; fi
cp "$W/base.apk" "$W/unsigned.apk"; (cd "$W/dex" && zip -q -X ../unsigned.apk classes.dex)
zipalign -f -p 4 "$W/unsigned.apk" "$W/aligned.apk"; zipalign -c -p 4 "$W/aligned.apk"
if [ -n "$KS" ]; then
  apksigner sign --ks "$KS" --ks-pass "file:$PW" --ks-key-alias "$ALIAS" --v1-signing-enabled false --v2-signing-enabled true --v3-signing-enabled true --v4-signing-enabled false --out "$OUT" "$W/aligned.apk"
  apksigner verify --print-certs "$OUT" | grep -E 'certificate (DN|SHA-256)'
else cp "$W/aligned.apk" "$OUT"; echo 'unsigned (aligned) APK'; fi
echo "APK: $OUT"; sha256sum "$OUT"
