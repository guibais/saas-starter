import { atom } from "jotai";

// Product filtering atoms
export const searchQueryAtom = atom<string>("");
export const productTypeFilterAtom = atom<string | null>(null);
export const priceRangeAtom = atom<[number, number]>([0, 1000]);
export const sortByAtom = atom<string>("name-asc");
export const availabilityFilterAtom = atom<boolean | null>(true);

// Derived atoms
export const filteredProductsAtom = atom((get) => async (products: any[]) => {
  const searchQuery = get(searchQueryAtom).toLowerCase();
  const productType = get(productTypeFilterAtom);
  const [minPrice, maxPrice] = get(priceRangeAtom);
  const sortBy = get(sortByAtom);
  const availability = get(availabilityFilterAtom);

  // Filter products
  let filtered = products.filter((product) => {
    // Search query filter
    const matchesSearch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery) ||
        (product.description &&
          product.description.toLowerCase().includes(searchQuery))
      : true;

    // Product type filter
    const matchesType = productType
      ? product.productType === productType
      : true;

    // Price range filter
    const matchesPrice =
      Number(product.price) >= minPrice && Number(product.price) <= maxPrice;

    // Availability filter
    const matchesAvailability =
      availability === null ? true : product.isAvailable === availability;

    return matchesSearch && matchesType && matchesPrice && matchesAvailability;
  });

  // Sort products
  switch (sortBy) {
    case "name-asc":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "price-asc":
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "price-desc":
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    default:
      break;
  }

  return filtered;
});

// Reset filters
export const resetFiltersAtom = atom(null, (get, set) => {
  set(searchQueryAtom, "");
  set(productTypeFilterAtom, null);
  set(priceRangeAtom, [0, 1000]);
  set(sortByAtom, "name-asc");
  set(availabilityFilterAtom, true);
});
