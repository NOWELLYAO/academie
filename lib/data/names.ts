export interface Origine {
  pays: string;
  nomsFamille: string[];
  prenomsMasculins: string[];
  prenomsFeminins: string[];
}

export const ORIGINES: Origine[] = [
  {
    pays: "Côte d'Ivoire",
    nomsFamille: [
      "KOUASSI", "YAO", "KONE", "TRAORE", "OUATTARA", "BAMBA", "COULIBALY",
      "N'GUESSAN", "ADOU", "AKA", "ASSI", "BLE", "GNAHORE", "KACOU", "KRA",
      "TANO", "ZADI", "AMANI", "BOGUI", "DJE", "KOFFI", "KOUAME", "N'DRI",
      "SORO", "SILUE", "DIABATE", "CISSE", "TOURE", "DIALLO", "FOFANA",
      "GBANE", "GOGO", "BROU", "AHOUA", "DIBI", "GBAGBO", "GUEU", "KOUAKOU",
      "N'ZUE", "SANGARE", "ABLE", "ACKA", "AGNERO", "AGOSSOU", "AHOSSI",
      "AKE", "AKPA", "AMONKOU", "ANOMA", "ASSEMIAN", "ASSOUMOU", "ATSE",
      "BAKAYOKO", "BALLO", "BINATE", "DAGO", "DAO", "DIARRASSOUBA", "DIOMANDE",
      "DJEDJE", "DOUMBIA", "EHOUMAN", "ESSOH", "FADIGA", "GADJI", "GNAMIEN",
      "GOORE", "GORE", "IRIE", "KAMAGATE", "KANGA", "KASSI", "KATA",
      "KEITA", "KIMOU", "KOUAO", "KOUYATE", "LOBA",
      "MAMADOU", "MEITE", "N'DA", "N'GORAN", "OKA", "OULAI", "OUREGA",
      "SAWADOGO", "SEKA", "SIDIBE", "SINDOU", "TAPE", "TIA", "TIEMOKO",
      "TOUNKARA", "VEI", "WATTARA", "YAPI", "YAPO", "ZAGO", "ZAMBLE",
    ],
    prenomsMasculins: [
      "Jean", "Marc", "Serge", "Yves", "Franck", "Aristide", "Boris",
      "Cyrille", "Didier", "Emmanuel", "Fabrice", "Guillaume", "Hervé",
      "Landry", "Narcisse", "Olivier", "Roger", "Stéphane", "Thierry", "Ulrich",
      "Bertin", "Constant", "Désiré", "Elvis", "Ghislain", "Innocent",
      "Kouadio", "Lacina", "Mamadou", "Parfait", "Raymond", "Séraphin",
      "Théodore", "Wilfried", "Zana", "Adama", "Brahima", "Charles", "Daouda",
      "Étienne", "Alassane", "Armand", "Bakary", "Christian", "Clément",
      "David", "Dominique", "Éric", "Gervais", "Hamed", "Ismaël",
      "Jérôme", "Junior", "Kader", "Lassina", "Léon", "Louis", "Magloire",
      "Martial", "Michel", "Moussa", "Ousmane", "Pacôme", "Patrick",
      "Prosper", "Rodrigue", "Salif", "Seydou", "Sidiki", "Sylvain",
      "Timothée", "Vincent", "Wilfrid", "Yacouba", "Zié",
    ],
    prenomsFeminins: [
      "Aïcha", "Awa", "Fatou", "Mariam", "Adjoua", "Akissi", "Amenan",
      "Affoué", "Ehiva", "Gisèle", "Huguette", "Josiane", "Karine", "Laure",
      "Marina", "Nadège", "Odette", "Prisca", "Rachelle", "Viviane",
      "Aminata", "Bintou", "Christelle", "Delphine", "Édwige", "Félicité",
      "Georgette", "Henriette", "Irène", "Josée", "Kadiatou", "Lucie",
      "Mariame", "Natacha", "Oumou", "Patricia", "Reine", "Solange",
      "Tenin", "Yvonne", "Aya", "Bienvenue", "Carine", "Djénéba", "Estelle",
      "Fanta", "Grâce", "Hortense", "Ines", "Judith", "Kady", "Larissa",
      "Maimouna", "Nafissatou", "Olga", "Pauline", "Ramata", "Sarah",
      "Ursule", "Valérie", "Wassa", "Yolande", "Zeinabou",
      "Adèle", "Béatrice", "Christiane", "Denise", "Emma", "Florence",
      "Germaine", "Hawa", "Ida", "Jacqueline",
    ],
  },
  {
    pays: "Sénégal",
    nomsFamille: [
      "DIOP", "NDIAYE", "FALL", "SARR", "GUEYE", "THIAM", "MBAYE", "SECK",
      "DIALLO", "BA", "NIANG", "CISSE", "SOW", "FAYE", "DIENG", "SY",
      "SAMB", "NDOUR", "KANE", "LO", "GOMIS", "MENDY", "CAMARA", "DIATTA",
      "BODIAN", "SONKO", "TOURE", "BARRY", "SAKHO", "DIAGNE",
    ],
    prenomsMasculins: [
      "Abdou", "Moussa", "Ibrahima", "Cheikh", "Ousmane", "Modou", "Baba",
      "Mamadou", "Assane", "Babacar", "Malick", "Lamine",
      "Seydina", "Pape", "Serigne", "Amadou", "Souleymane", "Alioune",
      "Thierno", "Demba", "Youssou", "Ismaïla", "Tapha", "Mor",
    ],
    prenomsFeminins: [
      "Fatou", "Aminata", "Aïssatou", "Ndeye", "Awa", "Khady", "Sokhna",
      "Astou", "Bineta", "Coumba", "Dieynaba", "Marème", "Nafi", "Oumou",
      "Rokhaya", "Seynabou", "Yacine", "Adama", "Fatoumata", "Mame",
      "Absa", "Anta", "Dior", "Penda", "Ramatoulaye",
    ],
  },
  {
    pays: "Cameroun",
    nomsFamille: [
      "MBALLA", "NGOUO", "FOTSO", "TCHOUMI", "NDONGO", "ABENA", "ETOUNDI",
      "KAMDEM", "TALLA", "NANA", "MVONDO", "BELLO", "NJIKE", "ONANA",
      "ESSOMBA", "TAMO", "FOUDA", "EYENGA", "MENYE", "AWONO", "BIYA",
      "NKOMO", "OWONA", "SIMO", "TCHIO", "ZE",
    ],
    prenomsMasculins: [
      "Junior", "Franck", "Yannick", "Aristide", "Bertrand", "Christian",
      "Désiré", "Éric", "Ferdinand", "Guy", "Hervé", "Innocent", "Jules",
      "Landry", "Martial", "Noël", "Olivier", "Patrice", "Rodrigue",
      "Serge", "Thierry", "Valéry", "Willy", "Achille", "Blaise",
    ],
    prenomsFeminins: [
      "Épiphanie", "Larissa", "Chantal", "Delphine", "Estelle", "Florence",
      "Gisèle", "Huguette", "Irène", "Judith", "Léa", "Marlène", "Nadège",
      "Odile", "Priscille", "Raïssa", "Sandrine", "Thérèse", "Valentine",
      "Yvette", "Astrid", "Béatrice", "Clarisse", "Danielle", "Édith",
    ],
  },
  {
    pays: "Tchad",
    nomsFamille: [
      "MAHAMAT", "OUSMAN", "HASSAN", "ABAKAR", "MOUSSA", "ISSA",
      "ADAM", "BRAHIM", "SALEH", "YOUSSOUF", "IBRAHIM", "AHMAT", "KHAMIS",
      "DJIMET", "NGARTA", "ALLAMINE", "MASRA", "TOM", "NGAKOUTOU",
    ],
    prenomsMasculins: [
      "Idriss", "Mahamat", "Hassan", "Ousman", "Adam", "Brahim", "Saleh",
      "Youssouf", "Ahmat", "Khamis", "Djimet", "Ngarta", "Allamine",
      "Ali", "Moussa", "Issa", "Ibrahim", "Abdoulaye", "Souleymane",
    ],
    prenomsFeminins: [
      "Amina", "Zara", "Halimé", "Fatimé", "Achta", "Kaltouma", "Hawa",
      "Khadidja", "Mariam", "Zeinab", "Aché", "Djamila", "Nadjima",
      "Rahama", "Souad", "Hindou", "Mounira", "Yasmine",
    ],
  },
  {
    pays: "Niger",
    nomsFamille: [
      "ISSOUFOU", "MAIGA", "HAROUNA", "MOUSSA", "ABDOU", "SANI",
      "ALKASSOUM", "ADAMOU", "OUMAROU", "GARBA", "ZAKARI", "ABDOULAYE",
      "SOULEY", "HAMANI", "ILLIASSOU", "BOUBACAR", "YACOUBA",
    ],
    prenomsMasculins: [
      "Ibrahim", "Boubacar", "Moussa", "Abdou", "Sani", "Adamou",
      "Oumarou", "Garba", "Zakari", "Abdoulaye", "Souley", "Hamani",
      "Illiassou", "Yacouba", "Harouna", "Aboubacar", "Idi", "Laouali",
    ],
    prenomsFeminins: [
      "Hadiza", "Ramatou", "Zeinabou", "Aïchatou", "Maimouna", "Rabi",
      "Salamatou", "Binta", "Halima", "Ramatoulaye", "Fati", "Mariama",
      "Nana", "Rakia", "Saratou", "Zara",
    ],
  },
  {
    pays: "France",
    nomsFamille: [
      "MARTIN", "BERNARD", "DUBOIS", "THOMAS", "ROBERT", "PETIT",
      "DURAND", "LEROY", "MOREAU", "SIMON", "LAURENT", "LEFEBVRE",
      "MICHEL", "GARCIA", "DAVID", "BERTRAND", "ROUX", "VINCENT",
      "FOURNIER", "MOREL", "GIRARD", "ANDRE", "MERCIER", "DUPONT",
      "LAMBERT", "BONNET", "FRANCOIS", "MARTINEZ", "LEGRAND", "GARNIER",
    ],
    prenomsMasculins: [
      "Lucas", "Hugo", "Louis", "Gabriel", "Arthur", "Jules", "Adam",
      "Raphaël", "Léo", "Maxime", "Antoine", "Nicolas", "Julien",
      "Baptiste", "Mathis", "Nathan", "Théo", "Alexandre", "Simon",
      "Clément", "Étienne", "Victor", "Paul", "Pierre",
    ],
    prenomsFeminins: [
      "Emma", "Léa", "Chloé", "Manon", "Camille", "Sarah", "Julie",
      "Charlotte", "Alice", "Clara", "Louise", "Zoé", "Juliette", "Inès",
      "Margaux", "Pauline", "Élise", "Anaïs", "Marion", "Océane",
      "Amandine", "Céline", "Laura", "Mathilde",
    ],
  },
  {
    pays: "États-Unis",
    nomsFamille: [
      "SMITH", "JOHNSON", "WILLIAMS", "BROWN", "JONES", "MILLER",
      "DAVIS", "GARCIA", "WILSON", "TAYLOR", "MOORE", "JACKSON",
      "MARTIN", "LEE", "THOMPSON", "WHITE", "HARRIS", "CLARK",
      "LEWIS", "WALKER", "YOUNG", "ALLEN", "KING", "WRIGHT",
    ],
    prenomsMasculins: [
      "James", "Michael", "Robert", "David", "William", "Joseph",
      "Daniel", "Matthew", "Andrew", "Joshua", "Ryan", "Justin",
      "Brandon", "Tyler", "Kevin", "Jason", "Brian", "Ethan",
      "Christopher", "Anthony",
    ],
    prenomsFeminins: [
      "Emily", "Jessica", "Ashley", "Amanda", "Sarah", "Jennifer",
      "Elizabeth", "Megan", "Stephanie", "Nicole", "Rachel", "Lauren",
      "Hannah", "Samantha", "Victoria", "Olivia", "Grace", "Natalie",
      "Kayla", "Alyssa",
    ],
  },
  {
    pays: "Chine",
    nomsFamille: [
      "WANG", "LI", "ZHANG", "LIU", "CHEN", "YANG", "HUANG", "ZHAO",
      "WU", "ZHOU", "XU", "SUN", "MA", "ZHU", "HU", "GUO", "LIN", "HE",
      "GAO", "LIANG",
    ],
    prenomsMasculins: [
      "Wei", "Jian", "Ming", "Hao", "Lei", "Qiang", "Jun", "Yang",
      "Feng", "Bo", "Peng", "Kai", "Tao", "Chao", "Chen", "Xin",
    ],
    prenomsFeminins: [
      "Mei", "Xia", "Yan", "Li", "Fang", "Juan", "Na", "Jing", "Hui",
      "Lin", "Xin", "Ying", "Yun", "Qing", "Ling", "Rui",
    ],
  },
  {
    pays: "Japon",
    nomsFamille: [
      "SATO", "SUZUKI", "TAKAHASHI", "TANAKA", "WATANABE", "ITO",
      "YAMAMOTO", "NAKAMURA", "KOBAYASHI", "KATO", "YOSHIDA", "YAMADA",
      "SASAKI", "YAMAGUCHI", "SAITO", "MATSUMOTO", "INOUE", "KIMURA",
      "HAYASHI", "SHIMIZU",
    ],
    prenomsMasculins: [
      "Haruto", "Yuto", "Sota", "Yuki", "Haruki", "Sora", "Ren", "Riku",
      "Kaito", "Itsuki", "Kenji", "Takumi", "Daiki", "Hiroto", "Ryo",
      "Shun",
    ],
    prenomsFeminins: [
      "Yui", "Aoi", "Yuna", "Hina", "Akari", "Kokoro", "Rin", "Mio",
      "Sakura", "Koharu", "Ichika", "Yuka", "Nanami", "Haruka",
      "Ayaka", "Miyu",
    ],
  },
  {
    pays: "Allemagne",
    nomsFamille: [
      "MÜLLER", "SCHMIDT", "SCHNEIDER", "FISCHER", "WEBER", "MEYER",
      "WAGNER", "BECKER", "SCHULZ", "HOFFMANN", "SCHÄFER", "KOCH",
      "BAUER", "RICHTER", "KLEIN", "WOLF", "SCHRÖDER", "NEUMANN",
      "ZIMMERMANN", "BRAUN",
    ],
    prenomsMasculins: [
      "Maximilian", "Alexander", "Paul", "Leon", "Felix", "Jonas",
      "Lukas", "David", "Tim", "Julian", "Niklas", "Moritz", "Elias",
      "Simon", "Jan", "Philipp",
    ],
    prenomsFeminins: [
      "Emma", "Mia", "Hannah", "Emilia", "Sophia", "Lena", "Anna",
      "Laura", "Lea", "Marie", "Johanna", "Nele", "Clara", "Frieda",
      "Ida", "Greta",
    ],
  },
];
