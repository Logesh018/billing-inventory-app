import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../lib/axios';

/**
 * Custom hook for managing product attributes
 * Provides methods to fetch, search, and add new attribute values
 */
export function useAttributes(attributeType) {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all attributes for a specific type
  const loadAttributes = useCallback(async () => {
    if (!attributeType) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data } = await axiosInstance.get(
        `/product-attributes?type=${attributeType}`
      );
      
      setAttributes(data);
      console.log(`✅ Loaded ${data.length} ${attributeType} attributes`);
    } catch (err) {
      console.error(`Error loading ${attributeType} attributes:`, err);
      setError(err.response?.data?.message || 'Failed to load attributes');
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  }, [attributeType]);

  // Search attributes
  const searchAttributes = useCallback(async (searchTerm) => {
    if (!attributeType || !searchTerm || searchTerm.length < 1) {
      return attributes;
    }

    try {
      const { data } = await axiosInstance.get(
        `/product-attributes/search?type=${attributeType}&q=${encodeURIComponent(searchTerm)}`
      );
      
      return data;
    } catch (err) {
      console.error(`Error searching ${attributeType}:`, err);
      // Fallback to local filtering
      return attributes.filter(attr =>
        attr.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }, [attributeType, attributes]);

  // Add new attribute
  const addAttribute = useCallback(async (value) => {
    if (!attributeType || !value || !value.trim()) {
      throw new Error('Attribute type and value are required');
    }

    const trimmedValue = value.trim();

    try {
      setLoading(true);
      setError(null);

      const { data } = await axiosInstance.post('/product-attributes', {
        attributeType,
        value: trimmedValue
      });

      console.log(`✅ Added new ${attributeType}:`, data.attribute.value);

      // Update local state
      setAttributes(prev => [...prev, data.attribute]);

      return data.attribute;
    } catch (err) {
      console.error(`Error adding ${attributeType}:`, err);
      const errorMessage = err.response?.data?.message || 'Failed to add attribute';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [attributeType]);

  // Increment usage count (optional - call when attribute is used)
  const incrementUsage = useCallback(async (attributeId) => {
    if (!attributeId) return;

    try {
      await axiosInstance.post(`/product-attributes/${attributeId}/increment-usage`);
    } catch (err) {
      console.error('Error incrementing usage:', err);
      // Silent fail - not critical
    }
  }, []);

  // Load attributes on mount or when type changes
  useEffect(() => {
    loadAttributes();
  }, [loadAttributes]);

  // Refresh attributes (useful after adding new ones)
  const refresh = useCallback(() => {
    loadAttributes();
  }, [loadAttributes]);

  return {
    attributes,
    loading,
    error,
    searchAttributes,
    addAttribute,
    incrementUsage,
    refresh
  };
}

/**
 * Hook for all attribute types at once
 * Useful for forms that need multiple attribute types
 */
export function useAllAttributes() {
  const categories = useAttributes('category');
  const lists = useAttributes('list');
  const types = useAttributes('type');
  const styles = useAttributes('style');
  const fabrics = useAttributes('fabric');

  const loading = 
    categories.loading || 
    lists.loading || 
    types.loading || 
    styles.loading || 
    fabrics.loading;

  const errors = {
    category: categories.error,
    list: lists.error,
    type: types.error,
    style: styles.error,
    fabric: fabrics.error
  };

  const hasErrors = Object.values(errors).some(err => err !== null);

  const refreshAll = useCallback(() => {
    categories.refresh();
    lists.refresh();
    types.refresh();
    styles.refresh();
    fabrics.refresh();
  }, [categories, lists, types, styles, fabrics]);

  return {
    category: categories,
    list: lists,
    type: types,
    style: styles,
    fabric: fabrics,
    loading,
    errors,
    hasErrors,
    refreshAll
  };
}

/**
 * Hook for getting attribute summary (counts)
 */
export function useAttributesSummary() {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axiosInstance.get('/product-attributes/summary');
      setSummary(data);
      
      console.log('📊 Attributes summary:', data);
    } catch (err) {
      console.error('Error loading attributes summary:', err);
      setError(err.response?.data?.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary
  };
}

/*
 * Utility function to check if a value exists in attributes
 */
export function attributeExists(attributes, value) {
  if (!value || !Array.isArray(attributes)) return false;
  
  return attributes.some(
    attr => attr.value.toLowerCase() === value.toLowerCase()
  );
}

/*
 * Utility function to get attribute by value
 */
export function getAttributeByValue(attributes, value) {
  if (!value || !Array.isArray(attributes)) return null;
  
  return attributes.find(
    attr => attr.value.toLowerCase() === value.toLowerCase()
  );
}