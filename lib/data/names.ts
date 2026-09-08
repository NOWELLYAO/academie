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
      "TANO", "ZADI", "AMANI", "BOGUI", "DJE",
    ],
    prenomsMasculins: [
      "Jean", "Marc", "Serge", "Yves", "Franck", "Aristide", "Boris",
      "Cyrille", "Didier", "Emmanuel", "Fabrice", "Guillaume", "Hervé",
      "Landry", "Narcisse", "Olivier", "Roger", "Stéphane", "Thierry", "Ulrich",
    ],
    prenomsFeminins: [
      "Aïcha", "Awa", "Fatou", "Mariam", "Adjoua", "Akissi", "Amenan",
      "Affoué", "Ehiva", "Gisèle", "Huguette", "Josiane", "Karine", "Laure",
      "Marina", "Nadège", "Odette", "Prisca", "Rachelle", "Viviane",
    ],
  },
  {
    pays: "Sénégal",
    nomsFamille: [
      "DIOP", "NDIAYE", "FALL", "SARR", "GUEYE", "THIAM", "MBAYE", "SECK",
      "BA", "WADE", "SOW", "KANE", "NIANG", "DIENG", "FAYE", "SY", "GOUDIABY",
      "NDOYE", "DIATTA", "LO",
    ],
    prenomsMasculins: [
      "Mamadou", "Ousmane", "Abdoulaye", "Cheikh", "Ibrahima", "Moussa",
      "Modou", "Serigne", "El Hadji", "Amadou", "Baba", "Souleymane",
      "Alioune", "Pape", "Ndiaga", "Mor", "Assane", "Malick", "Lamine", "Demba",
    ],
    prenomsFeminins: [
      "Aminata", "Fatoumata", "Ndeye", "Bineta", "Coumba", "Khady", "Astou",
      "Mame", "Sokhna", "Aissatou", "Marieme", "Fatim", "Dieynaba", "Rokhaya",
      "Anta", "Yacine", "Ndella", "Absa", "Awa", "Seynabou",
    ],
  },
  {
    pays: "Cameroun",
    nomsFamille: [
      "NGONO", "MBIDA", "ATANGANA", "EYENGA", "ETOUNDI", "FOUDA", "ONANA",
      "TCHOUPO", "NKOLO", "MEKA", "ESSOMBA", "BELLA", "NDONGO", "ABENA",
      "TCHINDA", "NJOYA", "KAMDEM", "FOTSO", "MANGA", "EBALE",
    ],
    prenomsMasculins: [
      "Jean-Paul", "Serge", "Hervé", "Achille", "Blaise", "Cabral",
      "Innocent", "Landry", "Ferdinand", "Marcelin", "Rodrigue", "Ghislain",
      "Merlin", "Junior", "Christian", "Rostand", "Steve", "Yannick", "Franck", "Aurel",
    ],
    prenomsFeminins: [
      "Chantal", "Odile", "Solange", "Brenda", "Larissa", "Rosine", "Sylvie",
      "Carine", "Flore", "Belinda", "Nadège", "Marceline", "Yvette",
      "Perpétue", "Christelle", "Sandra", "Vanessa", "Aurélie", "Danielle", "Gaëlle",
    ],
  },
  {
    pays: "Tchad",
    nomsFamille: [
      "MAHAMAT", "OUSMAN", "ABAKAR", "HASSANE", "ALLARABAYE", "NGARTA",
      "KEBZABO", "SALEH", "ISSAKA", "DJIMET", "NGARLEJY", "YOUSSOUF",
      "TOURA", "MASRA", "BRAHIM", "GOUKOUNI", "HAROUN", "DEUBET", "ALIFEI", "NGOTA",
    ],
    prenomsMasculins: [
      "Mahamat", "Idriss", "Hissein", "Abakar", "Brahim", "Adam",
      "Djibrine", "Youssouf", "Saleh", "Kal", "Djimet", "Ali", "Oumar",
      "Bichara", "Moussa", "Hamid", "Nassour", "Adoum", "Ramat", "Tahir",
    ],
    prenomsFeminins: [
      "Achta", "Fatime", "Hawa", "Zara", "Mariam", "Hadjé", "Kaltouma",
      "Halimé", "Amina", "Ndilbé", "Rahama", "Zénaba", "Djéneba", "Aché",
      "Khadidja", "Néimé", "Absakine", "Fadimé", "Aziza", "Ramla",
    ],
  },
  {
    pays: "Niger",
    nomsFamille: [
      "ISSOUFOU", "MAIGA", "ABDOU", "HAROUNA", "IBRAHIM", "ALI", "GARBA",
      "OUSMANE", "SANI", "IDRISSA", "HAMANI", "BOUBACAR", "ADAMOU",
      "YACOUBA", "SEYDOU", "MOUSTAPHA", "ABDOULKARIM", "ELHADJI", "MAMANE", "ZAKARI",
    ],
    prenomsMasculins: [
      "Ibrahim", "Abdoulkarim", "Mahaman", "Sanoussi", "Rabiou", "Boubacar",
      "Zakari", "Habou", "Amadou", "Illiassou", "Souley", "Garba", "Yahaya",
      "Adamou", "Moutari", "Sahabi", "Aboubacar", "Djibo", "Idi", "Saidou",
    ],
    prenomsFeminins: [
      "Hadiza", "Zeinabou", "Ramatou", "Salamatou", "Aichatou", "Fati",
      "Rabi", "Mariama", "Habsatou", "Balkissa", "Hawaou", "Saoudatou",
      "Nana", "Aïssa", "Rahina", "Bassira", "Djamila", "Maimouna", "Rakia", "Tanimou",
    ],
  },
  {
    pays: "France",
    nomsFamille: [
      "MARTIN", "BERNARD", "DUBOIS", "THOMAS", "ROBERT", "RICHARD",
      "PETIT", "DURAND", "LEROY", "MOREAU", "SIMON", "LAURENT", "LEFEBVRE",
      "MICHEL", "GARCIA", "ROUX", "FOURNIER", "GIRARD", "BONNET", "MERCIER",
    ],
    prenomsMasculins: [
      "Lucas", "Hugo", "Louis", "Gabriel", "Arthur", "Nathan", "Jules",
      "Adam", "Raphaël", "Léo", "Maxime", "Antoine", "Thomas", "Nicolas",
      "Julien", "Baptiste", "Clément", "Victor", "Mathis", "Théo",
    ],
    prenomsFeminins: [
      "Emma", "Jade", "Louise", "Alice", "Chloé", "Lina", "Rose", "Anna",
      "Julia", "Léa", "Manon", "Camille", "Inès", "Sarah", "Charlotte",
      "Margaux", "Juliette", "Pauline", "Zoé", "Clémence",
    ],
  },
  {
    pays: "États-Unis",
    nomsFamille: [
      "SMITH", "JOHNSON", "WILLIAMS", "BROWN", "JONES", "MILLER", "DAVIS",
      "WILSON", "ANDERSON", "TAYLOR", "MOORE", "JACKSON", "MARTIN", "LEE",
      "WALKER", "HALL", "ALLEN", "YOUNG", "KING", "WRIGHT",
    ],
    prenomsMasculins: [
      "James", "Michael", "Ethan", "Daniel", "Matthew", "Andrew", "Joshua",
      "Ryan", "Tyler", "Brandon", "Justin", "Kevin", "Jacob", "Austin",
      "Cody", "Dylan", "Jordan", "Cameron", "Eric", "Brian",
    ],
    prenomsFeminins: [
      "Emily", "Jessica", "Ashley", "Sarah", "Amanda", "Megan", "Hannah",
      "Samantha", "Rachel", "Lauren", "Kayla", "Brittany", "Taylor",
      "Alexis", "Victoria", "Madison", "Olivia", "Chloe", "Grace", "Natalie",
    ],
  },
  {
    pays: "Chine",
    nomsFamille: [
      "WANG", "LI", "ZHANG", "LIU", "CHEN", "YANG", "HUANG", "ZHAO", "WU",
      "ZHOU", "XU", "SUN", "MA", "ZHU", "HU", "GUO", "LIN", "HE", "GAO", "LIANG",
    ],
    prenomsMasculins: [
      "Wei", "Jun", "Ming", "Hao", "Lei", "Qiang", "Tao", "Chao", "Fei",
      "Bo", "Peng", "Kai", "Yong", "Jie", "Feng", "Gang", "Hui", "Long",
      "Yu", "Bin",
    ],
    prenomsFeminins: [
      "Li", "Fang", "Na", "Xia", "Jing", "Mei", "Yan", "Hui", "Ying",
      "Ping", "Xin", "Lan", "Rong", "Ting", "Qing", "Hong", "Juan", "Xue",
      "Yun", "Chun",
    ],
  },
  {
    pays: "Japon",
    nomsFamille: [
      "SATO", "SUZUKI", "TAKAHASHI", "TANAKA", "WATANABE", "ITO",
      "YAMAMOTO", "NAKAMURA", "KOBAYASHI", "SAITO", "KATO", "YOSHIDA",
      "YAMADA", "SASAKI", "YAMAGUCHI", "MATSUMOTO", "INOUE", "KIMURA", "HAYASHI", "SHIMIZU",
    ],
    prenomsMasculins: [
      "Haruto", "Yuto", "Sota", "Yuki", "Riku", "Ren", "Sora", "Kaito",
      "Daiki", "Shota", "Kenji", "Takumi", "Kazuki", "Hiroshi", "Ryo",
      "Naoki", "Tsubasa", "Kenta", "Shun", "Akira",
    ],
    prenomsFeminins: [
      "Yui", "Aoi", "Hina", "Sakura", "Yuna", "Rin", "Mei", "Ichika",
      "Akari", "Kokoro", "Nanami", "Hana", "Yuka", "Miyu", "Aika",
      "Riko", "Yume", "Koharu", "Sana", "Momoka",
    ],
  },
  {
    pays: "Allemagne",
    nomsFamille: [
      "MUELLER", "SCHMIDT", "SCHNEIDER", "FISCHER", "WEBER", "MEYER",
      "WAGNER", "BECKER", "SCHULZ", "HOFFMANN", "SCHAEFER", "KOCH",
      "BAUER", "RICHTER", "KLEIN", "WOLF", "SCHROEDER", "NEUMANN", "SCHWARZ", "ZIMMERMANN",
    ],
    prenomsMasculins: [
      "Maximilian", "Alexander", "Paul", "Leon", "Felix", "Jonas", "Finn",
      "Elias", "Luca", "Noah", "Ben", "Tim", "Moritz", "Julian", "David",
      "Niklas", "Simon", "Lukas", "Jan", "Philipp",
    ],
    prenomsFeminins: [
      "Marie", "Sophie", "Mia", "Emma", "Hannah", "Lea", "Anna", "Laura",
      "Lena", "Johanna", "Klara", "Emilia", "Lisa", "Nele", "Charlotte",
      "Julia", "Sarah", "Nina", "Frieda", "Greta",
    ],
  },
];
