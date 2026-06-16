const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const initPageModel = require('../models/Page');
const Page = initPageModel(sequelize);

async function importKariera() {
  await sequelize.sync();

  // Wczytaj cały HTML
  const html = fs.readFileSync(
    path.join(__dirname, '../../../OLD_SITES_VCN/kariera/index.html'),
    'utf8'
  );

  // Wyciągnij <main>...</main>
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const mainContent = mainMatch ? mainMatch[0] : '';

  // Dane meta
  const metaTitle = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || 'Kariera - VCN';
  const metaDescription = (html.match(/<meta name="description" content="(.*?)"/i) || [])[1] || '';
  const h1 = (mainContent.match(/<h1[^>]*>(.*?)<\/h1>/i) || [])[1] || 'Kariera';

  // Upsert (update or insert)
  await Page.upsert({
    slug: 'kariera',
    metaTitle,
    metaDescription,
    h1,
    content: mainContent,
    htmlContent: mainContent,
    isPublished: true,
    version: 1,
  }, { where: { slug: 'kariera' } });

  console.log('Import kariera zakończony!');
  process.exit(0);
}

importKariera();
