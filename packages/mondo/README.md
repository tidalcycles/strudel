# mondo

an experimental parser for an *uzulang*, a custom dsl for patterns that can stand on its own feet. more info:

- [uzulang I](https://garten.salat.dev/uzu/uzulang1.html)
- [uzulang II](https://garten.salat.dev/uzu/uzulang2.html)

```js
import { MondoRunner } from 'uzu'

const runner = MondoRunner({ seq, cat, s, crush, speed, '*': fast });
const pat = runner.run('s [bd hh*2 cp.(crush 4) <mt ht lt>] . speed .8')
```

the above code will create the following call structure:

```lisp
(speed 
 (s 
  (seq bd 
   (* hh 2) 
   (crush cp 4) 
   (cat mt ht lt)
  )
 ) .8
)
```

you can pass all available functions to *MondoRunner* as an object.
