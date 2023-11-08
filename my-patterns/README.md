# my-patterns

This directory can be used to save your own patterns, which then get
made into a pattern swatch.

Example: <https://felixroos.github.io/strudel/swatch/>

## deploy

### 1. fork the [strudel repo on github](https://github.com/tidalcycles/strudel.git)

### 2. clone your fork to your machine `git clone https://github.com/<your-username>/strudel.git strudel && cd strudel`

### 3. create a separate branch like `git branch patternuary && git checkout patternuary`

### 4. save one or more .txt files in the my-patterns folder

### 5. edit `website/public/CNAME` to contain `<your-username>.github.io/strudel`

### 6. edit `website/astro.config.mjs` to use site: `https://<your-username>.github.io` and base `/strudel`, like this

```js
const site = 'https://<your-username>.github.io';
const base = '/strudel';
```

### 7. commit & push the changes

```sh
git add . && git commit -m "site config" && git push --set-upstream origin
```

### 8. deploy to github pages

- go to settings -> pages and select "Github Actions" as source
- go to settings -> environments -> github-pages and press the edit button next to `main` and type in `patternuary` (under "Deployment branches")
- go to Actions -> `Build and Deploy` and click `Run workflow` with branch `patternuary`

### 9. view your patterns at `<your-username>.github.io/strudel/swatch/`

Alternatively, github pages allows you to use a custom domain, like https://mycooldomain.org/swatch/. [See their documentation for details](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

### 10. optional: automatic deployment

If you want to automatically deploy your site on push, go to `deploy.yml` and change `workflow_dispatch` to `push`.

## running locally

- install dependencies with `npm run setup`
- run dev server with `npm run repl` and open `http://localhost:4321/strudel/swatch/`

## tests fail?

Your tests might fail if the code does not follow prettiers format.
In that case, run `npm run codeformat`. To disable that, remove `npm run format-check` from `test.yml`

## updating your fork

To update your fork, you can pull the main branch and merge it into your `patternuary` branch.
