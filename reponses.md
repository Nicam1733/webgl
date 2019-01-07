
# TP 3

On constate lors de l'affichage que l'on ne voit aps la face avant car webgl affiche le point le plus eloigné.
Pour remedier a cela on dit a webgl de rendre les points les plus proches c'est a dire que les points vont "s'arreter" des la premiere position.

Le Depth buffer (ou Z buffer) permet de déterminer quels éléments de la scène doivent être rendus, lesquels sont cachés par d'autres et dans quel ordre l'affichage des primitives doit se faire.