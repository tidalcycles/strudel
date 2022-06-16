# study: why are there so many calls?

- `pure('c3')` => 746 calls per second...
- shapeshifted: `(async()=>{return reify("c3").withLocation([1,5,20],[1,9,24])})()`Ï => same # of calls with or without shapeshifting
- without highlighting (// strudel disable-highlighting), there are only 15 calls

## call stack

this is how the ~15 calls are made for the first query:

- keypress -> activateCode -> evaluate -> safeEval -> pure -> new Pattern (pretty simple)
- query 0
  - const timespan = new TimeSpan(0,1)
    - Fraction(0), Fraction(1)
  - onQuery(new State(timespan))
    - pattern.query(state)
      - pure.query(state)
        - state.span.spanCycles
          - end.sam() -> this.floor -> new Fraction
          - begin.sam -> this.floor -> new Fraction
          - begin.nextSam
            - begin.sam -> this.floor -> new Fraction
            - .add(1) -> new Fraction
        - Fraction(0).wholeCycle -> new TimeSpan(0, 1)
          - this.sam -> new Fraction(0)
          - this.nextSam -> new Fraction(1)
        - new Hap(TimeSpan(0,1), TimeSpan(0,1), 'c3')
  - Tone.getTransport().cancel(0);
  - queryNextTime = 0.5
  - t = 0.6

## from simple to complicated

(all without highlighting)

- `pure('c3')`: 15 calls
- `pure('c3').fast(1)`: 74 calls
- `pure('c3').fast(1).fast(1)`: 133 calls
- `pure('c3').fast(1).fast(1).fast(1)`: 192 calls
- `pure('c3').fast(1).fast(1).fast(1).fast(1)`: 251 calls
- `pure('c3').fast(1).fast(1).fast(1).fast(1).fast(1)`: 310 calls
- `pure('c3').fast(2)`: 94 calls
- `pure('c3').fast(2).fast(2)`: 264 calls
- `pure('c3').fast(2).fast(2).fast(2)`: 636 calls
- `pure('c3').fast(4)`: 134 calls

## WIL

- Fraction.wholeCycle: returns a timespan for the whole cycle the given fraction is in. Fraction(n).wholeCycle -> TimeSpan(n.floor, n.floor+1)
  - e.g. `Fraction(0.5).wholeCycle` -> `TimeSpan(0, 1)`
- TimeSpan.spanCycles: returns an array of whole cycle timespans that intersect with the given timespan
  - e.g. `TimeSpan(0.5, 1.5)` -> `[TimeSpan(0, 1), TimeSpan(1, 2)]`
- pure: returns one Hap for spanCycles of query span. Hap will get wholeCycle as whole and query span as part
- reify: turns non patterns into patterns using pure. makes sure you get a pattern

## notes

- slowcat -> sequence -> fastcat -> slowcat is a somewhat hidden recursion
- slowcat -> pat_n can be negative and will then return an empty array. is that good? shouldn't pat_n be always a positive index?
- slowcat offset: how to think about this?
- slowcat: why add offset and sub it from the query span?
