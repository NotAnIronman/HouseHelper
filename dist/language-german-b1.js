(function (root) {
  "use strict";

  const registry = root.HouseHelperLanguagePacks;
  if (!registry || !Array.isArray(registry.packs)) return;
  const pack = registry.packs.find((item) => item.id === "german");
  if (!pack) return;

  const module = (id, level, title, icon, kind, description, rows) => ({
    id: "de-" + id,
    level,
    title,
    icon,
    kind,
    description,
    cards: rows.map(([cardId, prompt, answer, note]) => ({
      id: "de-" + id + "-" + cardId,
      prompt,
      answer,
      pronunciation: "",
      note: note || "",
      kind,
      level,
    })),
  });

  pack.levels = ["A1", "A2", "B1"];
  pack.cefrMax = "B1";
  pack.description = "A complete foundation-to-intermediate pathway for everyday German.";
  pack.modules.push(
    module("people", "A1", "People & descriptions", "🙂", "vocabulary", "Describe the people around you.", [
      ["person", "the person", "die Person"], ["man", "the man", "der Mann"], ["woman", "the woman", "die Frau"], ["friend-m", "the male friend", "der Freund"],
      ["friend-f", "the female friend", "die Freundin"], ["young", "young", "jung"], ["old", "old", "alt"], ["tall", "tall", "groß"],
      ["short", "short (height)", "klein"], ["friendly", "friendly", "freundlich"], ["funny", "funny", "lustig"], ["quiet", "quiet", "ruhig"],
    ]),
    module("school", "A1", "School & learning", "🎒", "vocabulary", "Useful classroom and study words.", [
      ["school", "the school", "die Schule"], ["teacher-m", "the male teacher", "der Lehrer"], ["teacher-f", "the female teacher", "die Lehrerin"], ["student", "the student", "der Schüler / die Schülerin"],
      ["book", "the book", "das Buch"], ["notebook", "the notebook", "das Heft"], ["pen", "the pen", "der Stift"], ["question", "the question", "die Frage"],
      ["answer", "the answer", "die Antwort"], ["homework", "the homework", "die Hausaufgaben"], ["easy", "easy", "einfach"], ["difficult", "difficult", "schwierig"],
    ]),
    module("time", "A1", "Time & calendar", "🕒", "vocabulary", "Talk about days, dates, and time.", [
      ["today", "today", "heute"], ["yesterday", "yesterday", "gestern"], ["tomorrow", "tomorrow", "morgen"], ["morning", "the morning", "der Morgen"],
      ["afternoon", "the afternoon", "der Nachmittag"], ["evening", "the evening", "der Abend"], ["night", "the night", "die Nacht"], ["week", "the week", "die Woche"],
      ["month", "the month", "der Monat"], ["year", "the year", "das Jahr"], ["hour", "the hour", "die Stunde"], ["minute", "the minute", "die Minute"],
    ]),
    module("weather", "A1", "Weather & seasons", "🌦️", "vocabulary", "Understand simple forecasts and seasons.", [
      ["weather", "the weather", "das Wetter"], ["sun", "the sun", "die Sonne"], ["rain", "the rain", "der Regen"], ["snow", "the snow", "der Schnee"],
      ["wind", "the wind", "der Wind"], ["warm", "warm", "warm"], ["cold", "cold", "kalt"], ["spring", "spring", "der Frühling"],
      ["summer", "summer", "der Sommer"], ["autumn", "autumn", "der Herbst"], ["winter", "winter", "der Winter"], ["cloudy", "cloudy", "bewölkt"],
    ]),
    module("clothes", "A1", "Clothes & getting ready", "👕", "vocabulary", "Name everyday clothes and accessories.", [
      ["shirt", "the shirt", "das Hemd"], ["tshirt", "the T-shirt", "das T-Shirt"], ["pants", "the pants", "die Hose"], ["dress", "the dress", "das Kleid"],
      ["jacket", "the jacket", "die Jacke"], ["shoes", "the shoes", "die Schuhe"], ["socks", "the socks", "die Socken"], ["hat", "the hat", "der Hut"],
      ["coat", "the coat", "der Mantel"], ["wear", "to wear / carry", "tragen"], ["put-on", "to put on", "anziehen"], ["fits", "That fits well.", "Das passt gut."],
    ]),
    module("shopping", "A1", "Shopping & money", "🛒", "phrases", "Buy simple items and ask about prices.", [
      ["shop", "the store", "das Geschäft"], ["market", "the market", "der Markt"], ["money", "the money", "das Geld"], ["euro", "the euro", "der Euro"],
      ["price", "the price", "der Preis"], ["cheap", "cheap", "billig"], ["expensive", "expensive", "teuer"], ["buy", "to buy", "kaufen"],
      ["pay", "to pay", "bezahlen"], ["cost", "How much does that cost?", "Wie viel kostet das?"], ["take", "I’ll take that.", "Ich nehme das."], ["receipt", "the receipt", "der Kassenbon"],
    ]),
    module("city", "A1", "City & directions", "🗺️", "phrases", "Find common places and follow directions.", [
      ["city", "the city", "die Stadt"], ["street", "the street", "die Straße"], ["station", "the train station", "der Bahnhof"], ["bus-stop", "the bus stop", "die Bushaltestelle"],
      ["hospital", "the hospital", "das Krankenhaus"], ["pharmacy", "the pharmacy", "die Apotheke"], ["left", "left", "links"], ["right", "right", "rechts"],
      ["straight", "straight ahead", "geradeaus"], ["near", "near", "in der Nähe"], ["far", "far away", "weit weg"], ["how-get", "How do I get there?", "Wie komme ich dorthin?"],
    ]),
    module("body", "A1", "Body & basic health", "🩺", "phrases", "Name body parts and explain simple symptoms.", [
      ["head", "the head", "der Kopf"], ["hand", "the hand", "die Hand"], ["foot", "the foot", "der Fuß"], ["eye", "the eye", "das Auge"],
      ["ear", "the ear", "das Ohr"], ["stomach", "the stomach", "der Bauch"], ["doctor", "the doctor", "der Arzt / die Ärztin"], ["medicine", "the medicine", "die Medizin"],
      ["pain", "pain", "Schmerzen"], ["headache", "I have a headache.", "Ich habe Kopfschmerzen."], ["better", "I feel better.", "Mir geht es besser."], ["hurt", "Where does it hurt?", "Wo tut es weh?"],
    ]),

    module("routine", "A2", "Daily routine sentences", "☀️", "phrases", "Connect familiar actions into complete sentences.", [
      ["wake", "I wake up at seven.", "Ich wache um sieben Uhr auf."], ["shower", "I take a shower.", "Ich dusche."], ["breakfast", "We eat breakfast together.", "Wir frühstücken zusammen."], ["leave", "She leaves the house early.", "Sie verlässt früh das Haus."],
      ["school", "The children go to school.", "Die Kinder gehen zur Schule."], ["work", "I work until five.", "Ich arbeite bis fünf Uhr."], ["dinner", "We cook dinner.", "Wir kochen das Abendessen."], ["clean", "Afterward I clean the kitchen.", "Danach putze ich die Küche."],
      ["relax", "In the evening we relax.", "Am Abend entspannen wir uns."], ["bed", "He goes to bed at nine.", "Er geht um neun Uhr ins Bett."], ["usually", "usually", "normalerweise"], ["sometimes", "sometimes", "manchmal"],
    ]),
    module("transport", "A2", "Travel & transportation", "🚆", "phrases", "Plan and describe ordinary journeys.", [
      ["train", "the train", "der Zug"], ["bus", "the bus", "der Bus"], ["ticket", "the ticket", "die Fahrkarte"], ["platform", "the platform", "der Bahnsteig"],
      ["depart", "to depart", "abfahren"], ["arrive", "to arrive", "ankommen"], ["change", "to change trains", "umsteigen"], ["delay", "the delay", "die Verspätung"],
      ["return", "a return ticket", "eine Hin- und Rückfahrkarte"], ["next", "When does the next train leave?", "Wann fährt der nächste Zug?"], ["seat", "Is this seat free?", "Ist dieser Platz frei?"], ["missed", "I missed the bus.", "Ich habe den Bus verpasst."],
    ]),
    module("restaurant", "A2", "Restaurant conversations", "🍽️", "dialogue", "Order, ask questions, and handle the bill.", [
      ["table", "A table for four, please.", "Einen Tisch für vier, bitte."], ["menu", "May I have the menu?", "Kann ich die Speisekarte haben?"], ["order", "We would like to order.", "Wir möchten bestellen."], ["recommend", "What do you recommend?", "Was empfehlen Sie?"],
      ["vegetarian", "Is this vegetarian?", "Ist das vegetarisch?"], ["without", "Without onions, please.", "Ohne Zwiebeln, bitte."], ["water", "One bottle of water, please.", "Eine Flasche Wasser, bitte."], ["tastes", "It tastes very good.", "Es schmeckt sehr gut."],
      ["bill", "The bill, please.", "Die Rechnung, bitte."], ["card", "Can I pay by card?", "Kann ich mit Karte bezahlen?"], ["together", "Together or separately?", "Zusammen oder getrennt?"], ["separate", "We’ll pay separately.", "Wir zahlen getrennt."],
    ]),
    module("perfect", "A2", "Talking about the past", "⏮️", "grammar", "Use the conversational perfect tense.", [
      ["did", "I did my homework.", "Ich habe meine Hausaufgaben gemacht."], ["ate", "We ate together.", "Wir haben zusammen gegessen."], ["saw", "She saw the film.", "Sie hat den Film gesehen."], ["read", "He read the book.", "Er hat das Buch gelesen."],
      ["went", "I went to Berlin.", "Ich bin nach Berlin gefahren."], ["came", "They came home late.", "Sie sind spät nach Hause gekommen."], ["stayed", "We stayed at home.", "Wir sind zu Hause geblieben."], ["woke", "The child woke up early.", "Das Kind ist früh aufgewacht."],
      ["already", "I have already finished.", "Ich bin schon fertig geworden."], ["never", "I have never tried that.", "Ich habe das noch nie probiert."], ["yesterday", "What did you do yesterday?", "Was hast du gestern gemacht?"], ["weekend", "How was your weekend?", "Wie war dein Wochenende?"],
    ]),
    module("modals", "A2", "Modal verbs", "🧩", "grammar", "Express ability, duty, permission, and wishes.", [
      ["can", "I can swim.", "Ich kann schwimmen."], ["must", "We have to leave now.", "Wir müssen jetzt gehen."], ["may", "May I come in?", "Darf ich reinkommen?"], ["should", "You should rest.", "Du solltest dich ausruhen."],
      ["want", "She wants to learn German.", "Sie will Deutsch lernen."], ["would-like", "I would like some tea.", "Ich möchte einen Tee."], ["cannot", "I cannot come today.", "Ich kann heute nicht kommen."], ["must-not", "You must not touch that.", "Du darfst das nicht anfassen."],
      ["need", "Do we have to book it?", "Müssen wir das reservieren?"], ["help", "Can you help me?", "Kannst du mir helfen?"], ["allowed", "Are children allowed to play here?", "Dürfen Kinder hier spielen?"], ["advice", "What should I do?", "Was soll ich tun?"],
    ]),
    module("chores", "A2", "Home & chores", "🧹", "phrases", "Coordinate household work in German.", [
      ["tidy", "to tidy the room", "das Zimmer aufräumen"], ["vacuum", "to vacuum", "staubsaugen"], ["dishes", "to wash the dishes", "das Geschirr spülen"], ["laundry", "to do the laundry", "die Wäsche waschen"],
      ["trash", "to take out the trash", "den Müll rausbringen"], ["table", "to set the table", "den Tisch decken"], ["feed", "to feed the pet", "das Haustier füttern"], ["finished", "I’m finished with my chore.", "Ich bin mit meiner Aufgabe fertig."],
      ["turn", "It’s your turn today.", "Du bist heute dran."], ["later", "I’ll do it later.", "Ich mache es später."], ["together", "Let’s do it together.", "Machen wir es zusammen."], ["thanks", "Thanks for helping.", "Danke für deine Hilfe."],
    ]),
    module("nature", "A2", "Nature & outdoors", "🌲", "vocabulary", "Talk about landscapes, animals, and activities.", [
      ["forest", "the forest", "der Wald"], ["mountain", "the mountain", "der Berg"], ["river", "the river", "der Fluss"], ["lake", "the lake", "der See"],
      ["sea", "the sea", "das Meer"], ["animal", "the animal", "das Tier"], ["bird", "the bird", "der Vogel"], ["plant", "the plant", "die Pflanze"],
      ["walk", "to go for a walk", "spazieren gehen"], ["hike", "to hike", "wandern"], ["outside", "The children are playing outside.", "Die Kinder spielen draußen."], ["beautiful", "The view is beautiful.", "Die Aussicht ist schön."],
    ]),
    module("communication", "A2", "School & work communication", "✉️", "phrases", "Ask, explain, and coordinate tasks.", [
      ["repeat", "Could you repeat that?", "Könnten Sie das wiederholen?"], ["explain", "Please explain the task.", "Bitte erklären Sie die Aufgabe."], ["understand", "Now I understand it.", "Jetzt verstehe ich es."], ["question", "I have a question.", "Ich habe eine Frage."],
      ["email", "I’ll send you an email.", "Ich schicke Ihnen eine E-Mail."], ["meeting", "The meeting begins at ten.", "Die Besprechung beginnt um zehn."], ["late", "I will be ten minutes late.", "Ich komme zehn Minuten später."], ["deadline", "When is the deadline?", "Wann ist der Abgabetermin?"],
      ["finished", "The work is finished.", "Die Arbeit ist fertig."], ["together", "We are working on it together.", "Wir arbeiten gemeinsam daran."], ["correct", "Is this answer correct?", "Ist diese Antwort richtig?"], ["example", "Can you give an example?", "Können Sie ein Beispiel geben?"],
    ]),
    module("opinions", "A2", "Comparisons & opinions", "⚖️", "grammar", "Compare things and state simple preferences.", [
      ["better", "This book is better.", "Dieses Buch ist besser."], ["most", "That is the most interesting part.", "Das ist der interessanteste Teil."], ["bigger", "Berlin is bigger than Bonn.", "Berlin ist größer als Bonn."], ["same", "The two rooms are the same size.", "Die beiden Zimmer sind gleich groß."],
      ["think", "I think the idea is good.", "Ich finde die Idee gut."], ["believe", "I believe that is true.", "Ich glaube, dass das stimmt."], ["prefer", "I prefer tea to coffee.", "Ich trinke lieber Tee als Kaffee."], ["favorite", "What is your favorite film?", "Was ist dein Lieblingsfilm?"],
      ["agree", "I agree with you.", "Ich stimme dir zu."], ["disagree", "I see that differently.", "Das sehe ich anders."], ["important", "That is important to me.", "Das ist mir wichtig."], ["because", "I like it because it is practical.", "Ich mag es, weil es praktisch ist."],
    ]),
    module("services", "A2", "Appointments & services", "📅", "dialogue", "Arrange appointments and solve routine needs.", [
      ["appointment", "I would like an appointment.", "Ich hätte gern einen Termin."], ["available", "Is Tuesday available?", "Ist Dienstag noch frei?"], ["change", "Can I change the appointment?", "Kann ich den Termin verschieben?"], ["cancel", "I have to cancel the appointment.", "Ich muss den Termin absagen."],
      ["haircut", "I would like a haircut.", "Ich hätte gern einen Haarschnitt."], ["repair", "The device needs to be repaired.", "Das Gerät muss repariert werden."], ["package", "I would like to send this package.", "Ich möchte dieses Paket schicken."], ["bank", "Where is the nearest bank?", "Wo ist die nächste Bank?"],
      ["form", "Please fill out this form.", "Bitte füllen Sie dieses Formular aus."], ["signature", "Sign here, please.", "Unterschreiben Sie bitte hier."], ["open", "What time do you open?", "Wann öffnen Sie?"], ["closed", "The office is closed today.", "Das Büro ist heute geschlossen."],
    ]),

    module("connectors", "B1", "Conversation connectors", "🔗", "grammar", "Link ideas into natural longer speech.", [
      ["first", "first of all", "zuerst"], ["then", "then / afterward", "danach"], ["also", "in addition", "außerdem"], ["however", "however", "allerdings"],
      ["although", "although", "obwohl"], ["therefore", "therefore", "deshalb"], ["nevertheless", "nevertheless", "trotzdem"], ["while", "while / whereas", "während"],
      ["finally", "finally", "schließlich"], ["example", "for example", "zum Beispiel"], ["one-hand", "on the one hand", "einerseits"], ["other-hand", "on the other hand", "andererseits"],
    ]),
    module("cause", "B1", "Reasons & consequences", "➡️", "grammar", "Explain why things happen and what follows.", [
      ["because", "I stayed home because I was sick.", "Ich blieb zu Hause, weil ich krank war."], ["therefore", "It was raining; therefore we took the bus.", "Es regnete; deshalb nahmen wir den Bus."], ["so-that", "I speak slowly so that everyone understands.", "Ich spreche langsam, damit alle mich verstehen."], ["because-of", "Because of the weather, the trip was canceled.", "Wegen des Wetters wurde der Ausflug abgesagt."],
      ["reason", "The reason is simple.", "Der Grund ist einfach."], ["result", "That has an important consequence.", "Das hat eine wichtige Folge."], ["depends", "It depends on the time.", "Es hängt von der Zeit ab."], ["if", "If it is sunny, we will go outside.", "Wenn es sonnig ist, gehen wir raus."],
      ["unless", "Unless something changes, we will stay.", "Wenn sich nichts ändert, bleiben wir."], ["due", "The delay is due to traffic.", "Die Verspätung liegt am Verkehr."], ["leads", "Too little sleep leads to stress.", "Zu wenig Schlaf führt zu Stress."], ["that-is-why", "That is why I called you.", "Darum habe ich dich angerufen."],
    ]),
    module("goals", "B1", "Plans, hopes & goals", "🎯", "phrases", "Discuss future plans and personal goals.", [
      ["intend", "I intend to exercise more.", "Ich habe vor, mehr Sport zu treiben."], ["hope", "I hope that everything works out.", "Ich hoffe, dass alles klappt."], ["goal", "My goal is to speak confidently.", "Mein Ziel ist es, sicher zu sprechen."], ["future", "In the future I want to travel more.", "In Zukunft möchte ich mehr reisen."],
      ["plan", "We are planning a trip to Austria.", "Wir planen eine Reise nach Österreich."], ["decide", "I have not decided yet.", "Ich habe mich noch nicht entschieden."], ["perhaps", "Perhaps I will study abroad.", "Vielleicht werde ich im Ausland studieren."], ["definitely", "I will definitely continue.", "Ich werde auf jeden Fall weitermachen."],
      ["achieve", "It takes time to achieve a goal.", "Es braucht Zeit, ein Ziel zu erreichen."], ["improve", "I want to improve my pronunciation.", "Ich möchte meine Aussprache verbessern."], ["challenge", "This is a worthwhile challenge.", "Das ist eine lohnende Herausforderung."], ["step", "The next step is practice.", "Der nächste Schritt ist Übung."],
    ]),
    module("narrative", "B1", "Experiences & storytelling", "📖", "phrases", "Tell a connected story about past events.", [
      ["once", "Once I traveled alone.", "Einmal bin ich allein gereist."], ["suddenly", "Suddenly the lights went out.", "Plötzlich ging das Licht aus."], ["at-first", "At first everything was normal.", "Zuerst war alles normal."], ["later", "A little later we heard a noise.", "Etwas später hörten wir ein Geräusch."],
      ["fortunately", "Fortunately nobody was hurt.", "Zum Glück wurde niemand verletzt."], ["unfortunately", "Unfortunately we missed the train.", "Leider haben wir den Zug verpasst."], ["remember", "I remember that day well.", "Ich erinnere mich gut an diesen Tag."], ["experience", "It was an unforgettable experience.", "Es war ein unvergessliches Erlebnis."],
      ["happened", "What happened next?", "Was ist danach passiert?"], ["ended", "In the end everything turned out well.", "Am Ende ist alles gut ausgegangen."], ["since", "Since then I have been more careful.", "Seitdem bin ich vorsichtiger."], ["tell", "Let me tell you what happened.", "Ich erzähle dir, was passiert ist."],
    ]),
    module("media", "B1", "News & media", "📰", "vocabulary", "Understand and discuss everyday media.", [
      ["news", "the news", "die Nachrichten"], ["report", "the report", "der Bericht"], ["headline", "the headline", "die Schlagzeile"], ["article", "the article", "der Artikel"],
      ["source", "the source", "die Quelle"], ["interview", "the interview", "das Interview"], ["broadcast", "the broadcast", "die Sendung"], ["publish", "to publish", "veröffentlichen"],
      ["reliable", "Is the source reliable?", "Ist die Quelle zuverlässig?"], ["according", "According to the report…", "Laut dem Bericht …"], ["current", "This is a current topic.", "Das ist ein aktuelles Thema."], ["opinion", "The article contains facts and opinions.", "Der Artikel enthält Fakten und Meinungen."],
    ]),
    module("technology", "B1", "Technology & digital life", "💻", "phrases", "Handle devices and discuss online habits.", [
      ["device", "the device", "das Gerät"], ["screen", "the screen", "der Bildschirm"], ["network", "the network", "das Netzwerk"], ["password", "the password", "das Passwort"],
      ["download", "to download", "herunterladen"], ["upload", "to upload", "hochladen"], ["save", "Did you save the file?", "Hast du die Datei gespeichert?"], ["connection", "The connection is too slow.", "Die Verbindung ist zu langsam."],
      ["privacy", "Privacy is important.", "Datenschutz ist wichtig."], ["online-time", "I try to limit my screen time.", "Ich versuche, meine Bildschirmzeit zu begrenzen."], ["update", "The app needs an update.", "Die App braucht ein Update."], ["works", "The computer is working again.", "Der Computer funktioniert wieder."],
    ]),
    module("environment", "B1", "Environment & community", "🌍", "phrases", "Discuss practical environmental choices.", [
      ["environment", "the environment", "die Umwelt"], ["climate", "the climate", "das Klima"], ["energy", "the energy", "die Energie"], ["waste", "the waste", "der Abfall"],
      ["recycle", "to recycle", "recyceln"], ["protect", "We should protect nature.", "Wir sollten die Natur schützen."], ["save", "We can save water and electricity.", "Wir können Wasser und Strom sparen."], ["public", "Public transportation reduces traffic.", "Öffentliche Verkehrsmittel reduzieren den Verkehr."],
      ["local", "We buy local products.", "Wir kaufen regionale Produkte."], ["problem", "Plastic waste is a serious problem.", "Plastikmüll ist ein ernstes Problem."], ["solution", "We need practical solutions.", "Wir brauchen praktische Lösungen."], ["responsibility", "Everyone shares responsibility.", "Alle tragen Verantwortung."],
    ]),
    module("wellbeing", "B1", "Health & wellbeing", "🧘", "phrases", "Talk about healthy choices and stress.", [
      ["balanced", "A balanced diet is important.", "Eine ausgewogene Ernährung ist wichtig."], ["exercise", "Regular exercise keeps you fit.", "Regelmäßige Bewegung hält fit."], ["sleep", "I have not been sleeping well lately.", "In letzter Zeit schlafe ich nicht gut."], ["stress", "Too much stress can make you ill.", "Zu viel Stress kann krank machen."],
      ["break", "I need a short break.", "Ich brauche eine kurze Pause."], ["recover", "You should give yourself time to recover.", "Du solltest dir Zeit zur Erholung geben."], ["symptoms", "The symptoms have improved.", "Die Beschwerden sind besser geworden."], ["appointment", "The doctor advised me to rest.", "Der Arzt hat mir geraten, mich auszuruhen."],
      ["habit", "A small habit can make a difference.", "Eine kleine Gewohnheit kann viel bewirken."], ["mental", "Mental health matters too.", "Psychische Gesundheit ist ebenfalls wichtig."], ["breathe", "Breathe deeply and stay calm.", "Atme tief ein und bleib ruhig."], ["balance", "I am looking for a better balance.", "Ich suche nach einem besseren Gleichgewicht."],
    ]),
    module("career", "B1", "Education & work", "💼", "phrases", "Discuss skills, applications, and responsibilities.", [
      ["education", "the education / training", "die Ausbildung"], ["degree", "the degree", "der Abschluss"], ["experience", "the work experience", "die Berufserfahrung"], ["skill", "the skill", "die Fähigkeit"],
      ["apply", "to apply for a position", "sich um eine Stelle bewerben"], ["resume", "the résumé", "der Lebenslauf"], ["interview", "I have a job interview tomorrow.", "Morgen habe ich ein Vorstellungsgespräch."], ["responsible", "I am responsible for the project.", "Ich bin für das Projekt verantwortlich."],
      ["team", "Good teamwork is essential.", "Gute Teamarbeit ist entscheidend."], ["develop", "I would like to develop my skills.", "Ich möchte meine Fähigkeiten weiterentwickeln."], ["feedback", "Constructive feedback helps me improve.", "Konstruktives Feedback hilft mir, mich zu verbessern."], ["opportunity", "This is a valuable opportunity.", "Das ist eine wertvolle Gelegenheit."],
    ]),
    module("relationships", "B1", "Relationships & emotions", "🤝", "phrases", "Express nuanced feelings and resolve conflict.", [
      ["trust", "Trust is important in a friendship.", "Vertrauen ist in einer Freundschaft wichtig."], ["support", "My family supports me.", "Meine Familie unterstützt mich."], ["proud", "I am proud of you.", "Ich bin stolz auf dich."], ["disappointed", "I was disappointed by the result.", "Ich war vom Ergebnis enttäuscht."],
      ["worried", "I am worried about him.", "Ich mache mir Sorgen um ihn."], ["understand", "I understand how you feel.", "Ich verstehe, wie du dich fühlst."], ["argue", "We argued about a small thing.", "Wir haben uns wegen einer Kleinigkeit gestritten."], ["apologize", "I would like to apologize.", "Ich möchte mich entschuldigen."],
      ["forgive", "Can you forgive me?", "Kannst du mir verzeihen?"], ["solution", "Let’s find a solution together.", "Lass uns gemeinsam eine Lösung finden."], ["respect", "We should respect each other.", "Wir sollten einander respektieren."], ["count-on", "You can count on me.", "Du kannst dich auf mich verlassen."],
    ]),
    module("travel-problems", "B1", "Travel problem solving", "🧳", "dialogue", "Respond when plans go wrong away from home.", [
      ["lost", "My suitcase has been lost.", "Mein Koffer ist verloren gegangen."], ["cancelled", "The flight was canceled.", "Der Flug wurde gestrichen."], ["reservation", "I cannot find my reservation.", "Ich kann meine Reservierung nicht finden."], ["wrong-room", "This is not the room I booked.", "Das ist nicht das Zimmer, das ich gebucht habe."],
      ["broken", "The air conditioning does not work.", "Die Klimaanlage funktioniert nicht."], ["refund", "I would like a refund.", "Ich möchte eine Rückerstattung."], ["alternative", "Is there an alternative connection?", "Gibt es eine andere Verbindung?"], ["help-desk", "Where is the information desk?", "Wo ist der Informationsschalter?"],
      ["documents", "My documents were stolen.", "Meine Dokumente wurden gestohlen."], ["police", "I need to report it to the police.", "Ich muss es der Polizei melden."], ["insurance", "I have travel insurance.", "Ich habe eine Reiseversicherung."], ["resolve", "How can we resolve this problem?", "Wie können wir dieses Problem lösen?"],
    ]),
    module("relative", "B1", "Relative clauses", "🧱", "grammar", "Add useful detail with der, die, das, and wo.", [
      ["man", "That is the man who helped me.", "Das ist der Mann, der mir geholfen hat."], ["woman", "The woman I met is a doctor.", "Die Frau, die ich getroffen habe, ist Ärztin."], ["book", "The book that I am reading is exciting.", "Das Buch, das ich lese, ist spannend."], ["friend", "This is the friend I told you about.", "Das ist der Freund, von dem ich dir erzählt habe."],
      ["city", "Berlin is a city where a lot happens.", "Berlin ist eine Stadt, in der viel passiert."], ["gift", "The gift that she gave me was beautiful.", "Das Geschenk, das sie mir gegeben hat, war schön."], ["children", "The children who are playing outside are our neighbors.", "Die Kinder, die draußen spielen, sind unsere Nachbarn."], ["reason", "That is the reason why I stayed.", "Das ist der Grund, warum ich geblieben bin."],
      ["person", "I need someone who speaks German.", "Ich brauche jemanden, der Deutsch spricht."], ["place", "We visited the place where he grew up.", "Wir besuchten den Ort, an dem er aufgewachsen ist."], ["movie", "The film we saw yesterday was funny.", "Der Film, den wir gestern gesehen haben, war lustig."], ["topic", "This is a topic that interests many people.", "Das ist ein Thema, das viele Menschen interessiert."],
    ]),
    module("subjunctive", "B1", "Polite & hypothetical German", "💭", "grammar", "Use würde, könnte, wäre, and hätte naturally.", [
      ["would", "I would travel more if I had time.", "Ich würde mehr reisen, wenn ich Zeit hätte."], ["could", "Could you help me, please?", "Könnten Sie mir bitte helfen?"], ["would-be", "That would be a good idea.", "Das wäre eine gute Idee."], ["would-have", "I would like more information.", "Ich hätte gern mehr Informationen."],
      ["if", "If the weather were better, we would go hiking.", "Wenn das Wetter besser wäre, würden wir wandern gehen."], ["wish", "I wish I could speak more fluently.", "Ich wünschte, ich könnte flüssiger sprechen."], ["prefer", "I would prefer to stay at home.", "Ich würde lieber zu Hause bleiben."], ["recommend", "What would you recommend?", "Was würden Sie empfehlen?"],
      ["maybe", "Perhaps we could meet tomorrow.", "Vielleicht könnten wir uns morgen treffen."], ["your-place", "What would you do in my place?", "Was würdest du an meiner Stelle tun?"], ["possible", "Would it be possible to change the date?", "Wäre es möglich, den Termin zu ändern?"], ["without", "Without your help, I would not have managed it.", "Ohne deine Hilfe hätte ich es nicht geschafft."],
    ]),
    module("passive", "B1", "Passive voice in context", "🏗️", "grammar", "Understand processes and formal information.", [
      ["built", "The house was built in 1990.", "Das Haus wurde 1990 gebaut."], ["made", "The product is made in Germany.", "Das Produkt wird in Deutschland hergestellt."], ["closed", "The road is being closed.", "Die Straße wird gesperrt."], ["repaired", "The computer is being repaired.", "Der Computer wird repariert."],
      ["announced", "The results will be announced tomorrow.", "Die Ergebnisse werden morgen bekannt gegeben."], ["spoken", "German is spoken here.", "Hier wird Deutsch gesprochen."], ["recycled", "The packaging can be recycled.", "Die Verpackung kann recycelt werden."], ["required", "A passport is required.", "Ein Reisepass wird benötigt."],
      ["organized", "The event is organized by volunteers.", "Die Veranstaltung wird von Freiwilligen organisiert."], ["changed", "The schedule was changed.", "Der Zeitplan wurde geändert."], ["delivered", "The package has already been delivered.", "Das Paket ist bereits geliefert worden."], ["explained", "The process is explained step by step.", "Der Ablauf wird Schritt für Schritt erklärt."],
    ]),
    module("discussion", "B1", "Discussion & compromise", "🗣️", "dialogue", "Take part in a respectful everyday discussion.", [
      ["view", "In my view, the advantages are clear.", "Meiner Meinung nach sind die Vorteile klar."], ["point", "I understand your point.", "Ich verstehe deinen Standpunkt."], ["agree-partly", "I partly agree with you.", "Ich stimme dir teilweise zu."], ["concern", "My main concern is the cost.", "Meine größte Sorge sind die Kosten."],
      ["advantage", "One advantage is the flexibility.", "Ein Vorteil ist die Flexibilität."], ["disadvantage", "The disadvantage is that it takes longer.", "Der Nachteil ist, dass es länger dauert."], ["suggest", "I suggest that we try both options.", "Ich schlage vor, dass wir beide Möglichkeiten ausprobieren."], ["compromise", "Can we find a compromise?", "Können wir einen Kompromiss finden?"],
      ["alternative", "Another possibility would be to wait.", "Eine andere Möglichkeit wäre zu warten."], ["consider", "We should consider everyone’s needs.", "Wir sollten die Bedürfnisse aller berücksichtigen."], ["decision", "Let’s make the decision together.", "Lass uns die Entscheidung gemeinsam treffen."], ["conclusion", "We have reached a good solution.", "Wir haben eine gute Lösung gefunden."],
    ])
  );
})(typeof window === "undefined" ? globalThis : window);
