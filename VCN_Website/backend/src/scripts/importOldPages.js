const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const initPageModel = require('../models/Page');

const Page = initPageModel(sequelize);

async function importOldPages() {
  await sequelize.sync();

  // Strona główna
  const mainHtml = fs.readFileSync(
    path.join(__dirname, '../../../OLD_SITES_VCN/index.html'),
    'utf8'
  );
  await Page.create({
    slug: '/',
    metaTitle: 'Techniczne systemy zabezpieczenia, rozwiązania softwarowe | VCN',
    metaDescription: '➡️ Oferujemy profesjonalne systemy awizacyjne, przepustkowe oraz zabezpieczenia techniczne, dedykowane oprogramowanie.',
    h1: 'Techniczne systemy zabezpieczenia, rozwiązania softwarowe | VCN',
    content: mainHtml,
    htmlContent: mainHtml,
    isPublished: true,
    version: 1,
  });

  // Kariera
  const karieraHtml = fs.readFileSync(
    path.join(__dirname, '../../../OLD_SITES_VCN/kariera/index.html'),
    'utf8'
  );
  await Page.create({
    slug: '/kariera',
    metaTitle: 'Kariera - VCN',
    metaDescription: 'Kariera w VCN – oferty pracy dla techników i specjalistów. Dołącz do zespołu.',
    h1: 'Kariera - VCN',
    content: karieraHtml,
    htmlContent: karieraHtml,
    isPublished: true,
    version: 1,
  });

  console.log('Import zakończony!');
  process.exit(0);
}

importOldPages();
