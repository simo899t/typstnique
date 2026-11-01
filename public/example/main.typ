#import "@preview/sdust:0.2.0": *
#import "@preview/curryst:0.6.0": rule, prooftree
#import "@preview/lovelace:0.3.0": pseudocode-list

#show: assignment.with(
  title: "Problem set 4",
  course: "AI504 — Knowledge Representation",
  author: ("Simon Holm", "Johannes Rothe", "Shuagib Ibrahim", "Anne Sofie Høj", "Daniel Nissen"),
  date: "March, 2026",
  outline-depth: 1
)
#set par(
  justify: true,
  leading: 0.52em,
)

// Notation used below
#let term(p, q) = $#p "all" #q$
#let sent(p, q, mid: none) = if mid == none { $"all" #p #h(0.4em) #q$ } else { $"all" #p #mid #q$ }
#let ip(x) = $[|#x|]$
#let psubset = $subset$
#let Gam = $Gamma$
#let model = $cal(M)$
#let ent = symbol("⊨", ("not", "⊭"))
#let prov = symbol("⊢", ("not", "⊬"))
#let phi = $phi.alt$
#let dag = $dagger$
#let qquad = $quad quad$
#let IH = [*_IH_*]
#let pseudo = pseudocode-list


= Problem 1 <1>

#let hawks = `hawks`
#let birds = `birds`
#let turtles = `turtles`
#let see = `see`

Do exercise 2.3 from the textbook, reproduced herewith. Work with the set of nouns $hawks, birds, turtles$ and the verb $see$. Let $Gam$ be the set of sentences

- $sent(hawks,birds)$
- $sent((term(see,turtles)),(term(see,(term(see,hawks)))))$
- $sent((term(see,(term(see,hawks)))), turtles)$
- $sent(turtles, (term(see,birds)))$

Give a formal proof (in either $cal(A(R C))$ or $cal(A(R C))'$) of each of the following sentences from $Gam$. (Attach more pages if space demands)

+ $sent((term(see,(term(see,hawks)))),(term(see,hawks)))$

+ $sent((term(see,turtles)),(term(see,(term(see,birds)))))$

+ $sent((term(see,turtles)),(term(see,(term(see,turtles)))))$

== Solution

For this problem nouns will be addressed as abbreviations for simplicity and spacing.
#figure[$ hawks =$ `h`, $ birds =$ `b`, $ turtles =$ `t`]
#let hawks = `h`
#let birds = `b`
#let turtles = `t`
#let see = `see`

a)
#figure(
  prooftree(rule(
    name: [BARB],
    $sent((term(see,(term(see,hawks)))), turtles)$,
    rule(name: [DOWN], $sent(t,(term(see,birds)))$, $sent(hawks,birds)$, $sent(t, term(see,hawks))$),
    $sent((term(see,(term(see,hawks)))), (term(see,hawks)))$,
  )),
  caption: [proof tree of $(a)$],
  gap: 2em,
)
// #image("a.png")

b)
#figure(
  prooftree(rule(
    name: [BARB],
    $sent((term(see,turtles)), term(see,(term(see,hawks))))$,
    rule(
      name: [ANTI],
      rule(name: [ANTI], $term(hawks,birds)$, $sent((term(see,birds)),(term(see,hawks)))$),
      $sent((term(see,(term(see,hawks)))),(term(see,(term(see,birds)))))$,
    ),
    $sent((term(see,turtles)), (term(see,(term(see,birds)))))$,
  )),
  caption: [proof tree of $(b)$],
  gap: 2em,
)

c)
#figure(
  prooftree(rule(
    name: [ANTI],
    rule(
      name: [BARBARA],
      $sent((term(see,turtles)),(term(see,(term(see,hawks)))))$,
      $sent((term(see,(term(see,hawks)))),turtles)$,
      $sent((term(see,turtles)),turtles)$,
    ),
    $sent((term(see,turtles)), (term(see,(term(see,turtles)))))$,
  )),
  caption: [proof tree of $(c)$],
  gap: 2em,
)

#pagebreak()

= Problem 2
#let see = `see`
#let love = `love`
#let cat = `cat`

This problem lets you practice _induction on terms_. Work with the set of verbs $see, love$, and one noun $cat$. We get terms like

$quad term(love,(term(see,(term(see,(term(love,(term(love,cat))))))))))$

This term starts with one occurrence of $love$. The term $cat$ and $term(see,(term(love,cat)))$ start with zero occurrences of $love$. And $term(love,(term(love,cat)))$ starts with two occurrences of $love$.

Let's take a model $model$ with $M={1,2}$ and with

#align($
 ip(cat)  &= {1,2} \
 ip(see)  &= {(1,1), (1,2), (2,1), (2,2)} \
 ip(love) &= {(1,2)}
$)
Prove that for any term $t$, the denotation $ip(t)psubset M$ is either $M$ it self or $emptyset$, depending on whether the number of occurrences of $love$ that $t$ starts with is either even or odd.

#pagebreak()

== Solution

#pseudo[
*Proof by induction*
- *Goal:* For any term $t=(term(v,t))$, $ip(t) psubset M$ is either $M$ or $emptyset$ depending on whether the number of occurrences of $love$ that $t$ starts with is either even or odd.
+ *$underline("Inductive hypothesis")$*
  + Since $ip(term(r,t')) = {m in M:forall n in ip(t') space (m,n) in ip(r)}$, any term on the form $t= term(see,t')$
  + Then since $ip(term(see,t')) = M$

  + Because of this any term can be written by definition as $ t=love^k (t') quad k in NN \ "where" t'!=term(love,t) $
+ *$underline("Base case")$* ($k=0$)
  + Term $t$ can either be a single noun or an expression
  + Case 1
    + Term $t$ is single noun ($cat$) with 0 (even) occurrences of $love$
    + $ip(love^0 (cat)) = ip(cat) = {1,2} = M$.
  + Case 2
    + Term $t$ is $(term(see,cat))$ with 0 (even) occurrences of $love$
    + $ip(love^0 (term(see,cat)))= ip(term(see,cat)) = {1,2} = M$

+ *$underline("Inductive step")$* ($k+1$)
  +
//- Case 1 ($see$)
//  + For $t = term(see,t')$, $ ip(term(see,t'))= {m in M: forall n in ip(t') space (m,n) in ip(see)}$
//  + Since $ip(t')$ can either be $M$ or $emptyset$
//  + ${m in M:forall n in M space (m,n)in ip(see)} = M$, since all combinations of $(m,n)$ are in $ip(see)$
//  + ${m in M:forall n in Ø space (m,n)in ip(see)} = M$, because of $forall n in emptyset$.
//- Case 2 $(love$)
  + By $IH$ lets only focus on leading $love$'s
  + For $2k+1$
    + $ip(t') = M$ then since $ip(love) = {(1,2)}$, $forall n in M$ will result in $emptyset$
  + For $2k$
    + $ip(t') = emptyset$ then the universal quantifier $forall n in emptyset$ makes $ip(t)=M$
  + Because of this, $ love^(2k)(t') = M "(even)" qquad love^(2k+1) (t') = emptyset "(odd)" $
  + when $t'!= term(love,t)$]

#pagebreak()

= Problem 3
#let love = `love`
#let hate = `hate`

Let $Gam = {sent(p,q)}$. For each of the following two sentences give _either_ a proof (in either $cal(A(R C))$ or $cal(A(R C))'$) of that sentence from $Gam$ _or_ a counter-model (i.e., a model which satisfies $sent(p,q)$, but falsifies the sentence in question). If you're giving a counter-model, verify that your counter-model actually works, i.e., satisfies and falsifies the right sentences, and show your work.

+ $sent((term(hate,(term(love,p)))),(term(hate,(term(love,q)))))$

+ $sent((term(hate,(term(love,q)))),(term(hate,(term(love,p)))))$

== Solution

a) One can show that $Gam prov phi$ by using the (Anti) twice, while treating the sentence (a) as a leaf and building up the tree
#figure(
  prooftree(rule(
    name: [ANTI],
    rule(name: [ANTI], $sent(p,q)$, $sent((term(love,q)),(term(love,p)))$),
    $sent((term(hate,(term(love,p)))),(term(hate,(term(love,q)))))$,
  )),
  caption: [proof tree],
  gap: 1.5em,
)

// #image("Anti (3).png")

b)
Creating a counter example:

#align($ M &= {1,2,3,4}
\
[[p]] &= emptyset
\
[[q]] &= {1,2}
\
[["love"]] &= {(1,1), (2,2)}
\
[["hate"]] &= {(1,1), (2,2), (3,3), (4,4)} $)

first we have to check that our model satisfies $phi$:
$m ent sent(p,q) checkmark$

Taking the right side:

$[["love" "all" q]] =  {m in {1,2,3,4}: forall n in {1,2}, (m,n) in {(1,1),(2,2)}}$. This is $emptyset$ set since we don't have all the pairs mapping from $[[p]] "to" [[love]].$

$[[hate "all" (love "all" q)]] = {m in {1,2,3,4}: forall n in emptyset: (m,n) in {(1,1), (2,2), (3,3), (4,4)}} = M$ since we are walking with a universal quantifier mapping over the empty set, which is always true.

Taking the left side:

[[love all p]] = ${ m in {1,2,3,4}: forall n in emptyset, (m,n) in {(1,1),(2,2)} = M.$

$[["all" (hate "all" (love "all" p))]] = { m in {1,2,3,4}}: forall n in {1,2,3,4}, (m,n) in {(1,1), (2,2),(3,3) (4,4)}  = emptyset.$

$sent((term("hate",(term("love",q)))),(term("hate",(term("love",p))))) = {1,2,3,4} subset.not emptyset. $

Therefore one can *conclude*: \
$model tack.double.not sent((term("hate",(term("love",q)))),(term("hate",(term("love",p))))). $

#pagebreak()

= Problem 4
#let turtles = `t`
#let birds = `b`
#let see = `see`

This problem continues the notion of duals from homework 2. We can define the _dual_ of the sentence $sent(s,t)$ to be sentence $sent(t,s)$.
So for example, for the dual of the sentence $sent(turtles,(term(see,birds)))$ is $sent((term(see,birds)), turtles)$. Let $phi^dag$ denote the dual of $phi$. Note that this _extends_ the previous notion of dual to sentences in $cal(A(R C))$

My question is: if $Gam prov phi$, is it still true that $Gam^dag prov phi^dag$? You must either *yes* and include on proof by induction on proof trees (like before), or *no* and a counterexample. (A counterexample consists of a _specific_ set of sentences $Gam$ and a sentence $phi$ and a _specific_ model $model$ such that $Gam prov phi$ and $model ent Gam^dag$ but $model ent.not phi^dag$.) Note that if your answer is *yes*, you can work either with $cal(A(R C))$ or $cal(A(R C))'$, as both give equivalent notions of drivability $prov$. But you should be clear which one you're choosing.

#pagebreak()

== Solution
#let Gamd = $Gam^dag$
#let phid = $phi^dag$

#pseudo[
*Proof by induction*
- *Goal:* For all proof trees $T$, where $Gam prov phi$, then there exists a proof tree $T^dag$, such that $Gamd prov phid$.
+ *$underline("Base case")$*
  + If $T$ is a single sentence (the whole tree is a leaf), then either $phi$ is an axiom such that $phi = phi^dag$ or $phi in Gam$ which means that $phi^dag in Gam^dag$
  + Then since all leaves are $in Gamd$, $Gamd prov phid$
+ *$underline("Inductive hypothesis")$*
  + For all proofs $T$ where $Gam prov phi$, there exists another proof $T'$ from $Gam^dag$ such that $Gamd prov phid$
+ *$underline("Inductive step")$*
  + Suppose $T$ is not a leaf, then it is either an instance of ANTI or BARBARA.
  + Case 1 ANTI:
    + If $T$ is not a single leaf but an instance of ANTI, then it is a sentence proved by 1 subtree. This can be written up as follows:

    + #figure($
   prooftree(
    rule(
      name: "ANTI",
      overbrace(sent(x,y), cal(T)),
    underbrace(sent((term(r,y)),(term(r,x))), phi),
    )
    )
    $)

    + Where $phi^dag$ can be proved by using ANTI on the dual of the subtree
    + #figure($
   prooftree(
    rule(
      name: "ANTI",
      overbrace(sent(y,x), cal(T)^dag),
      underbrace(sent((term(r,x)),(term(r,y))), phi^dag),
    )
  )
$)
    + By the basis of the inductive hypothesis applied to $cal(T)$, it follows that $Gam^dag prov cal(T)^dag$, and by using the ANTI rule, it follows that $Gam^dag prov phi^dag$.

  + Case 2: BARBARA
    + If $cal(T)$ is not a single leaf, but an instance of BARBARA, then it is a sentence proved by 2 subtrees $cal(T)_0, cal(T)_1$ which can be written as follows:

    + $phi$ and $phi^+$, but $cal(T)$ is composed of two trees, left and right trees labeled $cal(T_0) $ and $cal(T_1)$, respectively, and it's dual:

    + #figure($
    prooftree(
      rule(
      name: "BARBARA",
      sent(overbrace((term(p,x)), cal(T)_0),overbrace((term(x,q)),cal(T)_1)),
      underbrace(sent(p,q), phi))
    )
  $)
    + The proof tree can then be restructured, so it satisfies the $phi^dag$.
    + By switching the order of the dual of the subtrees $cal(T)^dag_0, cal(T)^dag_1$, $phi^dag$ can also be proved by an instance of BARBARA:
    + #figure($
    prooftree(
      rule(
      name: "BARBARA",
      sent(overbrace((term(q,x)), cal(T)_1^dagger),overbrace((term(x,p)),cal(T)_0^dagger)),
      underbrace(sent(q,p), phi^dag))
    )
  $)
  + Therefore, all proofs $T$ from $cal(A)(R C)'$ where $Gam prov phi$, proves the existence of $Gam^dag prov phi^dag$.
]
