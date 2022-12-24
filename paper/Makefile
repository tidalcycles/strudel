all: iclc2023.pdf iclc2023.html

clean:
	rm iclc2023.pdf iclc2023.html

iclc2023.html: iclc2023.md citations.json
	pandoc --template=pandoc/iclc.html --citeproc --number-sections iclc2023.md -o iclc2023.html

iclc2023.pdf: iclc2023.md citations.json pandoc/iclc.latex pandoc/iclc.sty
	pandoc --template=pandoc/iclc.latex --citeproc --number-sections iclc2023.md -o iclc2023.pdf

iclc2023.docx: iclc2023.md citations.json
	pandoc --citeproc --number-sections iclc2023.md -o iclc2023.docx

iclc2023x.pdf: iclc2023.md citations.json pandoc/iclc.latex pandoc/iclc.sty
	pandoc --template=pandoc/iclc.latex --citeproc --number-sections iclc2023.md --pdf-engine=xelatex -o iclc2023x.pdf
