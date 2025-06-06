"use client";

import { useState } from "react";
import { ShopifyProduct, createOrder } from "@/db/queries";
import AddressAutocomplete from "./AddressAutocomplete";

interface OrderFormData {
  address1: string;
  city: string;
  firstName: string;
  lastName: string;
  phone: string;
  zip: string;
  email: string;
  product: string;
  variant: string;
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
    product: "",
    variant: "",
  });
  console.log("Form data:", formData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const orderData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address1: formData.address1,
        city: formData.city,
        zip: formData.zip,
        productId: formData.product,
        variantId: formData.variant,
      };

      await createOrder(orderData);

      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        address1: "",
        city: "",
        firstName: "",
        lastName: "",
        phone: "",
        zip: "",
        email: "",
        product: "",
        variant: "",
      });
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
      // Reset variant when product changes
      ...(name === "product" && { variant: "" }),
    }));
  };

  const handleAddressSelect = (address: {
    street: string;
    city: string;
    zip: string;
  }) => {
    console.log("Selected address:", address);
    // Force immediate state update
    setFormData((prev) => {
      const newData = {
        ...prev,
        address1: address.street,
        city: address.city,
        zip: address.zip,
      };
      console.log("New form data:", newData);
      return newData;
    });
  };

  const selectedProduct = products.find((p) => p.id === formData.product);
  const availableVariants =
    selectedProduct?.variants.edges
      .filter((v) => v.node.inventoryQuantity > 0)
      .map((v) => v.node) || [];

  // Filter products that have at least one variant in stock
  const availableProducts = products.filter(
    (product) =>
      product.variants.edges.some((v) => v.node.inventoryQuantity > 0) &&
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Place Your Order
      </h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          Order created successfully!
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-semibold text-gray-700"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black"
              placeholder="Enter your first name"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="block text-sm font-semibold text-gray-700"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black"
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black"
            placeholder="Enter your email address"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-gray-700"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black"
            placeholder="Enter your phone number"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="address1"
            className="block text-sm font-semibold text-gray-700"
          >
            Street Address
          </label>
          <AddressAutocomplete onAddressSelect={handleAddressSelect} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="city"
              className="block text-sm font-semibold text-gray-700"
            >
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-gray-50"
              placeholder="Will be filled automatically"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="zip"
              className="block text-sm font-semibold text-gray-700"
            >
              ZIP Code
            </label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              required
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black bg-gray-50"
              placeholder="Will be filled automatically"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="product"
            className="block text-sm font-semibold text-gray-700"
          >
            Select Product
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black"
            />
            <select
              id="product"
              name="product"
              value={formData.product}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black mt-2"
            >
              <option value="">Choose a product</option>
              {availableProducts.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                  className="text-black"
                >
                  {product.title}
                </option>
              ))}
            </select>
            {availableProducts.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No products found</p>
            )}
          </div>
        </div>

        {selectedProduct && (
          <div className="space-y-2">
            <label
              htmlFor="variant"
              className="block text-sm font-semibold text-gray-700"
            >
              Select Variant
            </label>
            <select
              id="variant"
              name="variant"
              value={formData.variant}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black"
            >
              <option value="">Choose a variant</option>
              {availableVariants.map((variant) => (
                <option
                  key={variant.id}
                  value={variant.id}
                  className="text-black"
                >
                  {variant.title} - €{variant.price}
                </option>
              ))}
            </select>
            {availableVariants.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No variants available in stock
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            isSubmitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
        >
          {isSubmitting ? "Creating Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}
