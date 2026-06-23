import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  ScrollView, 
  TouchableOpacity, 
  useColorScheme, 
  ActivityIndicator, 
  Dimensions, 
  TextInput, 
  Image, 
  RefreshControl,
  Modal,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import Header from '../../layouts/Header';
import NavigationMenu from '../../layouts/nevigationMenu';
// @ts-ignore
import axios from 'axios/dist/axios.js';

const { width: screenWidth } = Dimensions.get('window');

const getResponsiveFontSize = (baseSize: number) => {
  if (screenWidth < 360) {
    return baseSize - 2;
  }
  return baseSize;
};

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

interface ProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

interface ProductAttribute {
  id: number;
  name: string;
  options: string[];
}

interface ProductDimensions {
  length: string;
  width: string;
  height: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  stock_status: string;
  permalink?: string;
  description?: string;
  categories: ProductCategory[];
  images: ProductImage[];
  stock_quantity: number | null;
  manage_stock: boolean;
  weight?: string;
  dimensions?: ProductDimensions;
  average_rating?: string;
  rating_count?: number;
  attributes?: ProductAttribute[];
}

let cachedProducts: Product[] = [];
let fetchPromise: Promise<Product[]> | null = null;

const startPreFetch = (): Promise<Product[]> => {
  if (fetchPromise) return fetchPromise;
  fetchPromise = axios.get('https://n8n.srv917960.hstgr.cloud/webhook/get-products')
    .then((response: any) => {
      cachedProducts = response.data || [];
      return cachedProducts;
    })
    .catch((err: any) => {
      fetchPromise = null;
      throw err;
    });
  return fetchPromise!;
};

// Start fetching immediately on bundle load
startPreFetch().catch(() => {});

export default function ProductPageScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  
  // State for dynamic products initialized from cache
  const [products, setProducts] = useState<Product[]>(cachedProducts);
  const [loading, setLoading] = useState(cachedProducts.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pageLoading, setPageLoading] = useState(false);
  const itemsPerPage = 7;

  // Selected Product details modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Actions menu state (Edit/Delete sheet)
  const [actionsProduct, setActionsProduct] = useState<Product | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Edit form states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editStockQuantity, setEditStockQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete confirmation states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Refs & Animations
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(cachedProducts.length > 0 ? 1 : 0)).current;

  const fetchProducts = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(cachedProducts.length === 0);
      } else {
        setRefreshing(true);
      }
      setError(null);

      let data: Product[];
      if (fetchPromise) {
        data = await fetchPromise;
      } else {
        data = await startPreFetch();
      }
      
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      if (cachedProducts.length === 0) {
        setError('Failed to load products. Check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchPromise = null; // Clear so subsequent refreshes fetch new data
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    if (cachedProducts.length > 0) {
      // Warm cache: fetch fresh updates silently in the background
      fetchProducts(true);
    } else {
      // Cold cache: show visual loader spinner and wait
      fetchProducts(false);
    }
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setPageLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setPageLoading(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 400);
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const closeProductDetails = () => {
    setIsDetailsOpen(false);
    setSelectedProduct(null);
  };

  const handleOpenPermalink = async (url?: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  };

  // Actions menu triggers
  const openActionsMenu = (product: Product) => {
    setActionsProduct(product);
    setIsActionsOpen(true);
  };

  const closeActionsMenu = () => {
    setIsActionsOpen(false);
  };

  const openEditModal = (product: Product) => {
    setActionsProduct(product);
    setEditStockQuantity(product.stock_quantity !== null ? product.stock_quantity.toString() : '0');
    setSaveError(null);
    setSaving(false);
    setIsEditOpen(true);
  };

  const handleActionSelect = (action: 'edit' | 'delete') => {
    if (!actionsProduct) return;
    setIsActionsOpen(false);
    
    if (action === 'edit') {
      openEditModal(actionsProduct);
    } else if (action === 'delete') {
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!actionsProduct) return;

    try {
      setSaving(true);
      setSaveError(null);

      const newQty = editStockQuantity ? parseInt(editStockQuantity, 10) : 0;
      const newStatus = newQty > 0 ? 'instock' : 'outofstock';

      // Build updated product payload matching WooCommerce standard
      const updatedProductPayload = {
        ...actionsProduct,
        stock_quantity: newQty,
        stock_status: newStatus
      };

      // POST to the webhook endpoint
      await axios.post('https://n8n.srv917960.hstgr.cloud/webhook/edit-product', updatedProductPayload);

      // If successful, update local products array and global cache
      const updatedProducts = products.map((p) => {
        if (p.id === actionsProduct.id) {
          return updatedProductPayload;
        }
        return p;
      });
      cachedProducts = updatedProducts;
      setProducts(updatedProducts);
      setIsEditOpen(false);
      setActionsProduct(null);
    } catch (err: any) {
      console.error(err);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!actionsProduct) return;

    const updatedProducts = products.filter(p => p.id !== actionsProduct.id);
    cachedProducts = updatedProducts;
    setProducts(updatedProducts);

    // Repaginate if current page becomes empty
    const newTotalPages = Math.ceil(updatedProducts.length / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }

    setIsDeleteConfirmOpen(false);
    setActionsProduct(null);
  };

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.categories && product.categories.some(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' ||
      (product.categories && product.categories.some(cat => cat.name === selectedCategory));
    return matchesSearch && matchesCategory;
  });

  // Extract list of all unique categories from products
  const categoriesList = ['All', ...Array.from(new Set(
    products.flatMap(p => p.categories ? p.categories.map(c => c.name) : [])
  ))];

  // Paginate list
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (start === 1) {
        end = maxVisible;
      } else if (end === totalPages) {
        start = totalPages - maxVisible + 1;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const getProductAvatar = (product: Product) => {
    if (product.images && product.images.length > 0 && product.images[0].src) {
      return (
        <Image
          source={{ uri: product.images[0].src }}
          style={styles.productImage}
          resizeMode="cover"
        />
      );
    }
    // Fallback brand logo icon
    return (
      <Image
        source={require('@/assets/images/sugarstory-logo.png')}
        style={[styles.productImage, { backgroundColor: '#3D2314', borderRadius: 8 }]}
        resizeMode="contain"
      />
    );
  };

  const stripHtml = (htmlStr?: string) => {
    if (!htmlStr) return '';
    return htmlStr
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={styles.flexWrapper}>
        <Header pageName="Products" onMenuPress={toggleMenu} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Products...</Text>
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchProducts(false)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mainContent}>
            {/* Filter Section */}
            <View style={styles.filterSection}>
              {/* Search input */}
              <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search products or categories..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setCurrentPage(1);
                  }}
                />
              </View>

              {/* Categories scroll selection list */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContainer}
              >
                {categoriesList.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryPill,
                        isActive
                          ? { backgroundColor: '#4F46E5' }
                          : { backgroundColor: colors.backgroundElement }
                      ]}
                      onPress={() => {
                        setSelectedCategory(category);
                        setCurrentPage(1);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          {
                            color: isActive ? '#ffffff' : colors.textSecondary,
                            fontSize: getResponsiveFontSize(12),
                            fontWeight: isActive ? '700' : '600'
                          }
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Stats overview strip */}
              <View style={[styles.statsStrip, { backgroundColor: colors.backgroundElement }]}>
                <View style={styles.statsStripItem}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>{filteredProducts.length}</Text>
                </View>
                <View style={[styles.statsDivider, { backgroundColor: colors.backgroundSelected }]} />
                <View style={styles.statsStripItem}>
                  <Text style={[styles.statsLabel, { color: '#10B981' }]}>In Stock</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>
                    {filteredProducts.filter(p => p.stock_status === 'instock').length}
                  </Text>
                </View>
                <View style={[styles.statsDivider, { backgroundColor: colors.backgroundSelected }]} />
                <View style={styles.statsStripItem}>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Page</Text>
                  <Text style={[styles.statsValue, { color: colors.text }]}>
                    {totalPages > 0 ? `${currentPage}/${totalPages}` : '0/0'}
                  </Text>
                </View>
              </View>
            </View>

            {pageLoading ? (
              <View style={styles.pageLoadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={[styles.pageLoadingText, { color: colors.textSecondary }]}>
                  Loading page {currentPage}...
                </Text>
              </View>
            ) : (
              <Animated.ScrollView
                ref={scrollViewRef}
                style={[styles.scrollView, {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }]}
                contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.four }] as any}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchProducts(true)}
                    colors={['#4F46E5']}
                    tintColor="#4F46E5"
                  />
                }
              >
                {displayedProducts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: getResponsiveFontSize(14) }]}>
                      No products found.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.productList}>
                    {displayedProducts.map((product) => {
                      const isInStock = product.stock_status === 'instock';
                      const statusColor = isInStock ? '#10B981' : '#EF4444';
                      const statusLabel = isInStock ? 'In Stock' : 'Out of Stock';
                      const categoryLabel = product.categories?.[0]?.name || 'Uncategorized';

                      return (
                        <View key={product.id} style={[styles.productCard, { backgroundColor: colors.backgroundElement }]}>
                          {/* Info section - opens details */}
                          <TouchableOpacity 
                            style={styles.productLeftContainer}
                            activeOpacity={0.7}
                            onPress={() => openProductDetails(product)}
                          >
                            {getProductAvatar(product)}
                            <View style={styles.productDetails}>
                              <Text 
                                style={[styles.productName, { color: colors.text, fontSize: getResponsiveFontSize(14) }]} 
                                numberOfLines={2}
                              >
                                {product.name}
                              </Text>
                              <Text style={[styles.productCategory, { color: colors.textSecondary, fontSize: getResponsiveFontSize(11) }]}>
                                {categoryLabel}
                              </Text>
                              <Text style={[styles.productPrice, { color: colors.text, fontSize: getResponsiveFontSize(14) }]}>
                                ₹{product.price || '0'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          
                          {/* Options/Badge section */}
                          <View style={styles.productRightContainer}>
                            <TouchableOpacity 
                              style={styles.threeDotButton}
                              activeOpacity={0.6}
                              onPress={() => openActionsMenu(product)}
                            >
                              <Text style={[styles.threeDotText, { color: colors.textSecondary }]}>⋮</Text>
                            </TouchableOpacity>

                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                              <Text style={[styles.statusText, { color: statusColor, fontSize: getResponsiveFontSize(10) }]}>
                                {statusLabel}
                              </Text>
                            </View>
                            <Text style={[styles.stockText, { color: colors.textSecondary, fontSize: getResponsiveFontSize(10) }]}>
                              {product.manage_stock && product.stock_quantity !== null
                                ? `${product.stock_quantity} left`
                                : 'Available'}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      style={[
                        styles.pageNavButton,
                        { backgroundColor: colors.backgroundElement },
                        currentPage === 1 && styles.pageButtonDisabled
                      ]}
                      disabled={currentPage === 1}
                      onPress={() => handlePageChange(currentPage - 1)}
                    >
                      <Text style={[
                        styles.pageNavButtonText, 
                        { color: currentPage === 1 ? colors.textSecondary : '#4F46E5', fontSize: getResponsiveFontSize(12) }
                      ]}>
                        Prev
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.pageNumbersContainer}>
                      {getPageNumbers().map((num) => {
                        const isActive = num === currentPage;
                        return (
                          <TouchableOpacity
                            key={num}
                            style={[
                              styles.pageNumberCircle,
                              isActive
                                ? { backgroundColor: '#4F46E5' }
                                : { backgroundColor: colors.backgroundElement }
                            ]}
                            onPress={() => handlePageChange(num)}
                          >
                            <Text
                              style={[
                                styles.pageNumberText,
                                { 
                                  color: isActive ? '#ffffff' : colors.text, 
                                  fontSize: getResponsiveFontSize(12),
                                  fontWeight: isActive ? '700' : '500'
                                }
                              ]}
                            >
                              {num}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.pageNavButton,
                        { backgroundColor: colors.backgroundElement },
                        currentPage === totalPages && styles.pageButtonDisabled
                      ]}
                      disabled={currentPage === totalPages}
                      onPress={() => handlePageChange(currentPage + 1)}
                    >
                      <Text style={[
                        styles.pageNavButtonText, 
                        { color: currentPage === totalPages ? colors.textSecondary : '#4F46E5', fontSize: getResponsiveFontSize(12) }
                      ]}>
                        Next
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.ScrollView>
            )}
          </View>
        )}

        {/* Global Navigation Menu */}
        <NavigationMenu isOpen={isMenuOpen} onClose={toggleMenu} />

        {/* Product Details Modal */}
        <Modal
          visible={isDetailsOpen && selectedProduct !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={closeProductDetails}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              {/* Header with Title and Close button */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundSelected }]}>
                <Text style={[styles.modalTitle, { color: colors.text, fontSize: getResponsiveFontSize(16) }]} numberOfLines={1}>
                  Product Details
                </Text>
                <TouchableOpacity onPress={closeProductDetails} style={styles.closeButton}>
                  <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable Detail Body */}
              {selectedProduct && (
                <ScrollView 
                  contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + 24 }]}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Large Hero Image or fallback */}
                  {selectedProduct.images && selectedProduct.images.length > 0 && selectedProduct.images[0].src ? (
                    <Image
                      source={{ uri: selectedProduct.images[0].src }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={require('@/assets/images/sugarstory-logo.png')}
                      style={[styles.modalImage, { backgroundColor: '#3D2314' }]}
                      resizeMode="contain"
                    />
                  )}

                  {/* Info block */}
                  <View style={styles.modalInfoContainer}>
                    {/* Badge line */}
                    <View style={styles.modalBadgeRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: colors.backgroundElement }]}>
                        <Text style={[styles.categoryBadgeText, { color: colors.textSecondary, fontSize: getResponsiveFontSize(10) }]}>
                          {selectedProduct.categories?.[0]?.name || 'Uncategorized'}
                        </Text>
                      </View>
                      
                      {(() => {
                        const isInStock = selectedProduct.stock_status === 'instock';
                        const statusColor = isInStock ? '#10B981' : '#EF4444';
                        const statusLabel = isInStock ? 'In Stock' : 'Out of Stock';
                        return (
                          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                            <Text style={[styles.statusText, { color: statusColor, fontSize: getResponsiveFontSize(10) }]}>
                              {statusLabel}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>

                    {/* Product Name */}
                    <Text style={[styles.modalProductName, { color: colors.text, fontSize: getResponsiveFontSize(20) }]}>
                      {selectedProduct.name}
                    </Text>

                    {/* Prices */}
                    <View style={styles.modalPriceRow}>
                      <Text style={[styles.modalProductPrice, { color: '#4F46E5', fontSize: getResponsiveFontSize(22) }]}>
                        ₹{selectedProduct.price || '0'}
                      </Text>
                      {selectedProduct.regular_price && selectedProduct.regular_price !== selectedProduct.price && (
                        <Text style={[styles.modalProductRegularPrice, { color: colors.textSecondary, fontSize: getResponsiveFontSize(16) }]}>
                          ₹{selectedProduct.regular_price}
                        </Text>
                      )}
                    </View>

                    <View style={[styles.sectionDivider, { backgroundColor: colors.backgroundSelected }]} />

                    {/* WooCommerce Description */}
                    {selectedProduct.description ? (
                      <View style={styles.detailSection}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: getResponsiveFontSize(11) }]}>
                          Description
                        </Text>
                        <Text style={[styles.descriptionText, { color: colors.text, fontSize: getResponsiveFontSize(13) }]}>
                          {stripHtml(selectedProduct.description)}
                        </Text>
                      </View>
                    ) : null}

                    {/* Inventory details */}
                    <View style={[styles.sectionDivider, { backgroundColor: colors.backgroundSelected }]} />
                    <View style={styles.detailSection}>
                      <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: getResponsiveFontSize(11) }]}>
                        Inventory
                      </Text>
                      <Text style={[styles.infoDetailText, { color: colors.text, fontSize: getResponsiveFontSize(13) }]}>
                        Stock Management:{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {selectedProduct.manage_stock ? 'Enabled' : 'Disabled'}
                        </Text>
                      </Text>
                      {selectedProduct.manage_stock && selectedProduct.stock_quantity !== null && (
                        <Text style={[styles.infoDetailText, { color: colors.text, fontSize: getResponsiveFontSize(13) }]}>
                          Units Available:{' '}
                          <Text style={{ fontWeight: '700' }}>{selectedProduct.stock_quantity}</Text>
                        </Text>
                      )}
                    </View>

                    {/* Weight and dimensions if available */}
                    {(selectedProduct.weight || 
                      (selectedProduct.dimensions && (selectedProduct.dimensions.length || selectedProduct.dimensions.width || selectedProduct.dimensions.height)) ||
                      (selectedProduct.attributes && selectedProduct.attributes.length > 0)) ? (
                      <>
                        <View style={[styles.sectionDivider, { backgroundColor: colors.backgroundSelected }]} />
                        <View style={styles.detailSection}>
                          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: getResponsiveFontSize(11) }]}>
                            Specifications
                          </Text>
                          {selectedProduct.weight ? (
                            <Text style={[styles.infoDetailText, { color: colors.text, fontSize: getResponsiveFontSize(13) }]}>
                              Weight:{' '}
                              <Text style={{ fontWeight: '700' }}>{selectedProduct.weight}</Text>
                            </Text>
                          ) : null}
                          {selectedProduct.dimensions && (selectedProduct.dimensions.length || selectedProduct.dimensions.width || selectedProduct.dimensions.height) ? (
                            <Text style={[styles.infoDetailText, { color: colors.text, fontSize: getResponsiveFontSize(13) }]}>
                              Dimensions (L x W x H):{' '}
                              <Text style={{ fontWeight: '700' }}>
                                {selectedProduct.dimensions.length || '-'} x {selectedProduct.dimensions.width || '-'} x {selectedProduct.dimensions.height || '-'}
                              </Text>
                            </Text>
                          ) : null}
                          {selectedProduct.attributes && selectedProduct.attributes.map((attr) => (
                            <View key={attr.name} style={styles.attributeContainer}>
                              <Text style={[styles.infoDetailText, { color: colors.text, fontSize: getResponsiveFontSize(13) }]}>
                                {attr.name}:{' '}
                                <Text style={{ fontWeight: '700' }}>
                                  {attr.options ? attr.options.join(', ') : ''}
                                </Text>
                              </Text>
                            </View>
                          ))}
                        </View>
                      </>
                    ) : null}

                    {/* Ratings */}
                    {selectedProduct.rating_count && selectedProduct.rating_count > 0 ? (
                      <>
                        <View style={[styles.sectionDivider, { backgroundColor: colors.backgroundSelected }]} />
                        <View style={styles.detailSection}>
                          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: getResponsiveFontSize(11) }]}>
                            Rating & Reviews
                          </Text>
                          <Text style={[styles.infoDetailText, { color: colors.text, fontSize: getResponsiveFontSize(13) }]}>
                            Score: <Text style={{ fontWeight: '700' }}>{selectedProduct.average_rating} / 5</Text> ({selectedProduct.rating_count} customer reviews)
                          </Text>
                        </View>
                      </>
                    ) : null}

                    {/* Edit and Delete action buttons row inside details modal */}
                    <View style={styles.modalActionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: '#4F46E5' }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          closeProductDetails();
                          openEditModal(selectedProduct);
                        }}
                      >
                        <Text style={styles.modalActionButtonText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: '#EF4444' }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          closeProductDetails();
                          setActionsProduct(selectedProduct);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <Text style={styles.modalActionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Permlink Launch CTA */}
                    {selectedProduct.permalink ? (
                      <TouchableOpacity
                        style={[styles.webLinkButton, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected, borderWidth: 1 }]}
                        activeOpacity={0.8}
                        onPress={() => handleOpenPermalink(selectedProduct.permalink)}
                      >
                        <Text style={[styles.webLinkButtonText, { color: colors.text }]}>View on Website</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Actions Menu Modal Sheet */}
        <Modal
          visible={isActionsOpen && actionsProduct !== null}
          animationType="fade"
          transparent={true}
          onRequestClose={closeActionsMenu}
        >
          <TouchableOpacity 
            style={styles.actionsOverlay} 
            activeOpacity={1} 
            onPress={closeActionsMenu}
          >
            <View style={[styles.actionsContent, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.actionsTitle, { color: colors.text, fontSize: getResponsiveFontSize(14) }]} numberOfLines={1}>
                {actionsProduct?.name}
              </Text>
              
              <View style={[styles.sectionDivider, { backgroundColor: colors.backgroundSelected }]} />
              
              <TouchableOpacity 
                style={styles.actionsItem} 
                onPress={() => handleActionSelect('edit')}
              >
                <Text style={[styles.actionsItemText, { color: colors.text }]}>Edit Product</Text>
              </TouchableOpacity>
              
              <View style={[styles.sectionDivider, { backgroundColor: colors.backgroundSelected }]} />
              
              <TouchableOpacity 
                style={styles.actionsItem} 
                onPress={() => handleActionSelect('delete')}
              >
                <Text style={[styles.actionsItemText, { color: '#EF4444' }]}>Delete Product</Text>
              </TouchableOpacity>
              
              <View style={[styles.sectionDivider, { backgroundColor: colors.backgroundSelected }]} />
              
              <TouchableOpacity 
                style={[styles.actionsItem, styles.actionsCancel]} 
                onPress={closeActionsMenu}
              >
                <Text style={[styles.actionsItemText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          visible={isEditOpen && actionsProduct !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => !saving && setIsEditOpen(false)}
        >
          <View style={styles.editOverlay}>
            <View style={[styles.editContent, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundSelected }]}>
                <Text style={[styles.modalTitle, { color: colors.text, fontSize: getResponsiveFontSize(16) }]} numberOfLines={1}>
                  Update Stock
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsEditOpen(false)} 
                  style={styles.closeButton}
                  disabled={saving}
                >
                  <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                contentContainerStyle={[styles.editScrollContent, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
              >
                {saveError && (
                  <View style={[styles.errorContainer, { backgroundColor: '#EF4444' + '15' }]}>
                    <Text style={[styles.errorText, { color: '#EF4444', fontSize: getResponsiveFontSize(13) }]}>
                      {saveError}
                    </Text>
                  </View>
                )}

                {/* Product Info Display (Read-Only) */}
                {actionsProduct && (
                  <View style={[styles.readOnlyInfoCard, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={[styles.readOnlyLabel, { color: colors.textSecondary }]}>Product</Text>
                    <Text style={[styles.readOnlyName, { color: colors.text, fontSize: getResponsiveFontSize(15) }]}>
                      {actionsProduct.name}
                    </Text>
                    <View style={styles.readOnlyRow}>
                      <View>
                        <Text style={[styles.readOnlyLabel, { color: colors.textSecondary }]}>Price</Text>
                        <Text style={[styles.readOnlyValue, { color: colors.text, fontSize: getResponsiveFontSize(14) }]}>
                          ₹{actionsProduct.price || '0'}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.readOnlyLabel, { color: colors.textSecondary }]}>Current Stock</Text>
                        <Text style={[styles.readOnlyValue, { color: colors.text, fontSize: getResponsiveFontSize(14) }]}>
                          {actionsProduct.stock_quantity !== null ? `${actionsProduct.stock_quantity} units` : 'Available'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Stock Quantity Input (The ONLY editable field) */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New Stock Count</Text>
                  <TextInput
                    style={[
                      styles.textInput, 
                      { 
                        color: colors.text, 
                        backgroundColor: colors.backgroundElement, 
                        borderColor: colors.backgroundSelected 
                      }
                    ]}
                    value={editStockQuantity}
                    onChangeText={setEditStockQuantity}
                    keyboardType="numeric"
                    placeholder="Enter units count"
                    placeholderTextColor={colors.textSecondary}
                    editable={!saving}
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.saveButton, saving && { opacity: 0.7 }]}
                  activeOpacity={0.8}
                  onPress={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={isDeleteConfirmOpen && actionsProduct !== null}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsDeleteConfirmOpen(false)}
        >
          <View style={styles.confirmOverlay}>
            <View style={[styles.confirmContent, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.confirmTitle, { color: colors.text, fontSize: getResponsiveFontSize(16) }]}>
                Delete Product?
              </Text>
              <Text style={[styles.confirmMessage, { color: colors.textSecondary, fontSize: getResponsiveFontSize(13) }]}>
                Are you sure you want to delete "{actionsProduct?.name}"? This action cannot be undone.
              </Text>
              <View style={styles.confirmButtonsRow}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmButtonCancel, { backgroundColor: colors.backgroundSelected }]}
                  onPress={() => setIsDeleteConfirmOpen(false)}
                >
                  <Text style={[styles.confirmButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmButtonDelete]}
                  onPress={handleDeleteProduct}
                >
                  <Text style={[styles.confirmButtonText, { color: '#ffffff' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flexWrapper: {
    flex: 1,
    position: 'relative',
  },
  mainContent: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  searchContainer: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 14,
    padding: 0,
    fontWeight: '500',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContainer: {
    gap: 8,
    paddingRight: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillText: {
    textAlign: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  statsStripItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statsDivider: {
    width: 1,
    height: 24,
  },
  pageLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  pageLoadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontWeight: '600',
  },
  productList: {
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  productLeftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholderText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 20,
  },
  productDetails: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontWeight: '700',
    lineHeight: 18,
  },
  productCategory: {
    marginTop: 1,
  },
  productPrice: {
    fontWeight: '800',
    color: '#4F46E5',
    marginTop: 2,
  },
  productRightContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontWeight: '700',
  },
  stockText: {
    fontSize: 10,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  pageNavButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNavButtonText: {
    fontWeight: '700',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pageNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberText: {
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImagePlaceholderText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 72,
  },
  modalInfoContainer: {
    gap: 12,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalProductName: {
    fontWeight: '800',
    lineHeight: 24,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalProductPrice: {
    fontWeight: '800',
  },
  modalProductRegularPrice: {
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    width: '100%',
  },
  detailSection: {
    gap: 6,
  },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  descriptionText: {
    lineHeight: 20,
    fontWeight: '500',
  },
  infoDetailText: {
    lineHeight: 18,
    fontWeight: '500',
  },
  attributeContainer: {
    marginTop: 2,
  },
  webLinkButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  webLinkButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Actions sheet styles
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  actionsContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionsTitle: {
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 14,
  },
  actionsItem: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsItemText: {
    fontWeight: '700',
    fontSize: 15,
  },
  actionsCancel: {
    marginTop: 4,
    marginBottom: 8,
  },
  threeDotButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: -4,
  },
  threeDotText: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Edit modal layout styles
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  editScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaInput: {
    height: 100,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusSelectButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSelectButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Confirm delete dialog styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  confirmTitle: {
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmMessage: {
    textAlign: 'center',
    lineHeight: 18,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonCancel: {},
  confirmButtonDelete: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  readOnlyInfoCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 4,
  },
  readOnlyLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readOnlyName: {
    fontWeight: '700',
    lineHeight: 20,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  readOnlyValue: {
    fontWeight: '600',
    marginTop: 2,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
