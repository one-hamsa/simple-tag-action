# Read me

Simple action to tag commits

## Build the js bundle and release

Install ncc globally

```bash
npm i -g @vercel/ncc
```

build the bundle

```bash
ncc build index.js --license licenses.txt
```

change the version in package.json and tag

```bash
git tag -a v1.0.0 -m "First release"
```
