#!/bin/bash

if [ -d "$HOME/.cabal/bin" ] ; then
    PATH="$HOME/.cabal/bin:$PATH"
fi

# --template=templates/template.latex \

pandoc -s paper.md \
  --from markdown+auto_identifiers --pdf-engine=xelatex --template tex/latex-template.tex -V colorlinks --number-sections \
  --filter=pandoc-url2cite --citeproc --pdf-engine=xelatex \
  --dpi=300 -o paper.pdf

pandoc -s paper.md --filter bin/code-filter.py --filter=pandoc-url2cite \
  --citeproc \
  -t markdown-citations -t markdown-fenced_divs \
  -o paper-preprocessed.md
