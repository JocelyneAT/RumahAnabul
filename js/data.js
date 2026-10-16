// Fixed lists used by forms and filters. Values are stored in English; labels come from i18n.js.
const AGE_GROUPS = ["puppy", "young", "adult", "senior"];
const SIZES = ["small", "medium", "large"];
const SEXES = ["male", "female"];
const REASONS = ["moving", "financial", "time", "health", "allergy", "landlord", "other"];
const HOME_TYPES = ["house", "apartment", "kos"];
const GOOD_WITH = ["kids", "dogs", "cats"];
const DOG_STATUSES = ["available", "reserved", "adopted"];

const PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Bengkulu",
  "Sumatera Selatan", "Kepulauan Bangka Belitung", "Lampung", "Banten", "DKI Jakarta", "Jawa Barat",
  "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan",
  "Sulawesi Tenggara", "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Barat Daya",
  "Papua Tengah", "Papua Pegunungan", "Papua Selatan",
];

// Example dogs shown in demo mode only. They are not real listings.
const SEED_DOGS = [
  {
    id: "seed-1", owner_id: "seed-owner-1", owner_name: "Rina",
    name: "Bobi", breed: "Anjing kampung", age_group: "young", age_text: "2 tahun", sex: "male", size: "medium",
    province: "DKI Jakarta", city: "Jakarta Selatan", reason: "moving",
    story: "Bobi kami temukan di depan rumah waktu masih kecil. Dia sangat setia, suka jalan pagi, dan sudah bisa duduk dan salaman.\n\nKami sekeluarga pindah ke luar negeri bulan depan dan tidak bisa membawanya. Kami ingin Bobi tinggal di rumah yang punya halaman dan orang yang sering di rumah.",
    vaccinated: true, sterilized: true, good_with: ["kids", "dogs"], photo_url: null, status: "available",
    created_at: "2026-10-12T09:00:00.000Z",
  },
  {
    id: "seed-2", owner_id: "seed-owner-2", owner_name: "Andi",
    name: "Mochi", breed: "Shih Tzu", age_group: "adult", age_text: "5 tahun", sex: "female", size: "small",
    province: "Jawa Barat", city: "Bandung", reason: "financial",
    story: "Mochi anjing yang manja dan tenang, cocok untuk apartemen. Dia suka tidur di pangkuan dan tidak banyak menggonggong.\n\nSaya baru kehilangan pekerjaan dan tidak sanggup lagi membiayai grooming dan dokter hewannya. Berat sekali, tapi saya ingin dia dirawat dengan baik.",
    vaccinated: true, sterilized: true, good_with: ["kids", "cats"], photo_url: null, status: "available",
    created_at: "2026-10-10T09:00:00.000Z",
  },
  {
    id: "seed-3", owner_id: "seed-owner-3", owner_name: "Bu Sari",
    name: "Kopi", breed: "Golden Retriever", age_group: "senior", age_text: "9 tahun", sex: "male", size: "large",
    province: "Jawa Timur", city: "Surabaya", reason: "health",
    story: "Kopi sudah bersama saya sejak kecil. Dia sangat lembut, sabar dengan anak-anak, dan masih suka main bola walaupun sudah tua.\n\nSaya harus menjalani perawatan panjang dan tidak bisa lagi mengajaknya jalan. Saya mencari keluarga yang sabar untuk menemani masa tuanya.",
    vaccinated: true, sterilized: true, good_with: ["kids", "dogs", "cats"], photo_url: null, status: "available",
    created_at: "2026-10-08T09:00:00.000Z",
  },
  {
    id: "seed-4", owner_id: "seed-owner-4", owner_name: "Made",
    name: "Luna", breed: "Siberian Husky", age_group: "young", age_text: "1,5 tahun", sex: "female", size: "large",
    province: "Bali", city: "Denpasar", reason: "time",
    story: "Luna sangat aktif dan pintar. Dia butuh jalan atau lari setiap hari dan ruangan yang sejuk.\n\nJam kerja saya sekarang sampai malam, jadi Luna sering sendirian. Dia butuh pemilik yang aktif dan punya waktu.",
    vaccinated: true, sterilized: false, good_with: ["dogs"], photo_url: null, status: "reserved",
    created_at: "2026-10-05T09:00:00.000Z",
  },
  {
    id: "seed-5", owner_id: "seed-owner-5", owner_name: "Dimas",
    name: "Choco", breed: "Pomeranian", age_group: "adult", age_text: "4 tahun", sex: "male", size: "small",
    province: "DI Yogyakarta", city: "Sleman", reason: "landlord",
    story: "Choco ceria, sudah terlatih buang air di tempatnya, dan suka mainan bunyi.\n\nKos baru saya tidak memperbolehkan hewan peliharaan. Saya ingin Choco tinggal di rumah yang tidak akan memindahkannya lagi.",
    vaccinated: true, sterilized: true, good_with: ["kids"], photo_url: null, status: "available",
    created_at: "2026-10-03T09:00:00.000Z",
  },
  {
    id: "seed-6", owner_id: "seed-owner-6", owner_name: "Kak Tiur",
    name: "Belang", breed: "Anjing kampung", age_group: "puppy", age_text: "4 bulan", sex: "female", size: "medium",
    province: "Sumatera Utara", city: "Medan", reason: "financial",
    story: "Anjing kami melahirkan 5 anak, dan Belang yang terakhir belum dapat rumah. Dia lincah, suka digendong, dan sudah vaksin pertama.\n\nKami tidak sanggup merawat semua anaknya. Kami ingin Belang disteril nanti setelah cukup umur.",
    vaccinated: true, sterilized: false, good_with: ["kids", "dogs", "cats"], photo_url: null, status: "available",
    created_at: "2026-09-29T09:00:00.000Z",
  },
  {
    id: "seed-7", owner_id: "seed-owner-7", owner_name: "Yoga",
    name: "Rex", breed: "German Shepherd", age_group: "adult", age_text: "6 tahun", sex: "male", size: "large",
    province: "Banten", city: "Tangerang Selatan", reason: "moving",
    story: "Rex terlatih, patuh, dan protektif terhadap keluarga. Dia butuh halaman luas dan pemilik yang sudah berpengalaman dengan anjing besar.\n\nSaya pindah tugas ke luar pulau dan tempat tinggal baru terlalu kecil untuknya.",
    vaccinated: true, sterilized: true, good_with: [], photo_url: null, status: "available",
    created_at: "2026-09-25T09:00:00.000Z",
  },
  {
    id: "seed-8", owner_id: "seed-owner-8", owner_name: "Putri",
    name: "Cimol", breed: "Beagle campuran", age_group: "young", age_text: "1 tahun", sex: "female", size: "medium",
    province: "Jawa Tengah", city: "Semarang", reason: "allergy",
    story: "Cimol suka mengendus ke mana-mana dan sangat ramah dengan semua orang. Dia doyan makan, jadi jangan lupa kunci lemari makanan!\n\nAnak saya ternyata alergi berat, jadi dengan sedih kami harus mencarikan rumah baru untuk Cimol.",
    vaccinated: true, sterilized: true, good_with: ["kids", "dogs"], photo_url: null, status: "available",
    created_at: "2026-09-20T09:00:00.000Z",
  },
];
