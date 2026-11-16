export const course = {
  title: 'AI yordamida video yaratish',
  intro: 'G‘oyadan tayyor rolikkacha. Kadr yaratish, unga harakat berish va montaj qilishni o‘rganing.',
  supportUsername: '',
  price: '250 000 so‘m',
  programNote: 'Yakuniy dars dasturi keyin e’lon qilinadi.',
  topics: [
    { title: 'G‘oya va kadr', description: 'Rolik g‘oyasini shakllantirish, sahnalarni rejalash va tasvir uchun prompt yozish.' },
    { title: 'Tasvirdan video', description: 'Statik kadrga harakat berish, kamera yo‘nalishini tanlash va uslubni saqlash.' },
    { title: 'Montaj va eksport', description: 'Kadrlarni bog‘lash, ritmni sozlash va tayyor rolikni e’lon qilishga tayyorlash.' },
  ],
  questions: [
    { title: 'Kurs kimlar uchun?', description: 'AI yordamida video tayyorlashni o‘rganmoqchi bo‘lgan ijodkorlar, kontent mualliflari va kichik biznes egalari uchun.' },
    { title: 'Dars dasturi qachon e’lon qilinadi?', description: 'Yakuniy dastur tayyor bo‘lgach, darslar ro‘yxati shu sahifada e’lon qilinadi.' },
    { title: 'Namunalarni qayerda ko‘rish mumkin?', description: 'To‘rt xil uslubdagi kadrlar «Tasvir namunalari» bo‘limida. Qisqa videoni bosh ekrandagi «Demoni ko‘rish» tugmasi ochadi.' },
  ],
};

const supportHandle = course.supportUsername.replace(/^@/, '');
export const supportLink = /^[a-zA-Z0-9_]{5,32}$/.test(supportHandle) ? `https://t.me/${supportHandle}` : '';

export const questions = [
  ...course.questions,
  {
    title: 'Kurs narxi qancha?',
    description: course.price ? `Kurs narxi — ${course.price}.` : 'Yakuniy narx tasdiqlangach, shu sahifada e’lon qilinadi.',
  },
];
