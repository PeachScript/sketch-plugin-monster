src_path=Sketch\ Plugin\ Monster.sketchplugin/Contents/Sketch/

set -e
echo    # move to a new line
echo "Enter release version: "
read VERSION

read -p "Releasing $VERSION - are you sure? (Y/n)" -r
echo

if [[ $REPLY =~ ^[Yy]$ ]] || [[ $REPLY = "" ]]; then
  echo "Updating version number...";
  sed "s/\(<script src=\".*?\)\(v.*\)\(\">\)/\1v$VERSION\3/g" "${src_path}panel/shortcuts.html" > .tmp_html
  sed "s/\(\"version\": \"\)\(.*\)\(\"\)/\1$VERSION\3/g" "${src_path}manifest.json" > .tmp_manifest

  mv .tmp_html "${src_path}panel/shortcuts.html"
  mv .tmp_manifest "${src_path}manifest.json"

  echo "Creating publication files...";

  rm -rf ./dist
  mkdir ./dist
  zip -rq "./dist/sketch-plugin-monster-${VERSION}.zip" LICENSE README.md *.sketchplugin
  tar -czf "./dist/sketch-plugin-monster-${VERSION}.tar.gz" LICENSE README.md *.sketchplugin

  git add -A
  git commit -m "Release $VERSION 🎉 🎉"
  git tag "v${VERSION}"

  echo "Done!"
fi
