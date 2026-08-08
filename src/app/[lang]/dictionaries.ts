import { Dictionary } from '@/dictionaries/type';
import 'server-only';

interface LocaleDictionary {
  [x: string]: () => Promise<Dictionary>;
}

const dictionaries: LocaleDictionary = {
  'en-US': async () => {
    const [main, organizations,measurementUnits,currencies,stakeholders,filesShelf,userManagement,productCategories,stores,products] = await Promise.all([
      import('@/dictionaries/en/en.json').then(m => m.default),
      import('@/dictionaries/en/organizations/organizations.json').then(m => m.default),
      import('@/dictionaries/en/measurementUnits/measurementUnits.json').then(m => m.default),
      import('@/dictionaries/en/currencies/currencies.json').then(m => m.default),
      import('@/dictionaries/en/stakeholders/stakeholders.json').then(m => m.default),
      import('@/dictionaries/en/filesShelf/filesShelf.json').then(m => m.default),
      import('@/dictionaries/en/userManagement/userManagement.json').then(m => m.default),
      import('@/dictionaries/en/product/productCategories/productCategories.json').then(m =>m.default),
      import('@/dictionaries/en/product/stores/stores.json').then(m =>m.default),
      import('@/dictionaries/en/product/products.json').then(m =>m.default)
    ]);
    return {
      ...main,
      organizations,
      measurementUnits,
      currencies,
      stakeholders,
      filesShelf,
      userManagement,
      productCategories,
      stores,
      products
      
    };
  },
  'sw-TZ': async () => {
    const [main, organizations,measurementUnits,currencies,stakeholders,filesShelf,userManagement,productCategories,stores,products] = await Promise.all([
      import('@/dictionaries/sw/sw.json').then(m => m.default),
      import('@/dictionaries/sw/organizations/organizations.json').then(m => m.default),
      import('@/dictionaries/sw/measurementUnits/measurementUnits.json').then(m => m.default),
      import('@/dictionaries/sw/currencies/currencies.json').then(m => m.default),
      import('@/dictionaries/sw/stakeholders/stakeholders.json').then(m => m.default),
      import('@/dictionaries/sw/filesShelf/filesShelf.json').then(m => m.default),
      import('@/dictionaries/sw/userManagement/userManagement.json').then(m => m.default),
      import('@/dictionaries/sw/product/productCategories/productCategories.json').then(m =>m.default),
      import('@/dictionaries/sw/product/stores/stores.json').then(m =>m.default),
      import('@/dictionaries/sw/product/products.json').then(m =>m.default)
    ]);
    return {
      ...main,
      organizations,
      measurementUnits,
      currencies,
      stakeholders,
      filesShelf,
      userManagement,
      productCategories,
      stores,
      products
    };
  },

  // 'ar-SA': () =>ww
  //   import('@/dictionaries/ar.json').then((module) => module.default),
  // 'es-ES': () =>
  //   import('@/dictionaries/es.json').then((module) => module.default),
  // 'fr-FR': () =>
  //   import('@/dictionaries/fr.json').then((module) => module.default),
  // 'it-IT': () =>
  //   import('@/dictionaries/it.json').then((module) => module.default),
  // 'zh-CN': () =>
  //   import('@/dictionaries/zh.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  const dictionaryLoader = dictionaries[locale] || dictionaries['en-US'];
  return dictionaryLoader();
};