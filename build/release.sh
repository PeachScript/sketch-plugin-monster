set -e
echo    # move to a new line
echo "Enter release version: "
read VERSION

read -p "Releasing $VERSION - are you sure? (Y/n)" -r
echo

if [[ $REPLY =~ ^[Yy]$ ]] || [[ $REPLY = "" ]]; then
  echo "Updating version number..."
  npm version $VERSION -m "build: release $VERSION 🎉 🎉"

  echo "Building from source code..."
  npm run build

  echo "Creating publication files..."
  zip -rq "./sketch-plugin-monster-${VERSION}.zip" LICENSE README.md *.sketchplugin
  tar -czf "./sketch-plugin-monster-${VERSION}.tar.gz" LICENSE README.md *.sketchplugin

  echo "Done!"
fi
