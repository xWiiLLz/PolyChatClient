# PolyChat - Équipe 042
Voici notre application cliente pour le TD2 du cours LOG2420 (Analyse et conception d'interfaces utilisateur) de la Polytechnique Montréal, poussé plus loin! :D

## Architecture
Notre conception est réalisée selon l'architecture MVC. Vous trouverez le contrôleur 
dans le fichier controller.js, le modèle dans le fichier models.js ainsi que les diverses
vues dans le fichier views.js.

## Librairies utilisées
Afin d'obtenir des performances optimales, nous avons réalisé l'application entièrement en javascript (en utilisant les notions de la nouvelle syntaxe **ES6**), à l'exception d'une seule librairie: sanitize-html.
Nous utilisons cette dernière pour s'assurer de l'intégrité des messages que nous injectons dans le DOM depuis les propriétés 'innerHTML' des éléments, tout en conservant la possibilité d'inclure des balises sur la liste blanche (tels les img, ul, li).

Une version minifiée de sanitize-html est inclue dans le projet. La librairie open-source est disponible sur GitHub à l'adresse suivante: 
https://github.com/punkave/sanitize-html


## Support des fureteurs
Nous avons développé notre application en nous basant principalement sur le fureteur Google Chrome (Version 70.0.3538.102 (Official Build) (64-bit), Windows 10), mais elle devrait toutefois fonctionner sur une version récente des autres fureteurs comme Firefox.

Afin d'obtenir la meilleure fidélité quant à l'aspect visuel de l'application, il est ainsi recommandée de la tester sous une version récente de Google Chrome. 


## Point d'entrée de l'application
Le point d'entrée se situe dans le fichier main.js par la fonction asynchrone *entryPoint*,
qui est invoquée au bas complètement du fichier.


## Connexion instable au serveur de Poly
Notre application a une grande tolérance à l'instabilité de la connexion WebSocket avec le serveur distant. La reconnexion automatique est implémentée, et l'utilisateur se voit notifié par une *modal* faite-maison lorsqu'il y a lieu.

Toutefois, si la stabilité du serveur **officiel** de Polytechnique (*ws://log2420-nginx.info.polymtl.ca/chatservice?username=votre-nom*) gêne votre capacité à tester l'intégrité des fonctionnalités offertes, il vous est possible de vous connecter à un serveur que j'ai réalisé spécialement pour le projet **PolyChat** (*'ws://inter-host.ca:3000/chatservice?username=votre-nom'*).

Pour ce faire, simplement changer la constante au début du fichier *main.js* (**const baseURL = knownHosts[1]**) pour l'indice **0**;

Veuillez noter que le protocole ainsi que les événements supportés et envoyés par le serveur alternatif **sont parfaitement équivalents**, et que l'utilisation du serveur alternatif **ne nous avantage en aucun cas, si ce n'est que par sa stabilité**.


## Gestion des erreurs
Vous pourrez remarquer que les erreurs sont notifiés à l'utilisateur par notre *modal* faite-maison implémentée dans la vue ayant comme classe **ErrorsModalView**. 

Cependant, comme dans toute application moderne qui se respecte, des messages d'erreur sont affichés à l'utilisateur **avant** d'arriver à envoyer des messages non-conformes au serveur. Un exemple de tels erreurs affichés à priori au client sont disponibles dans les *modals* du choix du nom d'utilisateur (vue implémentée dans la classe **UsernameChooserView**) ainsi que de l'ajout d'un nouveau groupe (vue implémentée dans la classe **AddGroupView**). Pour les amorçer, simplement tenter d'envoyer un nom d'utilisateur invalide (**<3** ou **>15**) ou un groupe invalide (**<5** ou **>20**).

Si vous souhaitez consulter l'affichage d'une erreur retournée par le serveur, il faut soit:
- [**RECOMMANDÉ**] Exécuter le code suivant dans la console JavaScript de votre fureteur: `window.connectionHandler.emit('onCreateChannel', null, '1');`

ou;
- Modifier les méthodes de validation du username ou de l'ajout du groupe pour retourner **true** à une valeur invalide, puis essayer de l'envoyer au serveur.  
