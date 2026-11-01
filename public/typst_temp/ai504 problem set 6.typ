#import "temp/temp.typ": *

#show: assignment.with(
  title: "Problem set 6",
  course: "AI504 — Knowledge Representation",
  author: ("Simon Holm", "Johannes Rothe", "Shuagib Ibrahim", "Anne Sofie Høj", "Daniel Nissen"),
  date: "May, 2026",
  outline-depth: 1
)
#set par(
  justify: true,
  leading: 0.52em,
)

#let see = `see`
#let love = `love`
#let dogs = `dogs`
#let birds = `birds`

= Problem 1 <sec1>
#set text(font: "New Computer Modern", size: 11pt)
We are going to describe a translation from the syntax of $cal(A(R C))$ to the syntax of propositional logic.
First of all, if $(P, R)$ is a signature of $cal(A(R C))$ then just map it to the propositional logic signature $P cup R$. (In other words, either a noun or a verb in my source signature can be used as a sentence letter in my target signature.)

Now map terms $t$ of $cal(A(R C))$ to formulas $t^*$ of propositional logic as follows. Each noun $p$ becomes the propositional formula $p$. Then “$term(r,(dots))$" becomes “$(dots) -> r$,” so that, e.g., the term see $term(love,dogs)$ becomes $(dogs → love) -> see$. In the latter formula $see$, $love$, $dogs$ are just boolean-valued sentence letters; we have forgotten the noun/verb distinction.

Finally, the translation of the sentence “$term(t,s)$” is $t^star -> s^star$, where $t^star$ and $s^star$ is the mapping on terms defined above. (Call this map $phi |-> phi^star$, reusing the symbol $*$.) So, for example
$ (sent((term(see, term(love,dogs))), (term(love,birds))))^star $

+ Suppose that $Gam$ is a set of sentences and $phi$ is a sentence in $cal(A(R C))$,  and suppose that $Gam ent phi$. Prove that $Gam^star ent phi^star$, as a formulas of propositional logic.

  *Solution:*
  \
  This is proved by induction in an $cal(A)("RC")'$.
  
  
  #pseudo[
  *Proof by induction* 
  - *Goal:* For all $T,Gam, phi$ where $T$ is a proof tree s.t $Gam prov phi$, then there exists a proof tree $T^star$ s.t. $Gam^star ent phi^star$. 
  + *$underline("Base case")$*
    + If $T$ is a single sentence (the whole tree is a leaf), then either $phi$ is an axiom such that $phi = phi^star$ or $phi in Gam$ which means that $phi^star in Gam^star$ 
    + Then since all leaves are $in Gam^star$, $Gam^star prov phi^star$ and from soundness of propositional logic, $Gam^star ent phi^star$
  + *$underline("Inductive hypothesis")$*
  
  
    + For all proofs $T$ where $Gam prov phi$, there exists another proof $T^star$ from $Gam^star$ such that $Gam^star prov phi^star$
  + *$underline("Inductive step")$*
    + Suppose $T$ is not a leaf, then it is either an instance of ANTI or BARBARA. 
    + Case 1 ANTI:
      + If $T$ is not a single leaf but an instance of ANTI, then it is a sentence proved by one subtree $cal(T)$. This can be written up as follows:
    
      + #figure($
      prooftree(
      rule(
        name: "ANTI",
        overbrace(sent(x,y), cal(T)),
      underbrace(sent((term(r,y)),(term(r,x))), phi),
      )
      )
      $)
        
      + Applying the conversion rules for $cal(A)("RC")$ to propositional logic yields the converted subtree $cal(T)^star$ and sentence $phi^star$:
      
      + #figure($
     prooftree(
      rule(
        name: "ANTI",
        overbrace(x -> y, cal(T)^star),
        underbrace((y->r) -> (x->r), phi^star),
      )
    )
  $)
      + Then to show that $x->y imp (y->r) -> (x->r)$. 
      + This can be done by assuming that $(y->r) -> (x->r)$ is false and exploring all nodes in an analytic tableau-style table to ensure that all ends are contradictions:
        #figure(
          tree(
          spacing: (20pt, 20pt),
          node-inset: 7pt,
          shape: "rectangle"
        )[
          - $T: x -> y \ F: (y->r) -> (x->r)$
            - $T: not x or y \ F: not (not y or r) or (not x or r)$
              - $T:not x or y \ F: (y and not r),not  x, r $
              
                - $T: not x \ F: (y and not r), not x, r quad(bot) $
                - $T: y \ F: (y and not r), not x, r$  
                  - $T:y, r \ F: (y and not r),not x, r quad(bot)$
                  - $T:y, not r \ F:(y and not r),not x, r quad(bot)$ 
        ]
        )
  
      + Since all leaves lead to a contradiction denoted as ($bot$). This proves $phi^star$
      + By the basis of the inductive hypothesis applied to $cal(T)$, it follows that $Gam^star prov cal(T)^star$, and by using the ANTI rule, it follows that $Gam^star prov phi^star$. // TODO
  
    + Case 2: BARBARA
      + If $T$ is not a single leaf, but an instance of BARBARA, then it is a sentence proved by 2 subtrees $cal(T)_0, cal(T)_1$ which can be written as follows:
      + #figure($
      prooftree(
        rule(
        name: "BARBARA",
        overbrace((sent(p,x)), cal(T)_0),overbrace((sent(x,q)),cal(T)_1),
        underbrace(sent(p,q), phi))
      )
    $)
      + Where $T^star$ would be:
      + Applying the conversion rules for $cal(A)("RC")$ to propositional logic yields the converted subtrees $cal(T)_0^star, cal(T)_1^star$ and sentence $phi^star$:
      + #figure($
      prooftree(
        rule(
        name: "BARBARA",
        overbrace((p to x),cal(T)_0^star) quad overbrace((x to q), cal(T)_1^star),
        underbrace(p to q, phi^star))
      )
    $)
      
      
      + Using the same tableu method as before, it can be shown that the two subtrees prove $phi^star$:
      
  
  
      + #figure(scale(80%,
          tree(
          spacing: (20pt, 30pt),
          node-inset: 7pt,
          shape: "rectangle"
        )[
          - $T: (p -> x), (x->q) \ F: p->q$
            - $T: (not p or x), (not x or q) \ F: not p or q$
              - $T: (not p or x), q \ F: not p, q \ (bot) $
              - $T: not p, (not x or q) \ F: not p, q \ (bot) $
              - $T: x, (not x or q) \ F: not p, q $
                - $T: x, not x \ (bot) $
                - $T: x, q \ F: not p, q \ (bot) $
              - $T: (not p or x), not x \ F: not p, q$
                - $T: not p, not x \ F: not p,q\ (bot) $
                - $T: x, not x \ (bot) $
        ]
        ))
      + Therefore, all proofs $T$ from $cal(A)(R C)'$ where $Gam prov phi$, proves the existence of $Gam^star prov phi^star$, and from propositional logic soundness, $Gam^star ent phi^star$
  ]
  



+  Show that the converse is not true. In other words, come up with a concrete sentences $Gam, phi$ of $cal(A(R C))$ such that $Gam^star ent phi^star$ in propositional logic but $Gam ent.not phi$ in $cal(A(R C))$.

  Take the sentence $phi = sent(x, (term(z,y)))$ and $Gam = {sent(y, (term(z,x)))}$. To show that $Gam ent.not phi$, a concrete model will be used as a counterexample. Let: $ ip(x)&={1}\ ip(y)&={2}\ ip(z)&={(2,1)}  $


  Then:

  $ ip(term(z,x))&={2} \ 
  ip(term(z,y))&=emptyset
  $
  Since ${1} in.not emptyset$, this counter model shows that $Gam ent.not phi$. 


  By the rules stated in @sec1, $phi$ becomes $phi^star = x to (y to z)$ and $Gam^star={y to (x to z)}$ Now lets use tableau-style proof, to show that $Gam^star prov phi^star$.
  #figure(scale(80%,
        tree(
        spacing: (20pt, 30pt),
        node-inset: 7pt,
        shape: "rectangle"
      )[
        - $T: y -> (x->z) \ F: x to (y to z)$
          - $T: not y or (not x or z) \ F: not x, not y, z$
            - $T: not y, y \ F: not x,  z \ (bot) $
            - $T: not x or z \ F: not x, not y, z $
              - $T: not x  \ F: not x, not y, z \ (bot)$
              - $T: z \ F: not x, not y, z \ (bot)$
      ]
      ))
      This shows that in all possible models of $Gam^star$, $Gam^star ent phi^star$

#pagebreak()
= Problem 2
If $phi$ is a sentence in propositional logic, let $phid$ be obtained from $phi$ by negating all of the sentence letters. For example,

$ ((p or (q iimp r))^dag bi not (r and p))^dag = (not p or (not q iimp not r)) bi not (not r and not p) $

+ For any satisfiable propositional formula $phi$, must $phid$ also be satisfiable? Either prove or give a counterexample.


  *Solution:*

  The goal is to show that for any satisfiable propositional formula $phi$, $phi^dag$ is also satisfiable.
  
  
  $phi$  is  satisfiable if there is some function v such that finds a truth assignment such that the sentence evaluates to true:
  $
  exists v . P -> B o o l: ip(phi)_v = T 
  $
  
  $phi^dag$ is obtained from   $phi$ by negating all of the sentence letter. For it to be satisfiable, there must also be a function $v'$ $s.t.$
  
  $
  exists v^' . P -> B o o l: ip(phi^dag)_v' = T 
  $
  
  
  $v'$ being a function that assigns the opposite truth value to each sentence letter from $v$:
  
  
  $
  v'(x) = cases( F space v(x) = T, T space  v(x) = F)
  $
  
  Since $phi^dag$ is obtained by negating every sentence letter in $phi$ and $v'$ negates the truth value of each sentence letter. Evaluating $phi^dag$ with $v^'$ is the same as negating each letter and flipping it assigned truth value. This can be shown using induction:
#pagebreak()
  #pseudo[
  *Proof by induction* 
  - *Goal:* Show that $ip(phi^dag)_(v') = ip(phi)_v$ for all sentences $phi$
  + *$underline("Base case")$*
    + Case 1
      + Let $phi$ be an atomic sentence $p$
      + Then $ip(not p_i)_(v') = ip(p_i)_(v)$,
      + $not ip(p_i)_(v') = ip(p_i)_(v)$
      + And so $not v'(p_i) = v(p_i)$ is trivial by $v'$ definition
    + Case 2
      + Let $phi$ be $T "or "F$:
      + Then $ip(T^dag)_v'= ip(T)_v$
      + $ip(not T)_v' = ip(T)_v$
      + $not ip(T)_v' = ip(T)_v$
      + $not v'(T) = v(T)$ which is trivial by $v'$ definition, and holds for F aswell.
  + *$underline("Inductive hypothesis")$*
    + Assume that $S(phi)def ip(phi^dag)_(v') = ip(phi)_v $
  + *$underline("Inductive step")$*
    + $phi$ can either be negated ($not$) or used with any other operator ($or, and, iimp "or" bi$)
    
    + Case 1 (negation):
      + Show that $S(phi) iimp S(not phi)$
      + By $IH$, this is: $ ip(phi^dag)_(v') = ip(phi)_v iimp ip(not phi^dag)_(v') = ip(not phi)_v $
      + And thus: $ ip(phi^dag)_(v') = ip(phi)_v iimp not ip(phi^dag)_(v') = not ip(phi)_v $
      + $ ip(phi^dag)_v' = ip(phi)_v &iimp not ip(phi^dag)_v' = not ip(phi)_v \
      ip(not phi)_v' = ip(phi)_v &iimp not  ip(not phi)_v' = not ip(phi)_v \  
      not ip( phi)_v' = ip(phi)_v &iimp   ip( phi)_v' = not ip(phi)_v \
      not ip( phi)_v' = ip(phi)_v &iimp   ip( phi)_v' = not ip(phi)_v \
      not v'(phi)= v(phi) &iimp v'(phi) = not v(phi) $
      + Which is trivially true by $v'$ definition
    + Case 2 (other operators)
          #let phr = $dot.o $
        + Let $phr$ be any of the following logical operators $and, or, imp "or" bi$. 
        + Show that if $S(phi) phr S(psi) imp S(phi phr psi)$
        + Then #align($
        (ip(phi^dag)_(v') = ip(phi)_(v)) phr (ip(psi^dag)_(v') = ip(psi)_(v)) &imp ip((phi phr psi)^dag)_(v') = ip(phi phr psi)_(v') \ 
        &imp ip(phi^dag)_(v') phr ip(psi^dag)_(v') = ip(phi)_(v) phr ip(psi)_(v)\
        (ip(not phi)_(v') = ip(phi)_(v)) phr (ip(not psi)_(v') = ip(psi)_(v))
        &imp ip(not phi)_(v') phr ip(not psi)_(v') = ip(phi)_(v) phr ip(psi)_(v)\
        (not ip( phi)_(v') = ip(phi)_(v)) phr (not ip(psi)_(v') = ip(psi)_(v))
        &imp not ip(phi)_(v') phr not ip(psi)_(v') = ip(phi)_(v) phr ip(psi)_(v)\
        (not v'(phi) = v(phi)) phr (not v'(psi) = v(psi))
        &imp not v'(phi) phr not v'(psi) = v(phi) phr v(psi)\
        $)
        + This is trivial by definition of $v'$ and applies to all logical operators. 
  ]

  The proof by induction shows that:
  
  $ ip(phi^dag)_v' = ip(phi)_v  $
  
  And from the definition of satisfiability:
  $ exists v:  ip(phi)_v = T iimp exists v': ip(phi^dag)_v =T $
  
  
  
  
  



 
1. Find a formula $phi$ such that $phi$ is neither a tautology nor a contradiction and $phi$ and $phid$ are logically equivalent? Find one or prove that none exists.

  Assume that $phi$ is satisfiable and falsifiable which means: $  &exists v . P -> bool: ip(phi)_v = T \ &exists f . P -> bool: ip(phi)_f = F $


  From definition 5.8, two sentences $phi, psi$ are logically equivalent if:
  $ forall v: ip(phi)_v = ip(psi)_v $

  
  Let's now assign $
  phi &:= p bi q \
  phi^dag &:= not p bi not q
  $

  
  and from the formulas truth table of possible models:
  
  #figure(
      table(
        columns: (auto, auto, auto, auto, auto, auto),
        inset: 10pt,
        align: center + horizon,
        stroke: 1pt,
  
        [*$p$*], [*$q$*], [*$not p$*], [*$not q$*],[*$p bi q$*], [*$not p bi not q$*],
  
        [T], [T],[F], [F],[T], [T],
        [T], [F],[F], [T],[F], [F],
        [F], [T],[T], [F],[F], [F],
        [F], [F],[T], [T],[T], [T],
      ),
      caption: [truth table of $phi$ and $phi^dag$, \ showing that both $phi$ and $phi^dag$ is satisfiable],
  )<table1>

  From @table1 it can be seen that for both sentences, there exits both a $v,f$ such that the models evaluate to $T$ and $F$.
  For all possible models of assignment for each sentence letter, both sentences evaluates to the same, therefore $phi equiv phi^dag$.

#pagebreak()
= Problem 3
Work in the signature that has sentence letters $p_(i,j)$ for $0 <= i, j <= 9$ (one hundred letters in all). Consider the formula $Phi$ which is the conjunction of all of the following clauses:

- $p_(0,9) and p_(9,0)$,
- $p_(i,j) imp p_(i-1,j)$ for each $1<=i<=9$ and $0<=j<=9$, and
- $p_(i,j) imp p_(i,j-1)$ for each $0<=i<=9$ and $1<=j<=9$.

How many models satisfy $Phi$? (_Hint_. If this seems too daunting, replace 9 with something smaller.)

* Solution *

First of all to complete this problem it is necessary to figure out what the first possible state of the space is based on the given clauses.
It is known from the clauses that both $p_(0,9)$ and $p_(9,0)$ need to be filled out, as this is the first given clause, the next two clauses then also state something that based on the two original points will create a change in the starting space. The 2nd clause states that every cell to the left of a filled out cell, will also need to be filled out, and the third clause states that every cell below any colored cell will also need to be colored.

Then the first state of all the cells can be visualized in a table form like this, where the red cells are the ones filled by the first clause:

#align(center,
  table(
  columns: 10 * (0.6cm,), rows: 10 * (0.65cm,),
  table.cell(fill:red)[x],[],[],[],[],[],[],[],[],[],
  [x],[],[],[],[],[],[],[],[],[],
  [x],[],[],[],[],[],[],[],[],[],
  [x],[],[],[],[],[],[],[],[],[],
  [x],[],[],[],[],[],[],[],[],[],
  [x],[],[],[],[],[],[],[],[],[],
  [x],[],[],[],[],[],[],[],[],[],
  [x],[],[],[],[],[],[],[],[],[],
  [x],[],[],[],[],[],[],[],[],[],
  [x],[x],[x],[x],[x],[x],[x],[x],[x],table.cell(fill:red)[x],
)
)


Then the next step would be to figure out how much is needed to actually fill all the cells, when looking at the build of the table and the clauses, we can sort of imagine that some steps, either normal, steep or very wide would happen when attempting to fill out in every different combination of cells. And since it is a lot of combinations, the logical way forwards would be using combinatorics. 

We can see that the total amount of cells from all the way left to right or top to bottom is 10, so essentially the grid is $10 times 10$ but since the first row and column is filled by the clauses we know that it is know a $9 times 9$ grid, and due to the 2nd and 3rd clause we know that they will fill out in a way that fills a lot of cells and combinations at a time, meaning that we can essentially only take 9 steps to the right or 9 steps up.

Now it can just be entered into the combination formula given on form:
$ attach(C, br: r, tl: n) = n! / (r! dot (n-r)!) $

Where $n$ is the total amount of moves that can be done, and $r$ is the max amount of moves that can be done in one step.

Then we can add the numbers from our actual task where we know that there is essentially a total of 18 steps and 9 steps that can be taken in one step.

$ attach(C, br: 9, tl: 18) = 18! / (9! dot (18-9)!) = 48620 $

Meaning that there is a total of 48620 models that satisfy the given clauses.



