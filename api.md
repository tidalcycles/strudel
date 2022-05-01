## Classes

<dl>
<dt><a href="#Pattern">Pattern</a></dt>
<dd><p>Class representing a pattern.</p></dd>
</dl>

## Functions

<dl>
<dt><a href="#pure">pure(value)</a> ⇒ <code><a href="#Pattern">Pattern</a></code></dt>
<dd><p>A discrete value that repeats once per cycle:</p></dd>
<dt><a href="#stack">stack(...items)</a> ⇒ <code><a href="#Pattern">Pattern</a></code></dt>
<dd><p>The given items are played at the same time at the same length:</p></dd>
<dt><a href="#slowcat">slowcat(...items)</a> ⇒ <code><a href="#Pattern">Pattern</a></code></dt>
<dd><p>Concatenation: combines a list of patterns, switching between them successively, one per cycle:</p>
<p>synonyms: [cat](#cat)</p></dd>
<dt><a href="#slowcatPrime">slowcatPrime(...items)</a> ⇒ <code><a href="#Pattern">Pattern</a></code></dt>
<dd><p>Concatenation: combines a list of patterns, switching between them successively, one per cycle. Unlike slowcat, this version will skip cycles.</p></dd>
<dt><a href="#fastcat">fastcat(...items)</a> ⇒ <code><a href="#Pattern">Pattern</a></code></dt>
<dd><p>Concatenation: as with [slowcat](#slowcat), but squashes a cycle from each pattern into one cycle</p>
<p>Synonyms: [seq](#seq), [sequence](#sequence)</p></dd>
<dt><a href="#cat">cat()</a></dt>
<dd><p>See [slowcat](#slowcat)</p></dd>
<dt><a href="#timeCat">timeCat(...items)</a> ⇒ <code><a href="#Pattern">Pattern</a></code></dt>
<dd><p>Like [fastcat](#fastcat), but where each step has a temporal weight:</p></dd>
<dt><a href="#sequence">sequence()</a></dt>
<dd><p>See [fastcat](#fastcat)</p></dd>
<dt><a href="#seq">seq()</a></dt>
<dd><p>See [fastcat](#fastcat)</p></dd>
</dl>

<a name="pure"></a>

## pure(value) ⇒ [<code>Pattern</code>](#Pattern)
<p>A discrete value that repeats once per cycle:</p>

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>any</code> | <p>The value to repeat</p> |

**Example**  
```js
pure('e4')
```
<a name="stack"></a>

## stack(...items) ⇒ [<code>Pattern</code>](#Pattern)
<p>The given items are played at the same time at the same length:</p>

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ...items | <code>any</code> | <p>The items to stack</p> |

**Example**  
```js
stack(g3, b3, [e4, d4])
```
<a name="slowcat"></a>

## slowcat(...items) ⇒ [<code>Pattern</code>](#Pattern)
<p>Concatenation: combines a list of patterns, switching between them successively, one per cycle:</p>
<p>synonyms: [cat](#cat)</p>

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ...items | <code>any</code> | <p>The items to concatenate</p> |

**Example**  
```js
slowcat(e5, b4, [d5, c5])
```
<a name="slowcatPrime"></a>

## slowcatPrime(...items) ⇒ [<code>Pattern</code>](#Pattern)
<p>Concatenation: combines a list of patterns, switching between them successively, one per cycle. Unlike slowcat, this version will skip cycles.</p>

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ...items | <code>any</code> | <p>The items to concatenate</p> |

<a name="fastcat"></a>

## fastcat(...items) ⇒ [<code>Pattern</code>](#Pattern)
<p>Concatenation: as with [slowcat](#slowcat), but squashes a cycle from each pattern into one cycle</p>
<p>Synonyms: [seq](#seq), [sequence](#sequence)</p>

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ...items | <code>any</code> | <p>The items to concatenate</p> |

**Example**  
```js
fastcat(e5, b4, [d5, c5])
sequence(e5, b4, [d5, c5])
seq(e5, b4, [d5, c5])
```
<a name="cat"></a>

## cat()
<p>See [slowcat](#slowcat)</p>

**Kind**: global function  
<a name="timeCat"></a>

## timeCat(...items) ⇒ [<code>Pattern</code>](#Pattern)
<p>Like [fastcat](#fastcat), but where each step has a temporal weight:</p>

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ...items | <code>Array</code> | <p>The items to concatenate</p> |

**Example**  
```js
timeCat([3,e3],[1, g3])
```
<a name="sequence"></a>

## sequence()
<p>See [fastcat](#fastcat)</p>

**Kind**: global function  
<a name="seq"></a>

## seq()
<p>See [fastcat](#fastcat)</p>

**Kind**: global function  
