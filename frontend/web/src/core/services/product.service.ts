import type { Product, ProductFilters, PaginatedResponse, ProductPublishStatus } from '../models';
import { MOCK_PRODUCTS } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let products = [...MOCK_PRODUCTS];

export const productService = {
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    await delay(400 + Math.random() * 200);
    let result = [...products];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (filters.category) result = result.filter(p => p.category.toLowerCase() === filters.category!.toLowerCase());
    if (filters.brand) result = result.filter(p => p.brand.toLowerCase().includes(filters.brand!.toLowerCase()));
    if (filters.minPrice !== undefined) result = result.filter(p => p.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined) result = result.filter(p => p.price <= filters.maxPrice!);
    if (filters.rating !== undefined) result = result.filter(p => p.rating >= filters.rating!);
    if (filters.availability) result = result.filter(p => p.stock > 0);
    if (filters.partnerId) result = result.filter(p => p.partnerId === filters.partnerId);
    if (filters.campaignId) result = result.filter(p => p.campaignIds.includes(filters.campaignId!));
    if (filters.publishStatus) result = result.filter(p => p.publishStatus === filters.publishStatus);

    // Sort
    switch (filters.sortBy) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'newest': result.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'popular': result.sort((a, b) => b.reviewCount - a.reviewCount); break;
      default: result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 12;
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getProduct(referenceId: string): Promise<Product> {
    await delay(300);
    const product = products.find(p => p.referenceId === referenceId);
    if (!product) throw { code: 404, message: 'Product not found' };
    return product;
  },

  async getPublishedProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    return productService.getProducts({ ...filters, publishStatus: 'PUBLISHED' });
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    await delay(600);
    const product: Product = {
      ...data,
      referenceId: `PRD${Date.now()}`,
      publishStatus: 'DRAFT',
      moderationStatus: 'PENDING',
      campaignIds: [],
      variants: data.variants ?? [],
      media: data.media ?? [],
      tags: data.tags ?? [],
      rating: 0,
      reviewCount: 0,
      isVerifiedPartner: false,
      isBestSeller: false,
      isNewArrival: true,
      versionNo: 1,
      statusCode: 'DRAFT',
      activeCode: 'N',
      rowVersion: 1,
      createdOn: new Date().toISOString(),
      createdBy: 'current_user',
      lastUpdatedOn: new Date().toISOString(),
      lastUpdatedBy: 'current_user',
    } as Product;
    products.push(product);
    return product;
  },

  async submitProduct(referenceId: string): Promise<Product> {
    await delay(800);
    const product = products.find(p => p.referenceId === referenceId);
    if (!product) throw { code: 404, message: 'Product not found' };
    if (product.rowVersion !== product.rowVersion) throw { code: 409, message: 'This product was modified by another user. Please refresh and try again.' };
    product.publishStatus = 'MEDIA_PROCESSING';
    product.lastUpdatedOn = new Date().toISOString();
    product.rowVersion += 1;

    // Simulate async processing pipeline
    setTimeout(() => { product.publishStatus = 'SECURITY_SCAN'; product.lastUpdatedOn = new Date().toISOString(); }, 3000);
    setTimeout(() => { product.publishStatus = 'MODERATION'; product.lastUpdatedOn = new Date().toISOString(); }, 6000);
    setTimeout(() => { product.publishStatus = 'PENDING_APPROVAL'; product.lastUpdatedOn = new Date().toISOString(); }, 9000);

    return product;
  },

  async approveProduct(referenceId: string): Promise<Product> {
    await delay(600);
    const product = products.find(p => p.referenceId === referenceId);
    if (!product) throw { code: 404, message: 'Product not found' };
    product.publishStatus = 'PUBLISHED';
    product.moderationStatus = 'APPROVED';
    product.statusCode = 'ACTIVE';
    product.activeCode = 'Y';
    product.lastUpdatedOn = new Date().toISOString();
    return product;
  },

  async rejectProduct(referenceId: string, reason: string): Promise<Product> {
    await delay(600);
    const product = products.find(p => p.referenceId === referenceId);
    if (!product) throw { code: 404, message: 'Product not found' };
    product.publishStatus = 'REJECTED';
    product.moderationStatus = 'REJECTED';
    product.lastUpdatedOn = new Date().toISOString();
    return product;
  },

  async updateProduct(referenceId: string, data: Partial<Product>): Promise<Product> {
    await delay(500);
    const idx = products.findIndex(p => p.referenceId === referenceId);
    if (idx === -1) throw { code: 404, message: 'Product not found' };
    products[idx] = { ...products[idx], ...data, lastUpdatedOn: new Date().toISOString(), rowVersion: products[idx].rowVersion + 1 };
    return products[idx];
  },

  async getPartnerProducts(partnerId: string): Promise<Product[]> {
    await delay(300);
    return products.filter(p => p.partnerId === partnerId);
  },

  async getFeaturedProducts(): Promise<Product[]> {
    await delay(200);
    return products.filter(p => p.publishStatus === 'PUBLISHED').slice(0, 8);
  },

  async getBestSellers(): Promise<Product[]> {
    await delay(200);
    return products.filter(p => p.publishStatus === 'PUBLISHED' && p.isBestSeller);
  },

  async getNewArrivals(): Promise<Product[]> {
    await delay(200);
    return products.filter(p => p.publishStatus === 'PUBLISHED' && p.isNewArrival);
  },

  getPublishStatusProgress(status: ProductPublishStatus): number {
    const steps: ProductPublishStatus[] = ['DRAFT', 'MEDIA_PROCESSING', 'SECURITY_SCAN', 'MODERATION', 'PENDING_APPROVAL', 'PUBLISHED'];
    const idx = steps.indexOf(status);
    return idx === -1 ? 0 : Math.round((idx / (steps.length - 1)) * 100);
  },
};
