"use client";

import { useState } from "react";
import { ShopifyProduct, createOrder } from "@/db/queries";
import AddressAutocomplete from "./AddressAutocomplete";

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  product: ShopifyProduct;
  variant: {
    id: string;
    title: string;
    price: string;
    inventoryQuantity: number;
  };
}

interface OrderFormData {
  address1: string;
  city: string;
  firstName: string;
  lastName: string;
  phone: string;
  zip: string;
  email: string;
}

export default function OrderForm({
  products,
}: {
  products: ShopifyProduct[];
}) {
  const [formData, setFormData] = useState<OrderFormData>({
    address1: "",
    city: "",
    firstName: "",
    lastName: "",
    phone: "",
    zip: "",
    email: "",
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Filter products that have at least one variant in stock
  const availableProducts = products.filter(
    (product) =>
      product.variants.edges.some((v) => v.node.inventoryQuantity > 0) &&
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError("Please add at least one product to your cart");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Create a single order with all cart items
      const orderData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address1: formData.address1,
        city: formData.city,
        zip: formData.zip,
        lineItems: cartItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      await createOrder(orderData);

      setSuccess(true);
      // Reset form and cart after successful submission
      setFormData({
        address1: "",
        city: "",
        firstName: "",
        lastName: "",
        phone: "",
        zip: "",
        email: "",
      });
      setCartItems([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while creating the order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressSelect = (address: {
    street: string;
    city: string;
    zip: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      address1: address.street,
      city: address.city,
      zip: address.zip,
    }));
  };

  const addToCart = (
    product: ShopifyProduct,
    variant: {
      id: string;
      title: string;
      price: string;
      inventoryQuantity: number;
    },
    quantity: number
  ) => {
    // Check if adding this quantity would exceed available stock
    const existingItem = cartItems.find(
      (item) => item.variantId === variant.id
    );
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity + quantity > variant.inventoryQuantity) {
      setError(
        `Cannot add ${quantity} more. Only ${
          variant.inventoryQuantity - currentQuantity
        } available in stock.`
      );
      return;
    }

    const existingItemIndex = cartItems.findIndex(
      (item) => item.variantId === variant.id
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      setCartItems((prev) =>
        prev.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      // Add new item
      setCartItems((prev) => [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          quantity,
          product,
          variant,
        },
      ]);
    }
    setShowProductModal(false);
    setError(null); // Clear any previous errors
  };

  const removeFromCart = (variantId: string) => {
    setCartItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    // Check if the new quantity exceeds available stock
    const item = cartItems.find((item) => item.variantId === variantId);
    if (item && quantity > item.variant.inventoryQuantity) {
      setError(
        `Cannot set quantity to ${quantity}. Only ${item.variant.inventoryQuantity} available in stock.`
      );
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
    setError(null); // Clear any previous errors
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.variant.price) * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Welcome to Teson Pop Up 2025
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Select your products and fill in your details
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 shadow-sm">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 shadow-sm">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Order created successfully! Thank you for your purchase.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Product Selection Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Products
                </h2>
                <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
                  {cartItems.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-gray-600">
                        Cart:
                      </span>
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {getTotalItems()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center text-sm sm:text-base"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="hidden sm:inline">Add Products</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <svg
                    className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <p className="text-gray-500 text-base sm:text-lg">
                    Your cart is empty
                  </p>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Click &quot;Add&quot; to start shopping
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Your Cart
                    </h3>
                    <button
                      onClick={() => setCartItems([])}
                      className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                      Clear Cart
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.variantId}
                        className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg mr-3 sm:mr-4">
                          {item.product.image?.src && (
                            <img
                              src={item.product.image.src}
                              alt={item.product.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                            {item.product.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {item.variant.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm sm:text-lg font-bold text-green-600">
                              €{item.variant.price}
                            </p>
                            {item.quantity >=
                              item.variant.inventoryQuantity && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                Max stock
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 bg-white border border-gray-300 hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors shadow-sm"
                          >
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <span className="w-8 sm:w-12 text-center font-semibold text-sm sm:text-base text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 bg-white border border-gray-300 hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors shadow-sm"
                          >
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeFromCart(item.variantId)}
                            className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors"
                          >
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 sticky top-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">
                    Items ({getTotalItems()})
                  </span>
                  <span className="font-semibold">
                    €{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">€4.00</span>
                </div>
                <div className="border-t pt-3 sm:pt-4">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>€{(getTotalPrice() + 4).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black text-sm sm:text-base"
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black text-sm sm:text-base"
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black text-sm sm:text-base"
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black text-sm sm:text-base"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    Street Address
                  </label>
                  <AddressAutocomplete onAddressSelect={handleAddressSelect} />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      readOnly
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-gray-50 text-sm sm:text-base"
                      placeholder="Auto-filled"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      required
                      readOnly
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-gray-50 text-sm sm:text-base"
                      placeholder="Auto-filled"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-white transition-colors text-sm sm:text-base ${
                    isSubmitting || cartItems.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="text-xs sm:text-sm">
                        Creating Orders...
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm">
                      Place Order - €{(getTotalPrice() + 4).toFixed(2)}
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Product Selection Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Select Products
                  </h2>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 sm:mt-4">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-[60vh] p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg">
                          {product.image?.src && (
                            <img
                              src={product.image.src}
                              alt={product.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                            {product.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                            {product.description}
                          </p>

                          <div className="space-y-1.5 sm:space-y-2">
                            {product.variants.edges
                              .filter((v) => v.node.inventoryQuantity > 0)
                              .map((variant) => {
                                const existingItem = cartItems.find(
                                  (item) => item.variantId === variant.node.id
                                );
                                const currentQuantity = existingItem
                                  ? existingItem.quantity
                                  : 0;
                                const remainingStock =
                                  variant.node.inventoryQuantity -
                                  currentQuantity;

                                return (
                                  <div
                                    key={variant.node.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                                        {variant.node.title}
                                      </p>
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                                        <p className="text-xs sm:text-sm text-gray-600">
                                          Stock:{" "}
                                          {variant.node.inventoryQuantity}
                                        </p>
                                        {currentQuantity > 0 && (
                                          <p className="text-xs sm:text-sm text-blue-600">
                                            In cart: {currentQuantity}
                                          </p>
                                        )}
                                        {remainingStock <= 5 &&
                                          remainingStock > 0 && (
                                            <p className="text-xs sm:text-sm text-orange-600 font-medium">
                                              Only {remainingStock} left!
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-2">
                                      <span className="font-bold text-green-600 text-sm sm:text-base">
                                        €{variant.node.price}
                                      </span>
                                      <button
                                        onClick={() =>
                                          addToCart(product, variant.node, 1)
                                        }
                                        disabled={remainingStock === 0}
                                        className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                                          remainingStock === 0
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                      >
                                        {remainingStock === 0
                                          ? "Out of Stock"
                                          : "Add"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {availableProducts.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-500 text-base sm:text-lg">
                      No products found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
