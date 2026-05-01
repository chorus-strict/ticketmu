import pkg from '@prisma/client';
const { PrismaClient, Role, EventStatus, EventVisibility, Membership } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create ADMIN Users
  const adminEmails = ['admin1@gmail.com', 'admin2@gmail.com'];
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admins = [];
  for (const email of adminEmails) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        name: email === 'admin1@gmail.com' ? 'Admin Satu' : 'Admin Dua',
        role: Role.ADMIN,
        membership: Membership.FREE,
        avatar: `https://ui-avatars.com/api/?name=${email === 'admin1@gmail.com' ? 'Admin+Satu' : 'Admin+Dua'}&background=random`,
      },
    });
    admins.push(user);
    console.log(`✅ User ${email} ensured.`);
  }

  // 2. Clear existing events (optional but recommended for clean seed)
  console.log('🧹 Cleaning existing events...');
  await prisma.event.deleteMany({});

  // 3. Create 30 Events
  console.log('🎭 Creating 30 events...');

  const locations = [
    { name: 'Jakarta (GBK)', lat: -6.2185, lng: 106.8018 },
    { name: 'Bandung (Gasibu)', lat: -6.9004, lng: 107.6186 },
    { name: 'Bali (Kuta)', lat: -8.7176, lng: 115.1691 },
    { name: 'Surabaya (Tunjungan)', lat: -7.2575, lng: 112.7521 },
    { name: 'Yogyakarta (Malioboro)', lat: -7.7956, lng: 110.3695 },
    { name: 'Medan (Lap. Merdeka)', lat: 3.5912, lng: 98.6756 },
    { name: 'Makassar (Pantai Losari)', lat: -5.1441, lng: 119.4103 },
    { name: 'Semarang (Simpang Lima)', lat: -6.9926, lng: 110.4229 },
  ];

  const categories = ['Music', 'Tech', 'Art', 'Sports', 'Theater'];

  const eventData = [];

  for (let i = 1; i <= 30; i++) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const admin = admins[Math.floor(Math.random() * admins.length)];
    
    // Spread dates across 2026
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const date = new Date(2026, month, day, 19, 0, 0);

    const price = i % 5 === 0 ? 0 : Math.floor(Math.random() * 1500000) + 50000;
    const capacity = Math.floor(Math.random() * 4950) + 50;
    const status = i % 10 === 0 ? EventStatus.DRAFT : EventStatus.LIVE;
    const visibility = i % 7 === 0 ? EventVisibility.PREMIUM : EventVisibility.PUBLIC;

    const titles = [
      `Grand ${category} 2026`,
      `${category} Masterclass Series`,
      `The Ultimate ${category} Experience`,
      `Annual ${category} Summit`,
      `Digital Innovation ${category}`,
      `Creative ${category} Festival`,
      `Next-Gen ${category} Workshop`,
      `Global ${category} Expo`,
      `Future of ${category} Bandung`,
      `${category} Night Live`,
      `The Sound of ${category}`,
      `${category} Championship 2026`,
      `Modern ${category} Showcase`,
      `Indonesian ${category} Heritage`,
      `Urban ${category} Meetup`,
    ];

    const title = `${titles[i % titles.length]} #${i}`;
    
    const descriptions = [
      "Join us for an unforgettable experience that brings together enthusiasts from all across Indonesia and beyond. This event is designed to challenge your perspective and provide new insights into the industry's latest trends.",
      "Experience the magic of collaboration and creativity at our upcoming gathering. We have curated a lineup of world-class speakers and performers who are ready to share their expertise and passion with our dedicated audience.",
      "Unlock your potential and discover new opportunities at this premium event hosted in one of Indonesia's most iconic locations. Whether you are a professional or a beginner, there is something valuable here for everyone to learn and grow.",
      "A deep dive into the technical and creative aspects of the field, guided by experts with decades of collective experience in the global market. Don't miss this chance to network with like-minded individuals and industry leaders.",
      "Celebrating the rich culture and vibrant energy of the community through a series of interactive sessions, live demonstrations, and networking opportunities that will leave you inspired and ready for the future.",
    ];

    const description = descriptions[i % descriptions.length] + " " + 
                        "This will be a landmark event for the year 2026, featuring state-of-the-art facilities and a comprehensive agenda. Expect top-tier hospitality and an environment conducive to learning and entertainment.";

    eventData.push({
      title,
      description,
      date,
      location: loc.name,
      latitude: loc.lat,
      longitude: loc.lng,
      price,
      capacity,
      image: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=800`,
      category,
      status,
      visibility,
      isFeatured: i <= 5, // First 5 are featured
      authorId: admin.id,
    });
  }

  // Use createMany if supported or loop through
  console.log('📤 Inserting events into database...');
  for (const data of eventData) {
    await prisma.event.create({ data });
  }

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
