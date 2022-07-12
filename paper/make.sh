#!/bin/bash

if [ -d "$HOME/.cabal/bin" ] ; then
    PATH="$HOME/.cabal/bin:$PATH"
fi

# --template=templates/template.latex \

pandoc -s demo.md \
  --from markdown+auto_identifiers --pdf-engine=xelatex --template tex/latex-template.tex -V colorlinks --number-sections \
  --citeproc --pdf-engine=xelatex \
  --dpi=300 -o demo.pdf

pandoc -s demo.md --filter bin/code-filter.py \
  --citeproc \
  -t markdown-citations -t markdown-fenced_divs \
  -o demo-preprocessed.md
