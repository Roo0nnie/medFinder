export const users = [
  {
    id: 1,
    name: "System Admin",
    role: "admin",
    email: "admin@pharma.com",
  },
  {
    id: 2,
    name: "John Owner",
    role: "owner",
    email: "owner@pharma.com",
  },
  {
    id: 3,
    name: "Staff Maria",
    role: "staff",
    email: "staff@pharma.com",
  },
  {
    id: 4,
    name: "Customer Pedro",
    role: "customer",
    email: "customer@gmail.com",
  },
];

export const pharmacies = [
  {
    id: 1,
    ownerId: 2,
    name: "HealthCare Pharmacy",
    location: "Manila",
    rating: 4.5,
    contact: "09123456789",
  },
  {
    id: 2,
    ownerId: 2,
    name: "MedPlus Pharmacy",
    location: "Quezon City",
    rating: 4.2,
    contact: "09987654321",
  },
];

export const products = [
  {
    id: 1,
    pharmacyId: 1,
    name: "Paracetamol",
    price: 10,
    stock: 120,
    soldWeek: 50,
    soldMonth: 210,
  },
  {
    id: 2,
    pharmacyId: 1,
    name: "Amoxicillin",
    price: 25,
    stock: 60,
    soldWeek: 20,
    soldMonth: 95,
  },
];

export const reviews = [
  {
    id: 1,
    pharmacyId: 1,
    customer: "Pedro",
    rating: 5,
    comment: "Very fast service",
  },
  {
    id: 2,
    pharmacyId: 1,
    customer: "Maria",
    rating: 4,
    comment: "Affordable medicines",
  },
];

export const mockAnalytics = {
  monthlySales: [
    { name: "Jan", sales: 4000 },
    { name: "Feb", sales: 3000 },
    { name: "Mar", sales: 5000 },
    { name: "Apr", sales: 4500 },
    { name: "May", sales: 6000 },
    { name: "Jun", sales: 7000 },
  ],
  topProducts: [
    { name: "Paracetamol", value: 400 },
    { name: "Amoxicillin", value: 300 },
    { name: "Ibuprofen", value: 300 },
    { name: "Vitamin C", value: 200 },
  ],
  inventoryTrends: [
    { day: "Mon", stock: 120 },
    { day: "Tue", stock: 115 },
    { day: "Wed", stock: 110 },
    { day: "Thu", stock: 130 },
    { day: "Fri", stock: 125 },
    { day: "Sat", stock: 140 },
    { day: "Sun", stock: 135 },
  ]
};
