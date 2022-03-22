#!/bin/bash

if [ -d "$HOME/.cabal/bin" ] ; then
    PATH="$HOME/.cabal/bin:$PATH"
fi

# --template=templates/template.latex \

pandoc -s paper.md \
  --from markdown+auto_identifiers -V colorlinks --number-sections --citeproc --pdf-engine=xelatex \
  --dpi=300 --bibliography strudel.bib -o paper.pdf

pandoc -s paper.md --filter filter.py --citeproc --bibliography strudel.bib \
  -t markdown-citations -t markdown-fenced_divs \
  -o paper-preprocessed.md
