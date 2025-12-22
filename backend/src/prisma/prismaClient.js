const { PrismaClient } = require("@prisma/client");
require("dotenv").config(); // loads .env automatically

// Simply create PrismaClient without datasources
const prisma = new PrismaClient();

module.exports = prisma;
