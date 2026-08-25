#!/usr/bin/env bash
# Bump version, build ONE signed release APK, publish to BOTH GitHub + Firebase.
# Usage:  ./release.sh "what changed"
set -e
cd "$(dirname "$0")"

export JAVA_HOME="$HOME/android-tools/jdk17"
export ANDROID_HOME="$HOME/android-sdk"
export PATH="$HOME/.local/bin:/usr/sbin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

REPO="tolovegrover/rajya"
APP_ID="1:848967463250:android:b59d6ec833b7912df0ca8b"
TESTERS="tolovegrover@gmail.com"
NOTES="${1:-update}"

CUR=$(grep -oP '"versionCode": \K[0-9]+' app.json)
NEXT=$((CUR + 1))
VNAME="0.$NEXT"
sed -i "s/\"versionCode\": $CUR/\"versionCode\": $NEXT/" app.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VNAME\"/" app.json
echo "building v$VNAME (versionCode $NEXT)…"

(cd android && ./gradlew assembleRelease --no-daemon --console=plain | tail -2)
APK="/tmp/rajya-$VNAME.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$APK"

echo "== 1/2  GitHub =="
gh release create "v$VNAME" "$APK" --repo "$REPO" --title "Rajya: Rise of Kings $VNAME" --notes "$NOTES"

echo "== 2/2  Firebase (REST, no login needed) =="
NODE_USE_ENV_PROXY=1 node "$HOME/claudelovegrover.com/scripts/app-distribute.mjs" "$APK" "$APP_ID" "$NOTES" "$TESTERS"

# Every build goes to the standing tester group — nobody needs re-inviting.
node scripts/invite.mjs --sync || echo "note: group sync failed; run 'npm run invite -- --sync' later"

echo "== 3/3  Open testing link (friends join via Google, no email invites) =="
NODE_USE_ENV_PROXY=1 node scripts/app-open.mjs "$APK" "$APP_ID" "$NOTES" rajya

echo "done — Rajya v$VNAME on GitHub + Firebase."
