import { useState, useEffect } from 'react';
import { getCategoriesApi, getCategoryServicesApi } from '../api/categories';
import type { Category, CategoryWithServices } from '../types/api';

interface UseCategoriesResult {
  categories: Category[];
  selectedCategory: Category | null;
  categoryWithServices: CategoryWithServices | null;
  isLoading: boolean;
  error: string | null;
  selectCategory: (categoryId: number) => Promise<void>;
  resetCategoryFilter: () => Promise<void>;
}

export const useCategories = (): UseCategoriesResult => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryWithServices, setCategoryWithServices] = useState<CategoryWithServices | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getCategoriesApi();
        if (response.success) {
          setCategories(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch categories');
        }
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to fetch categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Select a category and fetch its services
  const selectCategory = async (categoryId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Find category in already loaded categories
      const category = categories.find(c => c.categoryId === categoryId) || null;
      setSelectedCategory(category);
      
      // Fetch services for this category
      const response = await getCategoryServicesApi(categoryId);
      
      if (response.success) {
        setCategoryWithServices(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch category services');
      }
    } catch (err: any) {
      console.error('Error fetching category services:', err);
      setError(err.message || 'Failed to fetch category services');
      setCategoryWithServices(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset category filter
  const resetCategoryFilter = async () => {
    setSelectedCategory(null);
    setCategoryWithServices(null);
    return Promise.resolve();
  };

  return {
    categories,
    selectedCategory,
    categoryWithServices,
    isLoading,
    error,
    selectCategory,
    resetCategoryFilter
  };
};