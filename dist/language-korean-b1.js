(function (root) {
  "use strict";

  const registry = root.HouseHelperLanguagePacks;
  if (!registry || !Array.isArray(registry.packs)) return;
  const pack = registry.packs.find((item) => item.id === "korean");
  if (!pack) return;

  const module = (id, level, title, icon, kind, description, rows) => ({
    id: "ko-" + id,
    level,
    title,
    icon,
    kind,
    description,
    cards: rows.map(([cardId, prompt, answer, pronunciation, note]) => ({
      id: "ko-" + id + "-" + cardId,
      prompt,
      answer,
      pronunciation: pronunciation || "",
      note: note || "",
      kind,
      level,
    })),
  });

  pack.levels = ["A1", "A2", "B1"];
  pack.cefrMax = "B1";
  pack.description = "A Hangul-first pathway from family basics to intermediate everyday Korean.";
  pack.modules.push(
    module("consonants", "A1", "More Hangul consonants", "한", "script", "Complete the most common basic consonant sounds.", [
      ["d", "the ㄷ consonant", "다", "da", "ㄷ is between English d and t depending on position."], ["r", "the ㄹ consonant", "라", "ra", "ㄹ can sound like r or l."], ["m", "the ㅁ consonant", "마", "ma", "ㅁ has an m sound."], ["b", "the ㅂ consonant", "바", "ba", "ㅂ is between English b and p."],
      ["s", "the ㅅ consonant", "사", "sa", "ㅅ is usually s, but sounds like sh before ㅣ."], ["ng", "the ㅇ consonant", "아 / 앙", "a / ang", "ㅇ is silent initially and ng at the end."], ["j", "the ㅈ consonant", "자", "ja", "ㅈ is between English j and ch."], ["ch", "the ㅊ consonant", "차", "cha", "ㅊ is an aspirated ch."],
      ["k", "the ㅋ consonant", "카", "ka", "ㅋ is an aspirated k."], ["t", "the ㅌ consonant", "타", "ta", "ㅌ is an aspirated t."], ["p", "the ㅍ consonant", "파", "pa", "ㅍ is an aspirated p."], ["h", "the ㅎ consonant", "하", "ha", "ㅎ has an h sound."],
    ]),
    module("vowels", "A1", "Compound Hangul vowels", "ㅐ", "script", "Read common y- and w-vowel combinations.", [
      ["ae", "the ㅐ vowel", "애", "ae", "ㅐ is close to the e in bed."], ["e", "the ㅔ vowel", "에", "e", "ㅐ and ㅔ sound very similar in modern Korean."], ["ya", "the ㅑ vowel", "야", "ya", "Add a y sound to ㅏ."], ["yeo", "the ㅕ vowel", "여", "yeo", "Add a y sound to ㅓ."],
      ["yo", "the ㅛ vowel", "요", "yo", "Add a y sound to ㅗ."], ["yu", "the ㅠ vowel", "유", "yu", "Add a y sound to ㅜ."], ["wa", "the ㅘ vowel", "와", "wa", "ㅗ and ㅏ combine as wa."], ["wo", "the ㅝ vowel", "워", "wo", "ㅜ and ㅓ combine as wo."],
      ["we", "the ㅞ vowel", "웨", "we", "A common we sound."], ["wi", "the ㅟ vowel", "위", "wi", "ㅜ and ㅣ combine as wi."], ["ui", "the ㅢ vowel", "의", "ui", "Its sound changes in some grammatical uses."], ["ye", "the ㅖ vowel", "예", "ye", "Found in 예, meaning yes."],
    ]),
    module("batchim", "A1", "Final consonants (받침)", "받", "script", "Notice how syllable-final sounds are grouped.", [
      ["k", "final ㄱ sound", "국", "guk", "Final ㄱ, ㅋ, and ㄲ end with a short k sound."], ["n", "final ㄴ sound", "산", "san", "Final ㄴ has an n sound."], ["t", "final ㄷ sound", "옷", "ot", "Several final consonants reduce to a short t sound."], ["l", "final ㄹ sound", "달", "dal", "Final ㄹ has an l sound."],
      ["m", "final ㅁ sound", "밤", "bam", "Final ㅁ has an m sound."], ["p", "final ㅂ sound", "밥", "bap", "Final ㅂ and ㅍ end with a short p sound."], ["ng", "final ㅇ sound", "방", "bang", "Final ㅇ has an ng sound."], ["link", "sound linking example", "한국어", "hangugeo", "The final ㄱ links into the following vowel."],
      ["nasal", "nasal sound change example", "국물", "gungmul", "ㄱ before ㅁ is commonly pronounced ng."], ["tensed", "tensing example", "학교", "hakgyo", "The second consonant may become tense in connected speech."], ["silent-h", "ㅎ sound change example", "좋아요", "joayo", "ㅎ becomes weak or silent in this form."], ["practice", "Read: Korean language", "한국말", "hangungmal", "Listen for linking and the nasal sound change."],
    ]),
    module("sino-numbers", "A1", "Sino-Korean numbers", "🔢", "vocabulary", "Use the number system common for dates, money, and minutes.", [
      ["zero", "zero", "영", "yeong"], ["one", "one", "일", "il"], ["two", "two", "이", "i"], ["three", "three", "삼", "sam"],
      ["four", "four", "사", "sa"], ["five", "five", "오", "o"], ["six", "six", "육", "yuk"], ["seven", "seven", "칠", "chil"],
      ["eight", "eight", "팔", "pal"], ["nine", "nine", "구", "gu"], ["ten", "ten", "십", "sip"], ["hundred", "one hundred", "백", "baek"],
    ]),
    module("places", "A1", "Places around town", "🏙️", "vocabulary", "Find everyday places in a Korean neighborhood.", [
      ["school", "school", "학교", "hakgyo"], ["store", "store", "가게", "gage"], ["hospital", "hospital", "병원", "byeongwon"], ["pharmacy", "pharmacy", "약국", "yakguk"],
      ["station", "station", "역", "yeok"], ["park", "park", "공원", "gongwon"], ["library", "library", "도서관", "doseogwan"], ["restaurant", "restaurant", "식당", "sikdang"],
      ["bathroom", "bathroom / restroom", "화장실", "hwajangsil"], ["bank", "bank", "은행", "eunhaeng"], ["where", "Where is the station?", "역이 어디예요?", "yeogi eodiyeyo"], ["near", "It is near the school.", "학교 근처에 있어요.", "hakgyo geuncheoe isseoyo"],
    ]),
    module("date-time", "A1", "Dates & time", "🕒", "phrases", "Ask and answer simple schedule questions.", [
      ["today", "today", "오늘", "oneul"], ["yesterday", "yesterday", "어제", "eoje"], ["tomorrow", "tomorrow", "내일", "naeil"], ["morning", "morning", "아침", "achim"],
      ["afternoon", "afternoon", "오후", "ohu"], ["evening", "evening", "저녁", "jeonyeok"], ["week", "week", "주", "ju"], ["month", "month", "월", "wol"],
      ["year", "year", "년", "nyeon"], ["minute", "minute", "분", "bun"], ["what-time", "What time is it?", "몇 시예요?", "myeot siyeyo"], ["at-three", "It starts at three.", "세 시에 시작해요.", "se sie sijakhaeyo"],
    ]),
    module("weather", "A1", "Weather & seasons", "🌦️", "phrases", "Understand everyday weather talk.", [
      ["weather", "weather", "날씨", "nalssi"], ["sunny", "It is sunny.", "날씨가 맑아요.", "nalssiga malgayo"], ["rain", "It is raining.", "비가 와요.", "biga wayo"], ["snow", "It is snowing.", "눈이 와요.", "nuni wayo"],
      ["wind", "It is windy.", "바람이 불어요.", "barami bureoyo"], ["hot", "It is hot.", "더워요.", "deowoyo"], ["cold", "It is cold.", "추워요.", "chuwoyo"], ["spring", "spring", "봄", "bom"],
      ["summer", "summer", "여름", "yeoreum"], ["autumn", "autumn", "가을", "gaeul"], ["winter", "winter", "겨울", "gyeoul"], ["umbrella", "Take an umbrella.", "우산을 가져가세요.", "usaneul gajyeogaseyo"],
    ]),
    module("clothes", "A1", "Clothes & getting ready", "👕", "vocabulary", "Name clothing and talk about wearing it.", [
      ["clothes", "clothes", "옷", "ot"], ["shirt", "shirt", "셔츠", "syeocheu"], ["pants", "pants", "바지", "baji"], ["dress", "dress", "원피스", "wonpiseu"],
      ["jacket", "jacket", "재킷", "jaekit"], ["shoes", "shoes", "신발", "sinbal"], ["socks", "socks", "양말", "yangmal"], ["hat", "hat", "모자", "moja"],
      ["wear-clothes", "to wear clothes", "옷을 입다", "oseul iptta"], ["wear-shoes", "to wear shoes", "신발을 신다", "sinbareul sinda"], ["pretty", "This is pretty.", "이거 예뻐요.", "igeo yeppeoyo"], ["fits", "It fits well.", "잘 맞아요.", "jal majayo"],
    ]),

    module("particles", "A2", "Core particles in sentences", "🧩", "grammar", "Use topic, subject, object, place, and direction markers.", [
      ["topic", "As for me, I am a student.", "저는 학생이에요.", "jeoneun haksaengieyo", "는 marks the topic after 저."], ["subject", "The weather is good.", "날씨가 좋아요.", "nalssiga joayo", "가 marks the subject."], ["object", "I read a book.", "책을 읽어요.", "chaegeul ilgeoyo", "을 marks the object."], ["place", "I am at home.", "집에 있어요.", "jibe isseoyo", "에 marks a location or destination."],
      ["action-place", "I study at the library.", "도서관에서 공부해요.", "doseogwaneseo gongbuhaeyo", "에서 marks where an action occurs."], ["with", "I go with a friend.", "친구와 같이 가요.", "chinguwa gachi gayo"], ["from", "I came from school.", "학교에서 왔어요.", "hakgyoeseo wasseoyo"], ["to", "Give it to Mom.", "엄마에게 주세요.", "eommaege juseyo"],
      ["also", "I also like music.", "저도 음악을 좋아해요.", "jeodo eumageul joahaeyo"], ["only", "I drink only water.", "물만 마셔요.", "mulman masyeoyo"], ["direction", "Go toward the station.", "역으로 가세요.", "yeogeuro gaseyo"], ["possessive", "This is my book.", "이것은 제 책이에요.", "igeoseun je chaegieyo"],
    ]),
    module("tenses", "A2", "Present, past & future", "⏳", "grammar", "Move familiar verbs through everyday time.", [
      ["eat-present", "I eat rice.", "밥을 먹어요.", "babeul meogeoyo"], ["eat-past", "I ate rice.", "밥을 먹었어요.", "babeul meogeosseoyo"], ["eat-future", "I will eat rice.", "밥을 먹을 거예요.", "babeul meogeul geoyeyo"], ["go-present", "I go to school.", "학교에 가요.", "hakgyoe gayo"],
      ["go-past", "I went to school.", "학교에 갔어요.", "hakgyoe gasseoyo"], ["go-future", "I will go to school.", "학교에 갈 거예요.", "hakgyoe gal geoyeyo"], ["do-present", "I exercise.", "운동해요.", "undonghaeyo"], ["do-past", "I exercised.", "운동했어요.", "undonghaesseoyo"],
      ["do-future", "I will exercise.", "운동할 거예요.", "undonghal geoyeyo"], ["now", "I am studying now.", "지금 공부하고 있어요.", "jigeum gongbuhago isseoyo"], ["already", "I already finished.", "벌써 끝냈어요.", "beolsseo kkeutnaesseoyo"], ["not-yet", "I have not eaten yet.", "아직 안 먹었어요.", "ajik an meogeosseoyo"],
    ]),
    module("routine", "A2", "Daily routine sentences", "☀️", "phrases", "Describe a complete ordinary day.", [
      ["wake", "I wake up at seven.", "일곱 시에 일어나요.", "ilgop sie ireonayo"], ["wash", "I wash my face.", "세수해요.", "sesuhaeyo"], ["breakfast", "I eat breakfast.", "아침을 먹어요.", "achimeul meogeoyo"], ["leave", "I leave home at eight.", "여덟 시에 집에서 나가요.", "yeodeol sie jibeseo nagayo"],
      ["work", "I work during the day.", "낮에는 일해요.", "najeneun ilhaeyo"], ["lunch", "I eat lunch with coworkers.", "동료들과 점심을 먹어요.", "dongnyodeulgwa jeomsimeul meogeoyo"], ["return", "I come home in the evening.", "저녁에 집에 돌아와요.", "jeonyeoge jibe dorawayo"], ["homework", "The children do homework.", "아이들이 숙제해요.", "aideuri sukjehaeyo"],
      ["dinner", "We make dinner together.", "같이 저녁을 만들어요.", "gachi jeonyeogeul mandeureoyo"], ["rest", "After dinner I rest.", "저녁 후에 쉬어요.", "jeonyeok hue swieoyo"], ["usually", "I usually go to bed early.", "보통 일찍 자요.", "botong iljjik jayo"], ["weekend", "On weekends I sleep late.", "주말에는 늦잠을 자요.", "jumareneun neutjameul jayo"],
    ]),
    module("transport", "A2", "Transportation & directions", "🚇", "dialogue", "Navigate buses, subways, and streets.", [
      ["bus", "bus", "버스", "beoseu"], ["subway", "subway", "지하철", "jihacheol"], ["train", "train", "기차", "gicha"], ["ticket", "ticket", "표", "pyo"],
      ["stop", "bus stop", "버스 정류장", "beoseu jeongnyujang"], ["get-on", "to get on", "타다", "tada"], ["get-off", "to get off", "내리다", "naerida"], ["transfer", "to transfer", "갈아타다", "garatada"],
      ["how", "How do I get to Seoul Station?", "서울역에 어떻게 가요?", "seoullyeoge eotteoke gayo"], ["number", "Which bus should I take?", "몇 번 버스를 타요?", "myeot beon beoseureul tayo"], ["here", "Please let me off here.", "여기에서 내려 주세요.", "yeogieseo naeryeo juseyo"], ["lost", "I think I took the wrong way.", "길을 잘못 든 것 같아요.", "gireul jalmot deun geot gatayo"],
    ]),
    module("restaurant", "A2", "Restaurant Korean", "🍲", "dialogue", "Order food politely and handle common requests.", [
      ["people", "A table for four, please.", "네 명 자리 주세요.", "ne myeong jari juseyo"], ["menu", "Please give me a menu.", "메뉴 주세요.", "menyu juseyo"], ["recommend", "What do you recommend?", "뭐가 맛있어요?", "mwoga masisseoyo"], ["order", "I’ll have this.", "이거 주세요.", "igeo juseyo"],
      ["spicy", "Is it spicy?", "매워요?", "maewoyo"], ["not-spicy", "Please make it not spicy.", "안 맵게 해 주세요.", "an maepge hae juseyo"], ["allergy", "I have a peanut allergy.", "땅콩 알레르기가 있어요.", "ttangkong allereugiga isseoyo"], ["water", "May I have some water?", "물 좀 주세요.", "mul jom juseyo"],
      ["more", "Please give me one more.", "하나 더 주세요.", "hana deo juseyo"], ["delicious", "It was delicious.", "잘 먹었습니다.", "jal meogeotseumnida", "A polite phrase after a meal."], ["bill", "Please give me the bill.", "계산서 주세요.", "gyesanseo juseyo"], ["pay", "I’ll pay by card.", "카드로 계산할게요.", "kadeuro gyesanhalgeyo"],
    ]),
    module("shopping", "A2", "Shopping & sizes", "🛍️", "dialogue", "Ask prices, compare items, and make a purchase.", [
      ["price", "How much is this?", "이거 얼마예요?", "igeo eolmayeyo"], ["expensive", "It is a little expensive.", "조금 비싸요.", "jogeum bissayo"], ["cheap", "Do you have a cheaper one?", "더 싼 거 있어요?", "deo ssan geo isseoyo"], ["look", "I’m just looking.", "그냥 보고 있어요.", "geunyang bogo isseoyo"],
      ["try", "May I try it on?", "입어 봐도 돼요?", "ibeo bwado dwaeyo"], ["size", "Do you have a larger size?", "더 큰 사이즈 있어요?", "deo keun saijeu isseoyo"], ["color", "Do you have another color?", "다른 색 있어요?", "dareun saek isseoyo"], ["fit", "It does not fit well.", "잘 안 맞아요.", "jal an majayo"],
      ["take", "I’ll take this one.", "이걸로 할게요.", "igeollo halgeyo"], ["cash", "Can I pay with cash?", "현금으로 계산해도 돼요?", "hyeongeumeuro gyesanhaedo dwaeyo"], ["receipt", "Please give me a receipt.", "영수증 주세요.", "yeongsujeung juseyo"], ["exchange", "Can I exchange this?", "이거 교환할 수 있어요?", "igeo gyohwanhal su isseoyo"],
    ]),
    module("requests", "A2", "Polite requests & honorifics", "🙏", "grammar", "Ask respectfully and recognize honorific forms.", [
      ["please-sit", "Please sit down.", "앉으세요.", "anjeuseyo"], ["please-wait", "Please wait a moment.", "잠시 기다리세요.", "jamsi gidariseyo"], ["please-speak", "Please speak slowly.", "천천히 말씀해 주세요.", "cheoncheonhi malsseumhae juseyo"], ["may-ask", "May I ask a question?", "질문해도 될까요?", "jilmunhaedo doelkkayo"],
      ["could-help", "Could you help me?", "도와주실 수 있어요?", "dowajusil su isseoyo"], ["name", "What is your name? (honorific)", "성함이 어떻게 되세요?", "seonghami eotteoke doeseyo"], ["eat-honorific", "Please enjoy your meal.", "맛있게 드세요.", "masitge deuseyo"], ["sleep-honorific", "Did you sleep well?", "잘 주무셨어요?", "jal jumusyeosseoyo"],
      ["give-honorific", "Please tell me.", "말씀해 주세요.", "malsseumhae juseyo"], ["come-honorific", "When are you coming?", "언제 오세요?", "eonje oseyo"], ["thank", "Thank you for your help.", "도와주셔서 감사합니다.", "dowajusyeoseo gamsahamnida"], ["formal", "I understand. (formal)", "알겠습니다.", "algetseumnida"],
    ]),
    module("reasons", "A2", "Reasons & connectors", "🔗", "grammar", "Join clauses with because, but, so, and while.", [
      ["and", "I ate and then studied.", "밥을 먹고 공부했어요.", "babeul meokgo gongbuhaesseoyo"], ["but", "It is small but comfortable.", "작지만 편해요.", "jakjiman pyeonhaeyo"], ["because", "I stayed home because it rained.", "비가 와서 집에 있었어요.", "biga waseo jibe isseosseoyo"], ["so", "I was tired, so I slept early.", "피곤해서 일찍 잤어요.", "pigonhaeseo iljjik jasseoyo"],
      ["before", "Wash your hands before eating.", "먹기 전에 손을 씻으세요.", "meokgi jeone soneul ssiseuseyo"], ["after", "I exercise after work.", "일한 후에 운동해요.", "ilhan hue undonghaeyo"], ["while", "I listen to music while cooking.", "요리하면서 음악을 들어요.", "yorihamyeonseo eumageul deureoyo"], ["when", "Call me when you arrive.", "도착하면 전화하세요.", "dochakamyeon jeonhwahaseyo"],
      ["therefore", "Therefore I changed the plan.", "그래서 계획을 바꿨어요.", "geuraeseo gyehoegeul bakkwosseoyo"], ["however", "However, it was interesting.", "하지만 재미있었어요.", "hajiman jaemiisseosseoyo"], ["also", "Also, the price is reasonable.", "게다가 가격도 괜찮아요.", "gedaga gagyeokdo gwaenchanayo"], ["then", "Then what happened?", "그다음에 무슨 일이 있었어요?", "geudaeume museun iri isseosseoyo"],
    ]),
    module("opinions", "A2", "Comparisons & opinions", "⚖️", "phrases", "Compare choices and express preferences.", [
      ["bigger", "This room is bigger.", "이 방이 더 커요.", "i bangi deo keoyo"], ["best", "This is the best.", "이게 제일 좋아요.", "ige jeil joayo"], ["same", "The two are similar.", "두 개가 비슷해요.", "du gaega biseuthaeyo"], ["different", "My opinion is different.", "제 생각은 달라요.", "je saenggageun dallayo"],
      ["think", "I think it is useful.", "유용하다고 생각해요.", "yuyonghadago saenggakaeyo"], ["prefer", "I prefer tea.", "저는 차를 더 좋아해요.", "jeoneun chareul deo joahaeyo"], ["interesting", "Which one is more interesting?", "어느 것이 더 재미있어요?", "eoneu geosi deo jaemiisseoyo"], ["agree", "I agree.", "저도 그렇게 생각해요.", "jeodo geureoke saenggakaeyo"],
      ["disagree", "I think a little differently.", "저는 조금 다르게 생각해요.", "jeoneun jogeum dareuge saenggakaeyo"], ["important", "Family is the most important.", "가족이 제일 중요해요.", "gajogi jeil jungyohaeyo"], ["reason", "What is the reason?", "이유가 뭐예요?", "iyuga mwoyeyo"], ["because", "I like it because it is convenient.", "편리해서 좋아해요.", "pyeollihaeseo joahaeyo"],
    ]),
    module("chores", "A2", "Home & chores", "🧹", "phrases", "Coordinate household responsibilities in Korean.", [
      ["clean-room", "to clean the room", "방을 청소하다", "bangeul cheongsohada"], ["dishes", "to wash the dishes", "설거지하다", "seolgeoji hada"], ["laundry", "to do laundry", "빨래하다", "ppallae hada"], ["trash", "to take out the trash", "쓰레기를 버리다", "sseuregireul beorida"],
      ["table", "to set the table", "상을 차리다", "sangeul charida"], ["tidy", "to organize / tidy up", "정리하다", "jeongnihada"], ["finished", "I finished my chore.", "집안일을 다 했어요.", "jibanireul da haesseoyo"], ["turn", "It is your turn today.", "오늘은 네 차례예요.", "oneureun ne charyeyeyo"],
      ["later", "I will do it a little later.", "조금 이따가 할게요.", "jogeum ittaga halgeyo"], ["together", "Let’s clean together.", "같이 청소해요.", "gachi cheongsohaeyo"], ["help", "Please help me with this.", "이것 좀 도와주세요.", "igeot jom dowajuseyo"], ["thanks", "Thanks for cleaning up.", "정리해 줘서 고마워요.", "jeongnihae jwoseo gomawoyo"],
    ]),

    module("connectors", "B1", "Intermediate connectors", "🔗", "grammar", "Build longer, logically connected explanations.", [
      ["first", "first of all", "우선", "useon"], ["then", "after that", "그다음에", "geudaeume"], ["also", "in addition", "게다가", "gedaga"], ["however", "however", "그러나", "geureona"],
      ["therefore", "therefore", "그러므로", "geureomeuro"], ["instead", "instead", "대신에", "daesine"], ["especially", "especially", "특히", "teukhi"], ["for-example", "for example", "예를 들어", "yereul deureo"],
      ["on-one-hand", "on the one hand", "한편으로는", "hanpyeoneuroneun"], ["in-conclusion", "in conclusion", "결론적으로", "gyeollonjeogeuro"], ["even-though", "even though", "비록 …지만", "birok …jiman"], ["not-only", "not only A but also B", "A뿐만 아니라 B도", "A-ppunman anira B-do"],
    ]),
    module("experiences", "B1", "Experiences & storytelling", "📖", "phrases", "Describe memorable events in connected speech.", [
      ["been", "I have been to Korea.", "한국에 가 본 적이 있어요.", "hanguge ga bon jeogi isseoyo"], ["never", "I have never tried it.", "한 번도 해 본 적이 없어요.", "han beondo hae bon jeogi eopseoyo"], ["once", "Once I traveled alone.", "한번은 혼자 여행했어요.", "hanbeoneun honja yeohaenghaesseoyo"], ["suddenly", "Suddenly it began to rain.", "갑자기 비가 오기 시작했어요.", "gapjagi biga ogi sijakaesseoyo"],
      ["fortunately", "Fortunately, I found my bag.", "다행히 가방을 찾았어요.", "dahaenghi gabangeul chajasseoyo"], ["unfortunately", "Unfortunately, the store was closed.", "아쉽게도 가게가 닫혀 있었어요.", "aswipgedo gagega dathyeo isseosseoyo"], ["remember", "I still remember that day.", "아직도 그날을 기억해요.", "ajikdo geunareul gieokaeyo"], ["impression", "It left a strong impression on me.", "아주 인상 깊었어요.", "aju insang gipeosseoyo"],
      ["happened", "What happened next?", "그다음에 무슨 일이 생겼어요?", "geudaeume museun iri saenggyeosseoyo"], ["end", "In the end, everything went well.", "결국 모든 일이 잘됐어요.", "gyeolguk modeun iri jaldwaesseoyo"], ["since", "Since then, I have been more careful.", "그때부터 더 조심하고 있어요.", "geuttaebuteo deo josimhago isseoyo"], ["tell", "Let me tell you about my experience.", "제 경험을 이야기해 드릴게요.", "je gyeongheomeul iyagihae deurilgeyo"],
    ]),
    module("goals", "B1", "Plans, hopes & intentions", "🎯", "phrases", "Explain goals and decisions with nuance.", [
      ["plan", "I plan to study every day.", "매일 공부할 계획이에요.", "maeil gongbuhal gyehoegieyo"], ["intend", "I intend to exercise more.", "운동을 더 하려고 해요.", "undongeul deo haryeogo haeyo"], ["hope", "I hope everything goes well.", "모든 일이 잘되면 좋겠어요.", "modeun iri jaldoemyeon jokesseoyo"], ["goal", "My goal is to speak naturally.", "제 목표는 자연스럽게 말하는 거예요.", "je mokpyoneun jayeonseureopge malhaneun geoyeyo"],
      ["future", "In the future I want to live abroad.", "나중에 외국에서 살고 싶어요.", "najunge oegugeseo salgo sipeoyo"], ["decide", "I have not decided yet.", "아직 결정하지 못했어요.", "ajik gyeoljeonghaji mothaesseoyo"], ["definitely", "I will definitely continue.", "꼭 계속할 거예요.", "kkok gyesokal geoyeyo"], ["perhaps", "I might start next month.", "아마 다음 달에 시작할 거예요.", "ama daeum dare sijakal geoyeyo"],
      ["achieve", "It takes time to achieve a goal.", "목표를 이루려면 시간이 필요해요.", "mokpyoreul iruryeomyeon sigani piryohaeyo"], ["improve", "I want to improve my listening.", "듣기 실력을 향상시키고 싶어요.", "deutgi sillyeogeul hyangsangsikigo sipeoyo"], ["challenge", "It is difficult, but worth trying.", "어렵지만 도전할 가치가 있어요.", "eoryeopjiman dojeonhal gachiga isseoyo"], ["step", "I am taking it one step at a time.", "한 단계씩 나아가고 있어요.", "han dangyessik naagago isseoyo"],
    ]),
    module("reported", "B1", "Reported speech", "💬", "grammar", "Report what someone said, asked, or requested.", [
      ["said", "She said that she was busy.", "그녀는 바쁘다고 말했어요.", "geunyeoneun bappeudago malhaesseoyo"], ["said-noun", "He said he was a teacher.", "그는 선생님이라고 했어요.", "geuneun seonsaengnimirago haesseoyo"], ["asked", "She asked where I was going.", "그녀는 어디에 가냐고 물었어요.", "geunyeoneun eodie ganyago mureosseoyo"], ["question", "He asked if I had time.", "그는 시간이 있냐고 물었어요.", "geuneun sigani innyago mureosseoyo"],
      ["request", "Mom told me to clean my room.", "엄마가 방을 청소하라고 했어요.", "eommaga bangeul cheongsoharago haesseoyo"], ["dont", "Dad told me not to be late.", "아빠가 늦지 말라고 했어요.", "appaga neutji mallago haesseoyo"], ["heard", "I heard that it will rain tomorrow.", "내일 비가 온다고 들었어요.", "naeil biga ondago deureosseoyo"], ["news", "The news said prices had risen.", "뉴스에서 물가가 올랐다고 했어요.", "nyuseueseo mulgaga ollatdago haesseoyo"],
      ["according", "According to my friend, the film is good.", "친구 말로는 그 영화가 좋대요.", "chingu malloneun geu yeonghwaga jotaeyo"], ["apparently", "Apparently the meeting was canceled.", "회의가 취소됐대요.", "hoeuiga chwiso dwaetdaeyo"], ["promise", "He said he would call later.", "나중에 전화하겠다고 했어요.", "najunge jeonhwahagetdago haesseoyo"], ["explain", "Please tell them that I will be late.", "제가 늦는다고 전해 주세요.", "jega neunneundago jeonhae juseyo"],
    ]),
    module("conditionals", "B1", "Conditions & possibilities", "💭", "grammar", "Discuss what may happen and imagine alternatives.", [
      ["if", "If it rains, I will stay home.", "비가 오면 집에 있을 거예요.", "biga omyeon jibe isseul geoyeyo"], ["when", "When you arrive, please call.", "도착하면 전화해 주세요.", "dochakamyeon jeonhwahae juseyo"], ["would", "If I had time, I would travel.", "시간이 있다면 여행하고 싶어요.", "sigani itdamyeon yeohaenghago sipeoyo"], ["wish", "I wish the weather were better.", "날씨가 더 좋으면 좋겠어요.", "nalssiga deo joeumyeon jokesseoyo"],
      ["unless", "If you do not hurry, you will be late.", "서두르지 않으면 늦을 거예요.", "seodureuji aneumyeon neujeul geoyeyo"], ["maybe", "It might be difficult.", "어려울 수도 있어요.", "eoryeoul sudo isseoyo"], ["possible", "Is it possible to change the date?", "날짜를 바꿀 수 있을까요?", "naljjareul bakkul su isseulkkayo"], ["suppose", "What would you do in that situation?", "그런 상황이라면 어떻게 하겠어요?", "geureon sanghwangiramyeon eotteoke hagetseoyo"],
      ["in-case", "Take an umbrella in case it rains.", "비가 올지도 모르니 우산을 가져가세요.", "biga oljido moreuni usaneul gajyeogaseyo"], ["as-long", "It is fine as long as it is safe.", "안전하기만 하면 괜찮아요.", "anjeonhagiman hamyeon gwaenchanayo"], ["otherwise", "Leave now; otherwise you will miss it.", "지금 출발하세요. 안 그러면 놓칠 거예요.", "jigeum chulbalhaseyo, an geureomyeon nochil geoyeyo"], ["chance", "If I get the chance, I will try.", "기회가 생기면 해 볼게요.", "gihoega saenggimyeon hae bolgeyo"],
    ]),
    module("media", "B1", "News & media", "📰", "vocabulary", "Understand and discuss accessible news topics.", [
      ["news", "news", "뉴스", "nyuseu"], ["article", "article", "기사", "gisa"], ["headline", "headline", "제목", "jemok"], ["report", "report / coverage", "보도", "bodo"],
      ["interview", "interview", "인터뷰", "inteobyu"], ["source", "source", "출처", "chulcheo"], ["publish", "to publish", "발표하다", "balpyohada"], ["fact", "fact", "사실", "sasil"],
      ["reliable", "Is this source reliable?", "이 출처는 믿을 만해요?", "i chulcheoneun mideul manhaeyo"], ["according", "According to the article…", "기사에 따르면 …", "gisae ttareumyeon"], ["current", "This is a current issue.", "이것은 최근 이슈예요.", "igeoseun choegeun isyuyeyo"], ["opinion", "Facts and opinions are different.", "사실과 의견은 달라요.", "sasilgwa uigyeoneun dallayo"],
    ]),
    module("technology", "B1", "Technology & digital life", "💻", "phrases", "Explain device problems and online habits.", [
      ["device", "device", "기기", "gigi"], ["screen", "screen", "화면", "hwamyeon"], ["network", "network", "네트워크", "neteuwokeu"], ["password", "password", "비밀번호", "bimilbeonho"],
      ["download", "to download", "다운로드하다", "daunrodeuhada"], ["upload", "to upload", "업로드하다", "eoprodeuhada"], ["save", "Did you save the file?", "파일을 저장했어요?", "paireul jeojanghaesseoyo"], ["connection", "The internet connection keeps dropping.", "인터넷 연결이 자꾸 끊겨요.", "inteonet yeongyeori jakku kkeunhgyeoyo"],
      ["privacy", "We should protect personal information.", "개인 정보를 보호해야 해요.", "gaein jeongboreul bohohaeya haeyo"], ["screen-time", "I am reducing my screen time.", "화면 보는 시간을 줄이고 있어요.", "hwamyeon boneun siganeul jurigo isseoyo"], ["update", "The app needs to be updated.", "앱을 업데이트해야 해요.", "aebeul eopdeiteuhaeya haeyo"], ["restart", "Try restarting the device.", "기기를 다시 시작해 보세요.", "gigireul dasi sijakae boseyo"],
    ]),
    module("wellbeing", "B1", "Health & wellbeing", "🧘", "phrases", "Discuss habits, symptoms, and balance.", [
      ["balanced", "A balanced diet is important.", "균형 잡힌 식사가 중요해요.", "gyunhyeong japin siksaga jungyohaeyo"], ["exercise", "Regular exercise helps your health.", "규칙적인 운동은 건강에 도움이 돼요.", "gyuchikjeogin undongeun geongange doumi dwaeyo"], ["sleep", "I have not been sleeping well lately.", "요즘 잠을 잘 못 자요.", "yojeum jameul jal mot jayo"], ["stress", "I am under a lot of stress.", "스트레스를 많이 받고 있어요.", "seuteureseureul mani batgo isseoyo"],
      ["break", "I need to take a short break.", "잠깐 쉬어야겠어요.", "jamkkan swieoyagesseoyo"], ["recover", "It will take time to recover.", "회복하는 데 시간이 걸릴 거예요.", "hoebokhaneun de sigani geollil geoyeyo"], ["symptom", "The symptoms are getting better.", "증상이 좋아지고 있어요.", "jeungsangi joajigo isseoyo"], ["advice", "The doctor told me to rest.", "의사가 쉬라고 했어요.", "uisaga swirago haesseoyo"],
      ["habit", "Small habits can make a difference.", "작은 습관이 큰 변화를 만들 수 있어요.", "jageun seupgwani keun byeonhwareul mandeul su isseoyo"], ["mental", "Mental health is important too.", "마음 건강도 중요해요.", "maeum geongangdo jungyohaeyo"], ["breathe", "Take a deep breath and relax.", "깊게 숨을 쉬고 긴장을 푸세요.", "gipge sumeul swigo ginjangeul puseyo"], ["balance", "I am trying to find a better balance.", "더 좋은 균형을 찾으려고 해요.", "deo joeun gyunhyeongeul chajeuryeogo haeyo"],
    ]),
    module("career", "B1", "Education & work", "💼", "phrases", "Discuss skills, applications, and teamwork.", [
      ["education", "education", "교육", "gyoyuk"], ["major", "major / field of study", "전공", "jeongong"], ["experience", "work experience", "경력", "gyeongnyeok"], ["skill", "skill / ability", "능력", "neungnyeok"],
      ["apply", "to apply for a job", "직장에 지원하다", "jikjange jiwonhada"], ["resume", "résumé", "이력서", "iryeokseo"], ["interview", "I have an interview tomorrow.", "내일 면접이 있어요.", "naeil myeonjeobi isseoyo"], ["responsible", "I am responsible for this task.", "제가 이 업무를 담당하고 있어요.", "jega i eommureul damdanghago isseoyo"],
      ["team", "Teamwork is very important.", "팀워크가 아주 중요해요.", "timwokeuga aju jungyohaeyo"], ["develop", "I want to develop my skills.", "제 능력을 발전시키고 싶어요.", "je neungnyeogeul baljeonsikigo sipeoyo"], ["feedback", "Feedback helps me improve.", "피드백은 발전하는 데 도움이 돼요.", "pideubaegeun baljeonhaneun de doumi dwaeyo"], ["opportunity", "This is a good opportunity.", "이것은 좋은 기회예요.", "igeoseun joeun gihoeyeyo"],
    ]),
    module("relationships", "B1", "Relationships & emotions", "🤝", "phrases", "Express feelings and work through disagreement.", [
      ["trust", "Trust is important.", "신뢰가 중요해요.", "silloega jungyohaeyo"], ["support", "My family always supports me.", "가족이 항상 저를 응원해 줘요.", "gajogi hangsang jeoreul eungwonhae jwoyo"], ["proud", "I am proud of you.", "네가 자랑스러워요.", "nega jarangseureowoyo"], ["disappointed", "I was disappointed by the result.", "결과가 실망스러웠어요.", "gyeolgwaga silmangseureowosseoyo"],
      ["worried", "I am worried about my friend.", "친구가 걱정돼요.", "chinguga geokjeongdwaeyo"], ["understand", "I understand how you feel.", "어떤 기분인지 이해해요.", "eotteon gibun inji ihaehaeyo"], ["argue", "We argued over a small thing.", "작은 일로 다퉜어요.", "jageun illo datwosseoyo"], ["apologize", "I want to apologize sincerely.", "진심으로 사과하고 싶어요.", "jinsimeuro sagwahago sipeoyo"],
      ["forgive", "Can you forgive me?", "저를 용서해 줄 수 있어요?", "jeoreul yongseohae jul su isseoyo"], ["solution", "Let’s find a solution together.", "같이 해결 방법을 찾아봐요.", "gachi haegyeol bangbeobeul chajabwayo"], ["respect", "We should respect each other.", "서로 존중해야 해요.", "seoro jonjunghaeya haeyo"], ["count-on", "You can count on me.", "저를 믿어도 돼요.", "jeoreul mideodo dwaeyo"],
    ]),
    module("travel-problems", "B1", "Travel problem solving", "🧳", "dialogue", "Handle delays, missing items, and reservations.", [
      ["lost", "My suitcase is missing.", "제 여행 가방이 없어졌어요.", "je yeohaeng gabangi eopseojyeosseoyo"], ["cancelled", "The flight was canceled.", "비행기가 취소됐어요.", "bihaenggiga chwiso dwaesseoyo"], ["reservation", "I cannot find my reservation.", "제 예약을 찾을 수 없어요.", "je yeyageul chajeul su eopseoyo"], ["wrong-room", "This is not the room I reserved.", "제가 예약한 방이 아니에요.", "jega yeyakan bangi anieyo"],
      ["broken", "The air conditioner is not working.", "에어컨이 작동하지 않아요.", "eeokeoni jakdonghaji anayo"], ["refund", "I would like a refund.", "환불받고 싶어요.", "hwanbulbatgo sipeoyo"], ["alternative", "Is there another route?", "다른 길이 있어요?", "dareun giri isseoyo"], ["desk", "Where is the information desk?", "안내 데스크가 어디예요?", "annae deseukeuga eodiyeyo"],
      ["stolen", "My passport was stolen.", "여권을 도난당했어요.", "yeogwoneul donandanghaesseoyo"], ["police", "I need to report it to the police.", "경찰에 신고해야 해요.", "gyeongchare singohaeya haeyo"], ["insurance", "I have travel insurance.", "여행자 보험이 있어요.", "yeohaengja boheomi isseoyo"], ["resolve", "How can we solve this problem?", "이 문제를 어떻게 해결할 수 있어요?", "i munjereul eotteoke haegyeolhal su isseoyo"],
    ]),
    module("nuance", "B1", "Speech levels & nuance", "🎚️", "grammar", "Choose language that fits family, peers, and formal settings.", [
      ["casual-thanks", "Thanks. (casual)", "고마워.", "gomawo", "Use with close friends or younger family."], ["polite-thanks", "Thank you. (polite)", "고마워요.", "gomawoyo", "Everyday polite style."], ["formal-thanks", "Thank you. (formal)", "감사합니다.", "gamsahamnida", "Formal and respectful."], ["casual-eat", "Eat. (casual suggestion)", "먹어.", "meogeo"],
      ["polite-eat", "Please eat. (polite)", "먹어요.", "meogeoyo"], ["honorific-eat", "Please eat. (honorific)", "드세요.", "deuseyo"], ["casual-know", "I know. (casual)", "알아.", "ara"], ["polite-know", "I know. (polite)", "알아요.", "arayo"],
      ["formal-know", "I understand. (formal)", "알겠습니다.", "algetseumnida"], ["soft-no", "That might be a little difficult.", "그건 좀 어려울 것 같아요.", "geugeon jom eoryeoul geot gatayo", "A softer indirect refusal."], ["soft-request", "Could you perhaps check it?", "혹시 확인해 주실 수 있을까요?", "hoksi hwaginhae jusil su isseulkkayo"], ["humble", "I will explain it to you.", "제가 설명해 드릴게요.", "jega seolmyeonghae deurilgeyo", "드리다 adds humility toward the listener."],
    ]),
    module("discussion", "B1", "Discussion & compromise", "🗣️", "dialogue", "Share a position and reach a respectful decision.", [
      ["opinion", "In my opinion, this is practical.", "제 생각에는 이것이 실용적이에요.", "je saenggageneun igeosi silyongjeogieyo"], ["point", "I understand your point.", "무슨 말인지 이해해요.", "museun marinji ihaehaeyo"], ["partly", "I partly agree.", "어느 정도 동의해요.", "eoneu jeongdo donguihaeyo"], ["concern", "My biggest concern is the cost.", "가장 걱정되는 것은 비용이에요.", "gajang geokjeongdoeneun geoseun biyongieyo"],
      ["advantage", "The advantage is convenience.", "장점은 편리하다는 거예요.", "jangjeomeun pyeollihadaneun geoyeyo"], ["disadvantage", "The disadvantage is that it takes time.", "단점은 시간이 걸린다는 거예요.", "danjeomeun sigani geollindaneun geoyeyo"], ["suggest", "I suggest trying both.", "두 가지를 모두 해 보자고 제안해요.", "du gajireul modu hae bojago jeanhaeyo"], ["compromise", "Can we find a compromise?", "서로 양보할 수 있을까요?", "seoro yangbohal su isseulkkayo"],
      ["alternative", "There may be another option.", "다른 방법이 있을 수도 있어요.", "dareun bangbeobi isseul sudo isseoyo"], ["consider", "We should consider everyone’s needs.", "모두의 필요를 고려해야 해요.", "moduui piryoreul goryeohaeya haeyo"], ["decision", "Let’s decide together.", "같이 결정해요.", "gachi gyeoljeonghaeyo"], ["conclusion", "We found a good solution.", "좋은 해결책을 찾았어요.", "joeun haegyeolchaegeul chajasseoyo"],
    ])
  );
})(typeof window === "undefined" ? globalThis : window);
