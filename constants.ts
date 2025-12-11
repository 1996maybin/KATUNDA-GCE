import { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  feeSubject: 200, // ECZ Fee per subject
  feeTuition: 200, // Tuition Fee per subject
  feePractical: 100,
  feeCentre: 200,
  feeForm: 50,
  schoolName: "Katunda Secondary School"
};

export const SUBJECTS_LIST = [
  { name: "English Language", isPractical: false },
  { name: "Mathematics", isPractical: false },
  { name: "Civic Education", isPractical: false },
  { name: "Agricultural Science", isPractical: true },
  { name: "Computer Studies", isPractical: true },
  { name: "Geography", isPractical: true },
  { name: "Biology", isPractical: true },
  { name: "Science", isPractical: true },
  { name: "Religious Education 2044", isPractical: false },
  { name: "Religious Education 2046", isPractical: false },
  { name: "Commerce", isPractical: false },
  { name: "Principles of Accounts", isPractical: false },
  { name: "History", isPractical: false },
  { name: "Silozi", isPractical: false },
];

export const DISTRICTS: Record<string, string[]> = {
  "Central": ["Chibombo", "Chisamba", "Chitambo", "Itezhi-Tezhi", "Kabwe", "Kapiri Mposhi", "Luano", "Mkushi", "Mumbwa", "Ngabwe", "Serenje", "Shibuyunji"],
  "Copperbelt": ["Chililabombwe", "Chingola", "Kalulushi", "Kitwe", "Luanshya", "Lufwanyama", "Masaiti", "Mpongwe", "Mufulira", "Ndola"],
  "Eastern": ["Chadiza", "Chama", "Chasefu", "Chipata", "Chipangali", "Kasenengwa", "Katete", "Lumezi", "Lundazi", "Lusangazi", "Mambwe", "Nyimba", "Petauke", "Sinda", "Vubwi"],
  "Luapula": ["Chembe", "Chiengi", "Chifunabuli", "Chipili", "Kawambwa", "Lunga", "Mansa", "Milenge", "Mwansabombwe", "Mwense", "Nchelenge", "Samfya"],
  "Lusaka": ["Chilanga", "Chongwe", "Kafue", "Luangwa", "Lusaka", "Rufunsa"],
  "Muchinga": ["Chinsali", "Isoka", "Kanchibiya", "Lavushimanda", "Mafinga", "Mpika", "Nakonde", "Shiwang'andu"],
  "Northern": ["Chilubi", "Kaputa", "Kasama", "Lunte", "Lupososhi", "Luwingu", "Mbala", "Mporokoso", "Mpulungu", "Mungwi", "Nsama", "Senga Hill"],
  "North-Western": ["Chavuma", "Ikelenge", "Kabompo", "Kalumbila", "Kasempa", "Manyinga", "Mufumbwe", "Mushindamo", "Mwinilunga", "Solwezi", "Zambezi"],
  "Southern": ["Chikankata", "Choma", "Gwembe", "Kalomo", "Kazungula", "Livingstone", "Mazabuka", "Monze", "Namwala", "Pemba", "Sinazongwe", "Zimba"],
  "Western": ["Kalabo", "Kaoma", "Limulunga", "Luampa", "Lukulu", "Mitete", "Mongu", "Mulobezi", "Mwandi", "Nalolo", "Nkeyema", "Senanga", "Sesheke", "Shang'ombo", "Sioma", "Sikongo"]
};