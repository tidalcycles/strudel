**Submission ID:** 8

**Title:** Strudel: live coding patterns on the Web

**Status:** Accept

**Reviewer 1:**

Author Comments: * Summary of the contribution:\
This paper describes Strudel, a Web-based implementation of Tidal Cycles. It is generally a good overview of the system which could help prospective users understand how it works beyond the manual, and it provides many code examples. The most interesting contribution is the comparison between the Haskell and JavaScript features for this case.

* On theme (1-5):\
1

* Citation quality (1-5):\
5

* Missing references:\
not answered

* Suggested improvements:\
This paper is a good introduction to Strudel. The style is mostly illustrative, but it is hard to understand where the Tidal syntax is being introduced vs where the specific Strudel features are used. Thus, the best way to improve it would be to focus on Strudel. Also, it would be good to give a better hint on what output method would be preferable. Also the title of Section 9 should compare Strudel to Tidal or Haskell to JavaScript.

The paper is driven by examples, but many are a bit difficult to follow, here are some issues:\
Section 4 - the mini-notation example does not look terser despite the text.\
Section 5 - echo funciton is not used.\
Sections 7.11 and 7.12 - the same (mini-notation) example is used so it is not clear what relation there is between transpilation and using mini-notation. Also please reference peggy\
Sectin 7.3.2 The sawtooth waveform has been used in all examples, so it would be clearer if it was used here (maybe cutoff as well).

Generally, beyond the language differences, what does Strudel contribute with respect to Haskell-based Tidal? I would say that there is a lot to be gained in terms of installation, availability and potential for collaboration.

* Clarity (1-5):\
4

* Corrections required:\
No contentious / incorrect claims

* Other Changes if Published:\
not answered

* Correct Template used?\
Yes

* All materials provided?\
Yes

* Wordcount respected?\
Yes

* Have any deviations, errors or omissions impacted your ability to give a fair review?\
No

**Reviewer 2:**

Author Comments: * Summary of the contribution:\
This proposal presents Strudel, an online, JavaScript-native approach to algorithmic pattern composition that in many ways mirrors TidalCycles. TidalCycles, developed by one of the authors, is a key software piece for live coding. Perhaps the most difficult aspects of Tidal are related to Haskell and Haskell's dependency system that makes it very difficult to install. Haskell in itself is a difficult language to grasp; if Tidal users would like to expand and 'personalise' the possibilities of the software, they would have to get familiar with the particularities of Haskell. JavaScript is a multi-paradigm language that is used for web development can make pattern-based, algorithmic composition more popular. The process of bringing Tidal's paradigm to a dynamic type system seems to be an important part of this research. I enjoy and find very interesting the dialectical process that occurs between Strudel and Tidal, where the implementation of Tidal concepts in Strudel simultaneously transforms Tidal, either by introspection (finding bugs, etc.) or by bringing back to Tidal new insights that are clear in JavaScript. I think moving to TypeScript makes sense; perhaps a small section where the decision to use JavaScript is discussed a little further could be helpful for readers (beyond accessibility). Overall, this paper is clear and presents software that is a key development for live coding and will be a great addition to the next ICLC.

* On theme (1-5):\
4

* Citation quality (1-5):\
5

* Missing references:\
not answered

* Suggested improvements:\
Tidal-Strudel parity seems to be on the immediate horizon, but I wonder if this parity is transient and if the ultimate goal of Strudel is to ultimately diverge from Tidal. Perhaps the project is in its early stages, and this is not clear, but it would be interesting to get some insights on the authors' intentions. Personally, I think that a key discussion that needs to happen in live coding communities and development nodes is that of what is understood as multilingual live coding. Tidal's paradigm is implemented in a number of programming languages (as well as platforms such as Estuary), each with its own set of features and challenges: some are functional reactive programming, type strict oriented, while others are multi-paradigm, dynamic type oriented, etc. This seems to suggest that it is possible for many programming languages to adopt one single understanding of how to make music. Perhaps further considerations should be made as to whether we need one single grammar to name and express all music structures or whether we need environments and software that help difference to proliferate in terms of music/sound art/art idiosyncrasies. Perhaps questions in this direction are beyond the scope of this paper and I hope this comment is taken as productive feedback for the authors.

* Clarity (1-5):\
4

* Corrections required:\
Nothing contentious or incorrect to note.

* Other Changes if Published:\
The example shown on page 3 under "Pattern Example" seems to be different from its explanation. The explanations do not mention scale but mention echo, which is not present in the example. I would double check all the code examples inc ase I missed something like this.

* Correct Template used?\
Yes

* All materials provided?\
Yes

* Wordcount respected?\
Yes

* Have any deviations, errors or omissions impacted your ability to give a fair review?\
no

* General remarks:\
This proposal presents Strudel, an online, JavaScript-native approach to algorithmic pattern composition that in many ways mirrors TidalCycles. TidalCycles, developed by one of the authors, is a key software piece for live coding. Perhaps the most difficult aspects of Tidal are related to Haskell and Haskell's dependency system that makes it very difficult to install. Haskell in itself is a difficult language to grasp; if Tidal users would like to expand and 'personalise' the possibilities of the software, they would have to get familiar with the particularities of Haskell. JavaScript is a multi-paradigm language that can make pattern-based, algorithmic composition more popular. The process of bringing Tidal's paradigm to a dynamic type system seems to be an important part of this research. I enjoy and find very interesting the dialectical process that occurs between Strudel and Tidal, where the implementation of Tidal concepts in Strudel simultaneously transforms Tidal, either by introspection (finding bugs, etc.) or by bringing back to Tidal new insights that are clear in JavaScript. I think moving to TypeScript makes sense; perhaps a small section where the decision to use JavaScript is discussed a little further could be helpful for readers (beyond accessibility). I am curious, did the authors consider PureScript? I can see how, in terms of popularity, PureScript is a lateral move coming from Haskell, but an explicit explanation about the (maybe) obvious candidates would be interesting.\
Tidal-Strudel parity seems to be on the immediate horizon, but I wonder if this parity is transient and if the ultimate goal of Strudel is to ultimately diverge from Tidal. Perhaps the project is in its early stages, and this is not clear, but it would be interesting to get some insights on the authors' intentions. Personally, I think that a key discussion that needs to happen in live coding communities and development nodes is that of what is understood as multilingual live coding. Tidal's paradigm is implemented in a number of programming languages (as well as platforms such as Estuary), each with its own set of features and challenges: some are functional reactive programming, type strict oriented, while others are multi-paradigm, dynamic type oriented, etc. This seems to suggest that it is possible for many programming languages to adopt one single understanding of how to make music. Perhaps further considerations should be made as to whether we need one single grammar to name and express all music structures or whether we need environments and software that help difference to proliferate in terms of music/sound art/art idiosyncrasies. Perhaps questions in this direction are beyond the scope of this paper and I hope this last comment is taken as productive feedback for the authors.

Overall, this paper is clear and presents software that is a key development for live coding and will be a great addition to the next ICLC.

PS. The example shown on page 3 under "Pattern Example" seems to be different from its explanation. The explanations do not mention scale but mention echo, which is not present in the example.
