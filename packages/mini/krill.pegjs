/*
krill.pegjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/krill.pegjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Some terminology:
// a sequence = a serie of elements placed between quotes
// a stack = a serie of vertically aligned slices sharing the same overall length
// a slice = a serie of horizontally aligned elements
// a choose = a serie of elements, one of which is chosen at random


{
  var PatternStub = function(source, alignment)
  {
    this.type_ = "pattern";
    this.arguments_ = { alignment : alignment};
    this.source_ = source;
  }

  var OperatorStub = function(name, args, source)
  {
    this.type_ = name;
    this.arguments_ = args;
    this.source_ = source;
  }

  var ElementStub = function(source, options)
  {
    this.type_ = "element";
    this.source_ = source;
    this.options_ = options;
    this.location_ = location();
  }

  var CommandStub = function(name, options)
  {
    this.type_ = "command";
    this.name_ = name;
    this.options_ = options;
  }

}

start = statement

// ----- Numbers -----

number "number"
  = minus? int frac? exp? { return parseFloat(text()); }

decimal_point
  = "."

digit1_9
  = [1-9]

e
  = [eE]

exp
  = e (minus / plus)? DIGIT+

frac
  = decimal_point DIGIT+

int
  = zero / (digit1_9 DIGIT*)

minus
  = "-"

plus
  = "+"

zero
  = "0"

DIGIT  = [0-9]

// ------------------ delimiters ---------------------------

ws "whitespace" = [ \n\r\t]*
comma = ws "," ws
pipe = ws "|" ws
quote = '"' / "'"

// ------------------ steps and cycles ---------------------------

// single step definition (e.g bd)
step_char =  [0-9a-zA-Z~] / "-" / "#" / "." / "^" / "_" / ":"
step = ws chars:step_char+ ws { return chars.join("") }

// define a sub cycle e.g. [1 2, 3 [4]]
sub_cycle = ws  "[" ws s:stack_or_choose ws "]" ws { return s}

// define a timeline e.g <1 3 [3 5]>. We simply defer to a stack and change the alignement
timeline = ws "<" ws sc:single_cycle ws ">" ws
  { sc.arguments_.alignment = "t"; return sc;}

// a slice is either a single step or a sub cycle
slice = step / sub_cycle  / timeline

// slice modifier affects the timing/size of a slice (e.g. [a b c]@3)
// at this point, we assume we can represent them as regular sequence operators
slice_modifier = slice_weight / slice_bjorklund / slice_slow / slice_fast / slice_fixed_step / slice_replicate / slice_degrade

slice_weight =  "@" a:number
  { return { weight: a} }
  
slice_replicate = "!"a:number
  { return { replicate: a  } }

slice_bjorklund = "(" ws p:number ws comma ws s:number ws comma? ws r:number? ws ")"
  { return { operator : { type_: "bjorklund", arguments_ :{ pulse: p, step:s, rotation:r || 0 } } } }

slice_slow = "/"a:number
  { return { operator : { type_: "stretch", arguments_ :{ amount:a, type: 'slow' } } } }

slice_fast = "*"a:number
  { return { operator : { type_: "stretch", arguments_ :{ amount:a, type: 'fast' } } } }

slice_fixed_step = "%"a:number
  { return { operator : { type_: "fixed-step", arguments_ :{ amount:a } } } }

slice_degrade = "?"a:number?
  { return { operator : { type_: "degradeBy", arguments_ :{ amount:(a? a : 0.5) } } } }

// a slice with an modifier applied i.e [bd@4 sd@3]@2 hh]
slice_with_modifier = s:slice o:slice_modifier?
  { return new ElementStub(s, o);}

// a single cycle is a combination of one or more successive slices (as an array). If we
// have only one element, we skip the array and return the element itself
single_cycle = s:(slice_with_modifier)+
  { return new PatternStub(s,"h"); }

// a stack is a serie of vertically aligned single cycles, separated by a comma
stack_tail = tail:(comma @single_cycle)+
  { return { alignment: 'v', list: tail }; }

// a choose is a serie of pipe-separated single cycles, one of which is chosen
// at random each time through the pattern
choose_tail = tail:(pipe @single_cycle)+
  { return { alignment: 'r', list: tail }; }

// if the stack contains only one element, we don't create a stack but return the
// underlying element
stack_or_choose = head:single_cycle tail:(stack_tail / choose_tail)?
  { if (tail && tail.list.length > 0) { return new PatternStub([head, ...tail.list], tail.alignment); } else { return head; } }

// a sequence is a quoted stack
sequence = ws quote sc:stack_or_choose quote
  { return sc; }

// ------------------ operators ---------------------------

operator = scale / slow / fast / target / bjorklund / struct / rotR / rotL

struct = "struct" ws s:sequence_or_operator
  { return { name: "struct", args: { sequence:s }}}

target = "target" ws quote s:step quote
  { return { name: "target", args : { name:s}}}

bjorklund = "euclid" ws p:int ws s:int ws r:int?
  { return { name: "bjorklund", args :{ pulse: parseInt(p), step:parseInt(s) }}}

slow = "slow" ws a:number
  { return { name: "stretch", args :{ amount: a}}}

rotL = "rotL" ws a:number
  { return { name: "shift", args :{ amount: "-"+a}}}

rotR = "rotR" ws a:number
  { return { name: "shift", args :{ amount: a}}}

fast = "fast" ws a:number
  { return { name: "stretch", args :{ amount: "1/"+a}}}

scale = "scale" ws quote s:(step_char)+ quote
{ return { name: "scale", args :{ scale: s.join("")}}}

comment = '//' p:([^\n]*)

// ---------------- grouping --------------------------------

group_operator = cat

// cat is another form of timeline
cat = "cat" ws "[" ws  s:sequence_or_operator ss:(comma v:sequence_or_operator { return v})* ws "]"
  { ss.unshift(s); return new PatternStub(ss,"t"); }

// ------------------ high level sequence ---------------------------

sequence_or_group =
  group_operator /
  sequence

sequence_or_operator =
  sg:sequence_or_group ws (comment)*
    {return sg}
  / o:operator ws "$" ws soc:sequence_or_operator
    { return new OperatorStub(o.name,o.args,soc)}

sequ_or_operator_or_comment =
  sc: sequence_or_operator
    { return sc }
   / comment

sequence_definition = s:sequ_or_operator_or_comment

// ---------------------- statements ----------------------------

command = ws c:(setcps / setbpm / hush) ws
  { return c }

setcps = "setcps" ws v:number
  { return new CommandStub("setcps", { value: v})}

setbpm = "setbpm" ws v:number
  { return new CommandStub("setcps", { value: (v/120/2)})}

hush = "hush"
  { return new CommandStub("hush")}

// ---------------------- statements ----------------------------

statement = sequence_definition / command
