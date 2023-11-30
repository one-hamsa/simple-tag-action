# Read me

Simple action to tag commits

## Build the js bundle and release

Install dependencies

```bash
npm install
```

run the build script

```bash
npm run build
```

## Delete and update the version tag

```bash
git tag -d v1
git push origin :refs/tags/v1
git tag v1
git push origin refs/tags/v1
```
