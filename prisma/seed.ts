import { PrismaClient, Role, CasteCategory, SchemeOrigin, SchemeCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Yojana Setu database with Government Welfare Schemes...');

  // 1. Seed Demo User & Profile
  const citizenUser = await prisma.user.upsert({
    where: { email: 'citizen@yojanasetu.gov.in' },
    update: {},
    create: {
      id: 'demo-user-citizen-001',
      email: 'citizen@yojanasetu.gov.in',
      phone: '+91-9876543210',
      role: Role.CITIZEN,
      profile: {
        create: {
          state: 'Uttar Pradesh',
          district: 'Varanasi',
          age: 28,
          gender: 'Male',
          occupation: 'Farmer',
          annualIncome: 180000,
          casteCategory: CasteCategory.OBC,
          landHoldingAcres: 1.5,
          isStudent: false,
          isSpeciallyAbled: false,
          isSeniorCitizen: false,
        },
      },
    },
  });

  console.log(`Created Citizen User: ${citizenUser.email}`);

  // 2. Clear existing schemes for clean seed
  await prisma.scheme.deleteMany({});

  // Scheme 1: PM-KISAN Samman Nidhi
  await prisma.scheme.create({
    data: {
      title: 'PM-KISAN Samman Nidhi',
      slug: 'pm-kisan-samman-nidhi',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      department: 'Department of Agriculture & Farmers Welfare',
      description:
        'Financial benefit of ₹6,000 per year in three equal installments transferred directly into bank accounts of small and marginal landholding farmer families.',
      benefitAmountText: '₹6,000 per year (3 installments of ₹2,000)',
      annualValueEstimate: 6000,
      origin: SchemeOrigin.CENTRAL,
      officialUrl: 'https://pmkisan.gov.in/',
      category: SchemeCategory.AGRICULTURE,
      isActive: true,
      eligibilityRules: {
        create: [
          {
            minAge: 18,
            maxIncome: 300000,
            maxLandAcres: 5.0,
            allowedOccupations: ['Farmer', 'Agriculture', 'Cultivator'],
            allowedCategories: ['GENERAL', 'OBC', 'SC', 'ST'],
            allowedGenders: ['ALL'],
          },
        ],
      },
      requiredDocuments: {
        create: [
          { documentName: 'Aadhaar Card', isMandatory: true },
          { documentName: 'Land Khatauni / Ownership Record', isMandatory: true },
          { documentName: 'Bank Account Passbook (Aadhaar Linked)', isMandatory: true },
        ],
      },
    },
  });

  // Scheme 2: PM Awas Yojana (Gramin)
  await prisma.scheme.create({
    data: {
      title: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
      slug: 'pmay-gramin',
      ministry: 'Ministry of Rural Development',
      department: 'Rural Housing Division',
      description:
        'Financial assistance to houseless and citizens living in kutcha or dilapidated houses for construction of pucca house with basic amenities.',
      benefitAmountText: 'Financial grant of ₹1,20,000 to ₹1,30,000',
      annualValueEstimate: 120000,
      origin: SchemeOrigin.CENTRAL,
      officialUrl: 'https://pmayg.nic.in/',
      category: SchemeCategory.HOUSING,
      isActive: true,
      eligibilityRules: {
        create: [
          {
            minAge: 18,
            maxAge: 70,
            maxIncome: 250000,
            allowedCategories: ['GENERAL', 'OBC', 'SC', 'ST'],
            allowedGenders: ['ALL'],
          },
        ],
      },
      requiredDocuments: {
        create: [
          { documentName: 'Aadhaar Card', isMandatory: true },
          { documentName: 'Job Card / MGNREGA Card', isMandatory: false },
          { documentName: 'Income Certificate', isMandatory: true },
        ],
      },
    },
  });

  // Scheme 3: Post-Matric Scholarship for OBC/SC/ST
  await prisma.scheme.create({
    data: {
      title: 'Post-Matric Scholarship for SC/ST/OBC Students',
      slug: 'post-matric-scholarship-up',
      ministry: 'Ministry of Social Justice and Empowerment',
      department: 'Department of Higher Education',
      description:
        'Financial support for higher education fees, maintenance allowances, and tuition fee reimbursement for eligible students.',
      benefitAmountText: 'Up to ₹50,000 per academic year fee reimbursement',
      annualValueEstimate: 50000,
      origin: SchemeOrigin.STATE,
      targetState: 'Uttar Pradesh',
      officialUrl: 'https://scholarship.up.gov.in/',
      category: SchemeCategory.EDUCATION,
      isActive: true,
      eligibilityRules: {
        create: [
          {
            minAge: 15,
            maxAge: 35,
            maxIncome: 250000,
            requiresStudent: true,
            allowedCategories: ['OBC', 'SC', 'ST'],
            allowedGenders: ['ALL'],
          },
        ],
      },
      requiredDocuments: {
        create: [
          { documentName: 'High School Marksheet', isMandatory: true },
          { documentName: 'Caste Certificate', isMandatory: true },
          { documentName: 'Income Certificate (Tehsildar)', isMandatory: true },
          { documentName: 'Fee Receipt / College Bonafide', isMandatory: true },
        ],
      },
    },
  });

  // Scheme 4: Ayushman Bharat - PM-JAY
  await prisma.scheme.create({
    data: {
      title: 'Ayushman Bharat PM-JAY Health Insurance',
      slug: 'ayushman-bharat-pmjay',
      ministry: 'Ministry of Health and Family Welfare',
      department: 'National Health Authority',
      description:
        'Health coverage of ₹5 Lakh per family per year for secondary and tertiary care hospitalization across empanelled public and private hospitals.',
      benefitAmountText: '₹5,00,000 annual health coverage per family',
      annualValueEstimate: 500000,
      origin: SchemeOrigin.CENTRAL,
      officialUrl: 'https://pmjay.gov.in/',
      category: SchemeCategory.HEALTHCARE,
      isActive: true,
      eligibilityRules: {
        create: [
          {
            maxIncome: 250000,
            allowedCategories: ['GENERAL', 'OBC', 'SC', 'ST'],
            allowedGenders: ['ALL'],
          },
        ],
      },
      requiredDocuments: {
        create: [
          { documentName: 'Aadhaar Card', isMandatory: true },
          { documentName: 'Ration Card', isMandatory: true },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
