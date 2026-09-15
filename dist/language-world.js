(function (root) {
  "use strict";

  const registry = root.HouseHelperLanguagePacks;
  if (!registry || !Array.isArray(registry.packs)) return;

  const buildModule = (prefix, id, level, title, icon, kind, description, rows) => ({
    id: prefix + "-" + id,
    level,
    title,
    icon,
    kind,
    description,
    cards: rows.map(([cardId, prompt, answer, pronunciation, note]) => ({
      id: prefix + "-" + id + "-" + cardId,
      prompt,
      answer,
      pronunciation: pronunciation || "",
      note: note || "",
      kind,
      level,
    })),
  });

  const extendPack = (packId, prefix, modules) => {
    const pack = registry.packs.find((item) => item.id === packId);
    if (!pack) return;
    pack.levels = ["A1", "A2"];
    pack.cefrMax = "A2";
    pack.description = "A practical offline pathway through everyday " + pack.name + " foundations.";
    pack.modules.push(...modules.map((definition) => buildModule(prefix, ...definition)));
  };

  extendPack("spanish", "es", [
    ["people", "A1", "People & family", "👨‍👩‍👧", "vocabulary", "Talk about relatives, friends, and simple descriptions.", [
      ["mother", "the mother", "la madre"], ["father", "the father", "el padre"], ["daughter", "the daughter", "la hija"], ["son", "the son", "el hijo"],
      ["sister", "the sister", "la hermana"], ["brother", "the brother", "el hermano"], ["child", "the child", "el niño / la niña"], ["parents", "the parents", "los padres"],
      ["young", "young", "joven"], ["old", "old", "mayor"], ["kind", "kind / nice", "amable"], ["funny", "funny", "divertido / divertida"],
    ]],
    ["home", "A1", "Home & belongings", "🏠", "vocabulary", "Name common rooms and things at home.", [
      ["house", "the house", "la casa"], ["kitchen", "the kitchen", "la cocina"], ["bedroom", "the bedroom", "el dormitorio"], ["bathroom", "the bathroom", "el baño"],
      ["door", "the door", "la puerta"], ["window", "the window", "la ventana"], ["table", "the table", "la mesa"], ["chair", "the chair", "la silla"],
      ["bed", "the bed", "la cama"], ["key", "the key", "la llave"], ["phone", "the phone", "el teléfono"], ["clean", "clean", "limpio / limpia"],
    ]],
    ["food", "A1", "Food & meals", "🍽️", "vocabulary", "Handle simple family meals and preferences.", [
      ["bread", "bread", "el pan"], ["milk", "milk", "la leche"], ["fruit", "fruit", "la fruta"], ["vegetables", "vegetables", "las verduras"],
      ["breakfast", "breakfast", "el desayuno"], ["lunch", "lunch", "el almuerzo"], ["dinner", "dinner", "la cena"], ["hungry", "I am hungry.", "Tengo hambre."],
      ["thirsty", "I am thirsty.", "Tengo sed."], ["delicious", "It is delicious.", "Está delicioso."], ["want", "I want water.", "Quiero agua."], ["bill", "The bill, please.", "La cuenta, por favor."],
    ]],
    ["time", "A1", "Time & routine", "🕒", "phrases", "Say when everyday activities happen.", [
      ["today", "today", "hoy"], ["tomorrow", "tomorrow", "mañana"], ["yesterday", "yesterday", "ayer"], ["morning", "in the morning", "por la mañana"],
      ["afternoon", "in the afternoon", "por la tarde"], ["night", "at night", "por la noche"], ["week", "the week", "la semana"], ["weekend", "the weekend", "el fin de semana"],
      ["time", "What time is it?", "¿Qué hora es?"], ["one", "It is one o’clock.", "Es la una."], ["two", "It is two o’clock.", "Son las dos."], ["late", "I am late.", "Llego tarde."],
    ]],
    ["daily-verbs", "A2", "Daily verbs in context", "🏃", "grammar", "Use common present-tense verbs in complete thoughts.", [
      ["wake", "I wake up at seven.", "Me despierto a las siete."], ["work", "My parents work from home.", "Mis padres trabajan desde casa."], ["study", "We study Spanish every day.", "Estudiamos español todos los días."], ["cook", "She cooks dinner.", "Ella prepara la cena."],
      ["leave", "They leave early.", "Salen temprano."], ["return", "I return home at six.", "Vuelvo a casa a las seis."], ["read", "He reads before bed.", "Él lee antes de dormir."], ["sleep", "The children sleep well.", "Los niños duermen bien."],
      ["can", "I can help you.", "Puedo ayudarte."], ["must", "We have to clean the kitchen.", "Tenemos que limpiar la cocina."], ["prefer", "I prefer to walk.", "Prefiero caminar."], ["know", "Do you know the answer?", "¿Sabes la respuesta?"],
    ]],
    ["past", "A2", "Talking about the past", "↩️", "grammar", "Recall completed everyday events.", [
      ["went", "Yesterday I went to the store.", "Ayer fui a la tienda."], ["ate", "We ate together.", "Comimos juntos."], ["saw", "She saw a good movie.", "Ella vio una buena película."], ["made", "I made breakfast.", "Preparé el desayuno."],
      ["arrived", "They arrived late.", "Llegaron tarde."], ["called", "My friend called me.", "Mi amigo me llamó."], ["was", "The weather was beautiful.", "Hizo buen tiempo."], ["had", "We had a problem.", "Tuvimos un problema."],
      ["weekend", "What did you do this weekend?", "¿Qué hiciste este fin de semana?"], ["never", "I have never visited Spain.", "Nunca he visitado España."], ["already", "I have already finished.", "Ya he terminado."], ["yet", "Have you eaten yet?", "¿Ya has comido?"],
    ]],
    ["travel", "A2", "Travel & directions", "🧭", "dialogue", "Get around and solve common travel needs.", [
      ["station", "Where is the train station?", "¿Dónde está la estación de tren?"], ["ticket", "I would like a ticket to Madrid.", "Quisiera un billete a Madrid."], ["left", "Turn left.", "Gire a la izquierda."], ["right", "Turn right.", "Gire a la derecha."],
      ["straight", "Go straight ahead.", "Siga todo recto."], ["near", "Is it nearby?", "¿Está cerca?"], ["far", "It is quite far.", "Está bastante lejos."], ["reservation", "I have a reservation.", "Tengo una reserva."],
      ["room", "The room is not ready.", "La habitación no está lista."], ["lost", "I am lost.", "Estoy perdido / perdida."], ["help", "Can you help me?", "¿Puede ayudarme?"], ["bus", "Which bus goes downtown?", "¿Qué autobús va al centro?"],
    ]],
    ["connections", "A2", "Reasons, plans & opinions", "💬", "phrases", "Link ideas and take part in simple discussions.", [
      ["because", "I stayed home because it was raining.", "Me quedé en casa porque llovía."], ["but", "I like it, but it is expensive.", "Me gusta, pero es caro."], ["although", "Although I am tired, I will go.", "Aunque estoy cansado, voy a ir."], ["therefore", "It is late, so we should leave.", "Es tarde, por eso debemos irnos."],
      ["plan", "We are going to visit our family.", "Vamos a visitar a nuestra familia."], ["hope", "I hope the weather is good.", "Espero que haga buen tiempo."], ["think", "I think it is a good idea.", "Creo que es una buena idea."], ["agree", "I agree with you.", "Estoy de acuerdo contigo."],
      ["disagree", "I do not agree.", "No estoy de acuerdo."], ["maybe", "Maybe we can go tomorrow.", "Quizás podamos ir mañana."], ["first", "First we need a plan.", "Primero necesitamos un plan."], ["finally", "Finally, everything worked out.", "Al final, todo salió bien."],
    ]],
  ]);

  extendPack("french", "fr", [
    ["people", "A1", "People & family", "👨‍👩‍👧", "vocabulary", "Talk about relatives, friends, and simple descriptions.", [
      ["mother", "the mother", "la mère"], ["father", "the father", "le père"], ["daughter", "the daughter", "la fille"], ["son", "the son", "le fils"],
      ["sister", "the sister", "la sœur"], ["brother", "the brother", "le frère"], ["child", "the child", "l’enfant"], ["parents", "the parents", "les parents"],
      ["young", "young", "jeune"], ["old", "old", "âgé / âgée"], ["kind", "kind / nice", "gentil / gentille"], ["funny", "funny", "drôle"],
    ]],
    ["home", "A1", "Home & belongings", "🏠", "vocabulary", "Name common rooms and things at home.", [
      ["house", "the house", "la maison"], ["kitchen", "the kitchen", "la cuisine"], ["bedroom", "the bedroom", "la chambre"], ["bathroom", "the bathroom", "la salle de bains"],
      ["door", "the door", "la porte"], ["window", "the window", "la fenêtre"], ["table", "the table", "la table"], ["chair", "the chair", "la chaise"],
      ["bed", "the bed", "le lit"], ["key", "the key", "la clé"], ["phone", "the phone", "le téléphone"], ["clean", "clean", "propre"],
    ]],
    ["food", "A1", "Food & meals", "🍽️", "vocabulary", "Handle simple family meals and preferences.", [
      ["bread", "bread", "le pain"], ["milk", "milk", "le lait"], ["fruit", "fruit", "le fruit"], ["vegetables", "vegetables", "les légumes"],
      ["breakfast", "breakfast", "le petit-déjeuner"], ["lunch", "lunch", "le déjeuner"], ["dinner", "dinner", "le dîner"], ["hungry", "I am hungry.", "J’ai faim."],
      ["thirsty", "I am thirsty.", "J’ai soif."], ["delicious", "It is delicious.", "C’est délicieux."], ["want", "I would like some water.", "Je voudrais de l’eau."], ["bill", "The bill, please.", "L’addition, s’il vous plaît."],
    ]],
    ["time", "A1", "Time & routine", "🕒", "phrases", "Say when everyday activities happen.", [
      ["today", "today", "aujourd’hui"], ["tomorrow", "tomorrow", "demain"], ["yesterday", "yesterday", "hier"], ["morning", "in the morning", "le matin"],
      ["afternoon", "in the afternoon", "l’après-midi"], ["evening", "in the evening", "le soir"], ["week", "the week", "la semaine"], ["weekend", "the weekend", "le week-end"],
      ["time", "What time is it?", "Quelle heure est-il ?"], ["one", "It is one o’clock.", "Il est une heure."], ["two", "It is two o’clock.", "Il est deux heures."], ["late", "I am late.", "Je suis en retard."],
    ]],
    ["daily-verbs", "A2", "Daily verbs in context", "🏃", "grammar", "Use common present-tense verbs in complete thoughts.", [
      ["wake", "I wake up at seven.", "Je me réveille à sept heures."], ["work", "My parents work from home.", "Mes parents travaillent à la maison."], ["study", "We study French every day.", "Nous étudions le français tous les jours."], ["cook", "She prepares dinner.", "Elle prépare le dîner."],
      ["leave", "They leave early.", "Ils partent tôt."], ["return", "I return home at six.", "Je rentre à la maison à six heures."], ["read", "He reads before sleeping.", "Il lit avant de dormir."], ["sleep", "The children sleep well.", "Les enfants dorment bien."],
      ["can", "I can help you.", "Je peux vous aider."], ["must", "We have to clean the kitchen.", "Nous devons nettoyer la cuisine."], ["prefer", "I prefer to walk.", "Je préfère marcher."], ["know", "Do you know the answer?", "Vous connaissez la réponse ?"],
    ]],
    ["past", "A2", "Talking about the past", "↩️", "grammar", "Recall completed everyday events with the past tense.", [
      ["went", "Yesterday I went to the store.", "Hier, je suis allé au magasin."], ["ate", "We ate together.", "Nous avons mangé ensemble."], ["saw", "She saw a good movie.", "Elle a vu un bon film."], ["made", "I made breakfast.", "J’ai préparé le petit-déjeuner."],
      ["arrived", "They arrived late.", "Ils sont arrivés en retard."], ["called", "My friend called me.", "Mon ami m’a appelé."], ["weather", "The weather was beautiful.", "Il faisait beau."], ["had", "We had a problem.", "Nous avons eu un problème."],
      ["weekend", "What did you do this weekend?", "Qu’est-ce que tu as fait ce week-end ?"], ["never", "I have never visited France.", "Je n’ai jamais visité la France."], ["already", "I have already finished.", "J’ai déjà fini."], ["yet", "Have you eaten yet?", "Tu as déjà mangé ?"],
    ]],
    ["travel", "A2", "Travel & directions", "🧭", "dialogue", "Get around and solve common travel needs.", [
      ["station", "Where is the train station?", "Où est la gare ?"], ["ticket", "I would like a ticket to Paris.", "Je voudrais un billet pour Paris."], ["left", "Turn left.", "Tournez à gauche."], ["right", "Turn right.", "Tournez à droite."],
      ["straight", "Go straight ahead.", "Continuez tout droit."], ["near", "Is it nearby?", "C’est près d’ici ?"], ["far", "It is quite far.", "C’est assez loin."], ["reservation", "I have a reservation.", "J’ai une réservation."],
      ["room", "The room is not ready.", "La chambre n’est pas prête."], ["lost", "I am lost.", "Je suis perdu / perdue."], ["help", "Can you help me?", "Pouvez-vous m’aider ?"], ["bus", "Which bus goes downtown?", "Quel bus va au centre-ville ?"],
    ]],
    ["connections", "A2", "Reasons, plans & opinions", "💬", "phrases", "Link ideas and take part in simple discussions.", [
      ["because", "I stayed home because it was raining.", "Je suis resté à la maison parce qu’il pleuvait."], ["but", "I like it, but it is expensive.", "Ça me plaît, mais c’est cher."], ["although", "Although I am tired, I will go.", "Même si je suis fatigué, je vais y aller."], ["therefore", "It is late, so we should leave.", "Il est tard, donc nous devrions partir."],
      ["plan", "We are going to visit our family.", "Nous allons rendre visite à notre famille."], ["hope", "I hope the weather will be good.", "J’espère qu’il fera beau."], ["think", "I think it is a good idea.", "Je pense que c’est une bonne idée."], ["agree", "I agree with you.", "Je suis d’accord avec toi."],
      ["disagree", "I do not agree.", "Je ne suis pas d’accord."], ["maybe", "Maybe we can go tomorrow.", "Peut-être que nous pouvons y aller demain."], ["first", "First we need a plan.", "D’abord, nous avons besoin d’un plan."], ["finally", "Finally, everything worked out.", "Finalement, tout s’est bien passé."],
    ]],
  ]);

  extendPack("japanese", "ja", [
    ["hiragana-a", "A1", "Hiragana: first sounds", "あ", "script", "Recognize the first half of the core hiragana syllabary.", [
      ["a", "the hiragana sound a", "あ", "a"], ["i", "the hiragana sound i", "い", "i"], ["u", "the hiragana sound u", "う", "u"], ["e", "the hiragana sound e", "え", "e"],
      ["o", "the hiragana sound o", "お", "o"], ["ka", "the hiragana sound ka", "か", "ka"], ["ki", "the hiragana sound ki", "き", "ki"], ["ku", "the hiragana sound ku", "く", "ku"],
      ["ke", "the hiragana sound ke", "け", "ke"], ["ko", "the hiragana sound ko", "こ", "ko"], ["sa", "the hiragana sound sa", "さ", "sa"], ["shi", "the hiragana sound shi", "し", "shi"],
    ]],
    ["hiragana-b", "A1", "Hiragana: more sounds", "な", "script", "Continue recognizing common hiragana characters.", [
      ["su", "the hiragana sound su", "す", "su"], ["se", "the hiragana sound se", "せ", "se"], ["so", "the hiragana sound so", "そ", "so"], ["ta", "the hiragana sound ta", "た", "ta"],
      ["chi", "the hiragana sound chi", "ち", "chi"], ["tsu", "the hiragana sound tsu", "つ", "tsu"], ["te", "the hiragana sound te", "て", "te"], ["to", "the hiragana sound to", "と", "to"],
      ["na", "the hiragana sound na", "な", "na"], ["ni", "the hiragana sound ni", "に", "ni"], ["nu", "the hiragana sound nu", "ぬ", "nu"], ["ne", "the hiragana sound ne", "ね", "ne"],
    ]],
    ["people", "A1", "People & family", "👨‍👩‍👧", "vocabulary", "Talk about family and people around you.", [
      ["mother", "mother", "お母さん", "okāsan"], ["father", "father", "お父さん", "otōsan"], ["older-sister", "older sister", "お姉さん", "onēsan"], ["older-brother", "older brother", "お兄さん", "onīsan"],
      ["younger-sister", "younger sister", "妹", "imōto"], ["younger-brother", "younger brother", "弟", "otōto"], ["child", "child", "子ども", "kodomo"], ["person", "person", "人", "hito"],
      ["teacher", "teacher", "先生", "sensei"], ["student", "student", "学生", "gakusei"], ["kind", "kind", "優しい", "yasashii"], ["energetic", "energetic / well", "元気", "genki"],
    ]],
    ["daily-life", "A1", "Home & daily life", "🏠", "phrases", "Name everyday places, objects, and actions.", [
      ["home", "home / house", "家", "ie"], ["room", "room", "部屋", "heya"], ["kitchen", "kitchen", "台所", "daidokoro"], ["bathroom", "bathroom", "お風呂", "ofuro"],
      ["school", "school", "学校", "gakkō"], ["book", "book", "本", "hon"], ["phone", "phone", "電話", "denwa"], ["eat", "to eat", "食べる", "taberu"],
      ["drink", "to drink", "飲む", "nomu"], ["read", "to read", "読む", "yomu"], ["go", "to go", "行く", "iku"], ["return", "to return", "帰る", "kaeru"],
    ]],
    ["particles", "A2", "Particles in useful sentences", "🧩", "grammar", "See how は, が, を, に, で, and と connect ideas.", [
      ["topic", "I am a student.", "私は学生です。", "watashi wa gakusei desu", "は marks the topic and is pronounced wa here."], ["subject", "There is a cat.", "猫がいます。", "neko ga imasu", "が marks the subject."], ["object", "I read a book.", "本を読みます。", "hon o yomimasu", "を marks the direct object."], ["destination", "I go to school.", "学校に行きます。", "gakkō ni ikimasu"],
      ["place", "I study at the library.", "図書館で勉強します。", "toshokan de benkyō shimasu"], ["with", "I eat with my family.", "家族と食べます。", "kazoku to tabemasu"], ["from", "It is from nine o’clock.", "九時からです。", "kuji kara desu"], ["until", "I work until five.", "五時まで働きます。", "goji made hatarakimasu"],
      ["also", "I also like music.", "音楽も好きです。", "ongaku mo suki desu"], ["possession", "This is my bag.", "これは私のかばんです。", "kore wa watashi no kaban desu"], ["question", "What do you eat?", "何を食べますか。", "nani o tabemasu ka"], ["contrast", "Coffee is fine, but tea is better.", "コーヒーはいいですが、お茶のほうが好きです。", "kōhī wa ii desu ga, ocha no hō ga suki desu"],
    ]],
    ["past-requests", "A2", "Past events & requests", "↩️", "grammar", "Talk about what happened and ask politely.", [
      ["went", "Yesterday I went to the park.", "昨日、公園に行きました。", "kinō, kōen ni ikimashita"], ["ate", "I ate sushi.", "すしを食べました。", "sushi o tabemashita"], ["saw", "We watched a movie.", "映画を見ました。", "eiga o mimashita"], ["did-not", "I did not study yesterday.", "昨日は勉強しませんでした。", "kinō wa benkyō shimasen deshita"],
      ["experience", "I have been to Japan.", "日本に行ったことがあります。", "nihon ni itta koto ga arimasu"], ["please", "Please speak slowly.", "ゆっくり話してください。", "yukkuri hanashite kudasai"], ["may", "May I take a picture?", "写真を撮ってもいいですか。", "shashin o totte mo ii desu ka"], ["must", "I have to do my homework.", "宿題をしなければなりません。", "shukudai o shinakereba narimasen"],
      ["want", "I want to drink water.", "水を飲みたいです。", "mizu o nomitai desu"], ["invitation", "Would you like to go together?", "一緒に行きませんか。", "issho ni ikimasen ka"], ["can", "I can read a little Japanese.", "日本語が少し読めます。", "nihongo ga sukoshi yomemasu"], ["try", "Please try eating this.", "これを食べてみてください。", "kore o tabete mite kudasai"],
    ]],
    ["travel", "A2", "Travel & directions", "🧭", "dialogue", "Find places and handle common travel needs.", [
      ["station", "Where is the station?", "駅はどこですか。", "eki wa doko desu ka"], ["ticket", "One ticket, please.", "切符を一枚ください。", "kippu o ichimai kudasai"], ["left", "Please turn left.", "左に曲がってください。", "hidari ni magatte kudasai"], ["right", "Please turn right.", "右に曲がってください。", "migi ni magatte kudasai"],
      ["straight", "Please go straight.", "まっすぐ行ってください。", "massugu itte kudasai"], ["near", "Is it near here?", "ここから近いですか。", "koko kara chikai desu ka"], ["train", "Which train goes to Tokyo?", "どの電車が東京に行きますか。", "dono densha ga tōkyō ni ikimasu ka"], ["reservation", "I have a reservation.", "予約があります。", "yoyaku ga arimasu"],
      ["room", "The room is not ready.", "部屋はまだ準備できていません。", "heya wa mada junbi dekite imasen"], ["lost", "I am lost.", "道に迷いました。", "michi ni mayoimashita"], ["help", "Could you help me?", "手伝ってもらえますか。", "tetsudatte moraemasu ka"], ["luggage", "My luggage is missing.", "荷物が見つかりません。", "nimotsu ga mitsukarimasen"],
    ]],
    ["connections", "A2", "Reasons, plans & opinions", "💬", "phrases", "Connect ideas and share simple opinions.", [
      ["because", "I stayed home because it rained.", "雨が降ったので、家にいました。", "ame ga futta node, ie ni imashita"], ["but", "It is interesting, but difficult.", "面白いですが、難しいです。", "omoshiroi desu ga, muzukashii desu"], ["therefore", "I am tired, so I will sleep early.", "疲れたので、早く寝ます。", "tsukareta node, hayaku nemasu"], ["while", "I listen to music while cooking.", "料理しながら音楽を聞きます。", "ryōri shinagara ongaku o kikimasu"],
      ["plan", "I plan to visit Kyoto.", "京都を訪れる予定です。", "kyōto o otozureru yotei desu"], ["think", "I think this is a good idea.", "これはいい考えだと思います。", "kore wa ii kangae da to omoimasu"], ["opinion", "What do you think?", "どう思いますか。", "dō omoimasu ka"], ["agree", "I agree.", "賛成です。", "sansei desu"],
      ["maybe", "It may rain tomorrow.", "明日は雨かもしれません。", "ashita wa ame kamo shiremasen"], ["first", "First, wash your hands.", "まず、手を洗ってください。", "mazu, te o aratte kudasai"], ["then", "Then, mix everything.", "それから、全部混ぜます。", "sorekara, zenbu mazemasu"], ["finally", "Finally, it was a good day.", "結局、いい一日でした。", "kekkyoku, ii ichinichi deshita"],
    ]],
  ]);

  const italian = {
    id: "italian",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    voice: "it-IT",
    color: "#287d5c",
    levels: ["A1", "A2"],
    cefrMax: "A2",
    description: "A practical offline pathway through everyday Italian foundations.",
    modules: [
      buildModule("it", "essentials", "A1", "Greetings & essentials", "👋", "foundations", "Start with polite, high-frequency expressions.", [
        ["hello", "Hello / good morning", "Buongiorno"], ["hi", "Hi / bye", "Ciao"], ["evening", "Good evening", "Buonasera"], ["goodbye", "Goodbye", "Arrivederci"],
        ["please", "Please", "Per favore"], ["thanks", "Thank you", "Grazie"], ["welcome", "You’re welcome", "Prego"], ["sorry", "I’m sorry", "Mi dispiace"],
        ["yes", "Yes", "Sì"], ["no", "No", "No"], ["understand", "I do not understand.", "Non capisco."], ["slower", "More slowly, please.", "Più lentamente, per favore."],
      ]),
      buildModule("it", "people-home", "A1", "People & home", "🏠", "vocabulary", "Talk about family and common places at home.", [
        ["family", "the family", "la famiglia"], ["mother", "the mother", "la madre"], ["father", "the father", "il padre"], ["daughter", "the daughter", "la figlia"],
        ["son", "the son", "il figlio"], ["friend", "the friend", "l’amico / l’amica"], ["house", "the house", "la casa"], ["kitchen", "the kitchen", "la cucina"],
        ["room", "the room", "la stanza"], ["bathroom", "the bathroom", "il bagno"], ["table", "the table", "il tavolo"], ["bed", "the bed", "il letto"],
      ]),
      buildModule("it", "food-time", "A1", "Food, time & routine", "🍝", "phrases", "Handle meals and simple daily timing.", [
        ["water", "water", "l’acqua"], ["bread", "bread", "il pane"], ["milk", "milk", "il latte"], ["breakfast", "breakfast", "la colazione"],
        ["lunch", "lunch", "il pranzo"], ["dinner", "dinner", "la cena"], ["hungry", "I am hungry.", "Ho fame."], ["thirsty", "I am thirsty.", "Ho sete."],
        ["today", "today", "oggi"], ["tomorrow", "tomorrow", "domani"], ["time", "What time is it?", "Che ore sono?"], ["bill", "The bill, please.", "Il conto, per favore."],
      ]),
      buildModule("it", "daily-verbs", "A2", "Daily verbs in context", "🏃", "grammar", "Use frequent verbs in complete everyday sentences.", [
        ["wake", "I wake up at seven.", "Mi sveglio alle sette."], ["work", "My parents work from home.", "I miei genitori lavorano da casa."], ["study", "We study Italian every day.", "Studiamo italiano ogni giorno."], ["cook", "She prepares dinner.", "Lei prepara la cena."],
        ["leave", "They leave early.", "Partono presto."], ["return", "I return home at six.", "Torno a casa alle sei."], ["read", "He reads before sleeping.", "Legge prima di dormire."], ["sleep", "The children sleep well.", "I bambini dormono bene."],
        ["can", "I can help you.", "Posso aiutarti."], ["must", "We have to clean the kitchen.", "Dobbiamo pulire la cucina."], ["prefer", "I prefer to walk.", "Preferisco camminare."], ["know", "Do you know the answer?", "Sai la risposta?"],
      ]),
      buildModule("it", "past", "A2", "Talking about the past", "↩️", "grammar", "Recall completed events with common past forms.", [
        ["went", "Yesterday I went to the store.", "Ieri sono andato al negozio."], ["ate", "We ate together.", "Abbiamo mangiato insieme."], ["saw", "She saw a good movie.", "Ha visto un bel film."], ["made", "I made breakfast.", "Ho preparato la colazione."],
        ["arrived", "They arrived late.", "Sono arrivati tardi."], ["called", "My friend called me.", "Il mio amico mi ha chiamato."], ["weather", "The weather was beautiful.", "Il tempo era bello."], ["had", "We had a problem.", "Abbiamo avuto un problema."],
        ["weekend", "What did you do this weekend?", "Che cosa hai fatto questo fine settimana?"], ["never", "I have never visited Italy.", "Non ho mai visitato l’Italia."], ["already", "I have already finished.", "Ho già finito."], ["yet", "Have you eaten yet?", "Hai già mangiato?"],
      ]),
      buildModule("it", "travel", "A2", "Travel & directions", "🧭", "dialogue", "Get around and solve common travel needs.", [
        ["station", "Where is the train station?", "Dov’è la stazione ferroviaria?"], ["ticket", "I would like a ticket to Rome.", "Vorrei un biglietto per Roma."], ["left", "Turn left.", "Giri a sinistra."], ["right", "Turn right.", "Giri a destra."],
        ["straight", "Go straight ahead.", "Vada sempre dritto."], ["near", "Is it nearby?", "È qui vicino?"], ["far", "It is quite far.", "È abbastanza lontano."], ["reservation", "I have a reservation.", "Ho una prenotazione."],
        ["room", "The room is not ready.", "La camera non è pronta."], ["lost", "I am lost.", "Mi sono perso / persa."], ["help", "Can you help me?", "Può aiutarmi?"], ["bus", "Which bus goes downtown?", "Quale autobus va in centro?"],
      ]),
      buildModule("it", "connections", "A2", "Reasons, plans & opinions", "💬", "phrases", "Connect ideas and share everyday opinions.", [
        ["because", "I stayed home because it was raining.", "Sono rimasto a casa perché pioveva."], ["but", "I like it, but it is expensive.", "Mi piace, ma è costoso."], ["although", "Although I am tired, I will go.", "Anche se sono stanco, andrò."], ["therefore", "It is late, so we should leave.", "È tardi, quindi dovremmo partire."],
        ["plan", "We are going to visit our family.", "Andremo a trovare la nostra famiglia."], ["hope", "I hope the weather is good.", "Spero che faccia bel tempo."], ["think", "I think it is a good idea.", "Penso che sia una buona idea."], ["agree", "I agree with you.", "Sono d’accordo con te."],
        ["disagree", "I do not agree.", "Non sono d’accordo."], ["maybe", "Maybe we can go tomorrow.", "Forse possiamo andare domani."], ["first", "First we need a plan.", "Prima ci serve un piano."], ["finally", "Finally, everything worked out.", "Alla fine, è andato tutto bene."],
      ]),
    ],
  };

  const mandarin = {
    id: "mandarin",
    name: "Mandarin Chinese",
    nativeName: "普通话",
    flag: "🇨🇳",
    voice: "zh-CN",
    color: "#b23a35",
    levels: ["A1", "A2"],
    cefrMax: "A2",
    description: "A pinyin-supported offline pathway through everyday Mandarin foundations.",
    modules: [
      buildModule("zh", "tones", "A1", "Pinyin & tones", "声", "script", "Hear how tone changes meaning and recognize useful syllables.", [
        ["tone1", "first tone: high and level", "mā", "妈 · mother"], ["tone2", "second tone: rising", "má", "麻 · hemp"], ["tone3", "third tone: low or dipping", "mǎ", "马 · horse"], ["tone4", "fourth tone: falling", "mà", "骂 · to scold"],
        ["neutral", "neutral tone: light and short", "ma", "吗 · question particle"], ["ni", "you", "你", "nǐ"], ["hao", "good", "好", "hǎo"], ["shi", "to be", "是", "shì"],
        ["bu", "not", "不", "bù"], ["wo", "I / me", "我", "wǒ"], ["ren", "person", "人", "rén"], ["zhong", "middle / China", "中", "zhōng"],
      ]),
      buildModule("zh", "essentials", "A1", "Greetings & essentials", "👋", "foundations", "Start with polite, high-frequency expressions.", [
        ["hello", "Hello", "你好", "nǐ hǎo"], ["morning", "Good morning", "早上好", "zǎoshang hǎo"], ["goodbye", "Goodbye", "再见", "zàijiàn"], ["thanks", "Thank you", "谢谢", "xièxie"],
        ["welcome", "You’re welcome", "不客气", "bú kèqi"], ["sorry", "I’m sorry", "对不起", "duìbuqǐ"], ["okay", "It is okay.", "没关系", "méi guānxi"], ["please", "please", "请", "qǐng"],
        ["yes", "Yes / correct", "对", "duì"], ["no", "No / not correct", "不对", "bú duì"], ["understand", "I do not understand.", "我不明白。", "wǒ bù míngbai"], ["slower", "Please speak more slowly.", "请说慢一点。", "qǐng shuō màn yìdiǎn"],
      ]),
      buildModule("zh", "family-time", "A1", "Family, numbers & time", "🏠", "vocabulary", "Talk about family and simple times.", [
        ["family", "family", "家", "jiā"], ["mother", "mother", "妈妈", "māma"], ["father", "father", "爸爸", "bàba"], ["daughter", "daughter", "女儿", "nǚ’ér"],
        ["son", "son", "儿子", "érzi"], ["friend", "friend", "朋友", "péngyou"], ["one", "one", "一", "yī"], ["two", "two", "二", "èr"],
        ["three", "three", "三", "sān"], ["today", "today", "今天", "jīntiān"], ["tomorrow", "tomorrow", "明天", "míngtiān"], ["time", "What time is it?", "现在几点？", "xiànzài jǐ diǎn"],
      ]),
      buildModule("zh", "food-home", "A1", "Food & home", "🍜", "phrases", "Handle basic meals and things around the home.", [
        ["water", "water", "水", "shuǐ"], ["rice", "cooked rice", "米饭", "mǐfàn"], ["noodles", "noodles", "面条", "miàntiáo"], ["vegetables", "vegetables", "蔬菜", "shūcài"],
        ["tea", "tea", "茶", "chá"], ["eat", "to eat", "吃", "chī"], ["drink", "to drink", "喝", "hē"], ["delicious", "It is delicious.", "很好吃。", "hěn hǎochī"],
        ["house", "house / home", "家", "jiā"], ["room", "room", "房间", "fángjiān"], ["kitchen", "kitchen", "厨房", "chúfáng"], ["want", "I want some water.", "我要水。", "wǒ yào shuǐ"],
      ]),
      buildModule("zh", "daily-grammar", "A2", "Daily grammar patterns", "🧩", "grammar", "Build complete thoughts with common Mandarin patterns.", [
        ["have", "I have a younger sister.", "我有一个妹妹。", "wǒ yǒu yí ge mèimei"], ["location", "The book is on the table.", "书在桌子上。", "shū zài zhuōzi shàng"], ["doing", "I am eating.", "我在吃饭。", "wǒ zài chīfàn"], ["completed", "I ate already.", "我吃饭了。", "wǒ chīfàn le"],
        ["experience", "I have been to China.", "我去过中国。", "wǒ qùguo zhōngguó"], ["can-skill", "I can speak a little Chinese.", "我会说一点中文。", "wǒ huì shuō yìdiǎn zhōngwén"], ["can-permission", "Can I sit here?", "我可以坐这里吗？", "wǒ kěyǐ zuò zhèlǐ ma"], ["must", "I have to do homework.", "我得做作业。", "wǒ děi zuò zuòyè"],
        ["compare", "Today is colder than yesterday.", "今天比昨天冷。", "jīntiān bǐ zuótiān lěng"], ["more", "Please speak a little more slowly.", "请说得慢一点。", "qǐng shuō de màn yìdiǎn"], ["question", "What are you doing?", "你在做什么？", "nǐ zài zuò shénme"], ["how", "How do we get there?", "我们怎么去那里？", "wǒmen zěnme qù nàli"],
      ]),
      buildModule("zh", "past-plans", "A2", "Past events & plans", "↩️", "phrases", "Talk about completed events and what comes next.", [
        ["went", "Yesterday I went to the store.", "昨天我去了商店。", "zuótiān wǒ qù le shāngdiàn"], ["ate", "We ate together.", "我们一起吃了饭。", "wǒmen yìqǐ chī le fàn"], ["saw", "She watched a good movie.", "她看了一部好电影。", "tā kàn le yí bù hǎo diànyǐng"], ["called", "My friend called me.", "我的朋友给我打了电话。", "wǒ de péngyou gěi wǒ dǎ le diànhuà"],
        ["not-yet", "I have not finished yet.", "我还没做完。", "wǒ hái méi zuòwán"], ["already", "I have already eaten.", "我已经吃过了。", "wǒ yǐjīng chīguo le"], ["tomorrow", "Tomorrow I plan to study.", "明天我打算学习。", "míngtiān wǒ dǎsuàn xuéxí"], ["want", "I want to visit Beijing.", "我想去北京。", "wǒ xiǎng qù běijīng"],
        ["will", "It will rain tomorrow.", "明天会下雨。", "míngtiān huì xiàyǔ"], ["weekend", "What did you do this weekend?", "这个周末你做了什么？", "zhège zhōumò nǐ zuò le shénme"], ["first", "First, we will eat.", "我们先吃饭。", "wǒmen xiān chīfàn"], ["then", "Then we will go home.", "然后我们回家。", "ránhòu wǒmen huí jiā"],
      ]),
      buildModule("zh", "travel-opinions", "A2", "Travel & opinions", "🧭", "dialogue", "Get around, ask for help, and share simple views.", [
        ["station", "Where is the train station?", "火车站在哪里？", "huǒchēzhàn zài nǎli"], ["ticket", "I want one ticket to Beijing.", "我要一张去北京的票。", "wǒ yào yì zhāng qù běijīng de piào"], ["left", "Turn left.", "向左转。", "xiàng zuǒ zhuǎn"], ["right", "Turn right.", "向右转。", "xiàng yòu zhuǎn"],
        ["straight", "Go straight ahead.", "一直往前走。", "yìzhí wǎng qián zǒu"], ["reservation", "I have a reservation.", "我有预订。", "wǒ yǒu yùdìng"], ["lost", "I am lost.", "我迷路了。", "wǒ mílù le"], ["help", "Can you help me?", "你能帮我吗？", "nǐ néng bāng wǒ ma"],
        ["because", "I stayed home because it rained.", "因为下雨，所以我待在家里。", "yīnwèi xiàyǔ, suǒyǐ wǒ dāi zài jiālǐ"], ["think", "I think this is a good idea.", "我觉得这是个好主意。", "wǒ juéde zhè shì ge hǎo zhǔyi"], ["agree", "I agree with you.", "我同意你的看法。", "wǒ tóngyì nǐ de kànfǎ"], ["maybe", "Maybe we can go tomorrow.", "也许我们明天可以去。", "yěxǔ wǒmen míngtiān kěyǐ qù"],
      ]),
    ],
  };

  registry.packs.push(italian, mandarin);
})(typeof window === "undefined" ? globalThis : window);
