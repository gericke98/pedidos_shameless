"use server";

const createSession = (): RequestInit => {
  if (
    !process.env.NEXT_PUBLIC_ACCESS_TOKEN ||
    !process.env.NEXT_PUBLIC_SHOP_URL
  ) {
    throw new Error("Missing Shopify access token or shop URL");
  }

  return {
    headers: {
      "X-Shopify-Access-Token": process.env.NEXT_PUBLIC_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
  };
};

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: {
    edges: Array<{
      node: {
        url: string;
        src: string;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        price: string;
        title: string;
        inventoryQuantity: number;
      };
    }>;
  };
  image?: {
    src: string;
  };
}

export async function getProducts() {
  const session = createSession();
  const shopifyGraphQLUrl = `${process.env.NEXT_PUBLIC_SHOP_URL}/admin/api/graphql.json`;

  const query = `
      query getProducts {
        products(first: 250, query: "status:ACTIVE") {
          edges {
            node {
              id
              title
              handle
              description
              images(first: 1) {
                edges {
                  node {
                    url
                    src: url
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    price
                    title
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `;

  try {
    const response = await fetch(shopifyGraphQLUrl, {
      method: "POST",
      headers: session.headers,
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error("GraphQL Errors:", errors);
      throw new Error("GraphQL query failed");
    }

    // Transform the response to include image.src for each product
    const products = data.products.edges.map(
      ({ node: product }: { node: ShopifyProduct }) => {
        if (product.images.edges.length > 0) {
          product.image = {
            src: product.images.edges[0].node.src,
          };
        } else {
          product.image = {
            src: "", // Provide a default empty string if no image exists
          };
        }
        return product;
      }
    );

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}
const SPANISH_PROVINCE_CODES: { [key: string]: string } = {
  Álava: "VI",
  Albacete: "AB",
  Alicante: "A",
  Almería: "AL",
  Asturias: "O",
  Ávila: "AV",
  Badajoz: "BA",
  Barcelona: "B",
  Burgos: "BU",
  Cáceres: "CC",
  Cádiz: "CA",
  Cantabria: "S",
  Castellón: "CS",
  "Ciudad Real": "CR",
  Córdoba: "CO",
  "La Coruña": "C",
  Cuenca: "CU",
  Gerona: "GI",
  Granada: "GR",
  Guadalajara: "GU",
  Guipúzcoa: "SS",
  Huelva: "H",
  Huesca: "HU",
  "Islas Baleares": "PM",
  Jaén: "J",
  León: "LE",
  Lérida: "L",
  Lugo: "LU",
  Madrid: "M",
  Málaga: "MA",
  Murcia: "MU",
  Navarra: "NA",
  Orense: "OR",
  Palencia: "P",
  "Las Palmas": "GC",
  Pontevedra: "PO",
  "La Rioja": "LO",
  Salamanca: "SA",
  "Santa Cruz de Tenerife": "TF",
  Segovia: "SG",
  Sevilla: "SE",
  Soria: "SO",
  Tarragona: "T",
  Teruel: "TE",
  Toledo: "TO",
  Valencia: "V",
  Valladolid: "VA",
  Vizcaya: "BI",
  Zamora: "ZA",
  Zaragoza: "Z",
};

function getProvinceCode(provinceName: string): string {
  // Normalize the province name by removing accents and converting to uppercase
  const normalizedName = provinceName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  // Find the matching province code
  for (const [name, code] of Object.entries(SPANISH_PROVINCE_CODES)) {
    if (
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase() === normalizedName
    ) {
      return code;
    }
  }

  // If no match found, return the original province name
  return provinceName;
}

interface OrderInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  zip: string;
  productId: string;
  variantId: string;
}

export async function createOrder(orderData: OrderInput) {
  const session = createSession();
  const shopifyGraphQLUrl = `${process.env.NEXT_PUBLIC_SHOP_URL}/admin/api/2025-01/graphql.json`;
  // Get province code from the province field if available, otherwise try to derive it from city
  const provinceCode = getProvinceCode(orderData.city);
  const query = `
    mutation OrderCreate(
      $options: OrderCreateOptionsInput, 
      $order: OrderCreateOrderInput!
    ) {
      orderCreate(options: $options, order: $order) {
        order {
          id
          name
          email
          createdAt
          shippingAddress {
            address1
            address2
            city
            countryCode
            firstName
            lastName
            phone
            provinceCode
            zip
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    options: {
      inventoryBehaviour: "DECREMENT_OBEYING_POLICY",
      sendFulfillmentReceipt: true,
      sendReceipt: true,
    },
    order: {
      billingAddress: {
        address1: orderData.address1,
        address2: "",
        city: orderData.city,
        countryCode: "ES",
        firstName: orderData.firstName || "Return",
        lastName: orderData.lastName || "Return",
        phone: orderData.phone || "+34608667749",
        provinceCode: provinceCode,
        zip: orderData.zip,
      },
      buyerAcceptsMarketing: true,
      currency: "EUR",
      email: orderData.email,
      financialStatus: "PAID",
      lineItems: [
        {
          variantId: orderData.variantId,
          quantity: 1,
          requiresShipping: true,
        },
      ],
      note: `Pedido Pop Up`,
      shippingAddress: {
        address1: orderData.address1,
        address2: "",
        city: orderData.city,
        countryCode: "ES",
        firstName: orderData.firstName || "Return",
        lastName: orderData.lastName || "Return",
        phone: orderData.phone || "+34608667749",
        provinceCode: provinceCode,
        zip: orderData.zip,
      },
      shippingLines: [
        {
          priceSet: {
            shopMoney: {
              amount: "4.00",
              currencyCode: "EUR",
            },
          },
          title: "Estándar",
        },
      ],
      tags: ["Pop Up"],
      taxesIncluded: true,
      test: false,
      transactions: [
        {
          amountSet: {
            shopMoney: {
              amount: "0.01",
              currencyCode: "EUR",
            },
          },
          kind: "SALE",
          gateway: "manual",
          status: "SUCCESS",
        },
      ],
    },
  };

  try {
    const response = await fetch(shopifyGraphQLUrl, {
      method: "POST",
      headers: session.headers,
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    // Enhanced error logging
    if (data.errors || data.data?.orderCreate?.userErrors?.length > 0) {
      console.error("Order creation failed:", {
        errors: data.errors,
        userErrors: data.data?.orderCreate?.userErrors,
        input: {
          city: orderData.city,
          province: orderData.city,
          provinceCode,
          address: orderData.address1,
        },
      });
    }

    // Defensive check: ensure the structure is as expected.
    const orderResponse = data?.data?.orderCreate;
    if (!orderResponse) {
      console.error("No orderCreate found in response:", data);
      return { success: false, error: "Missing orderCreate field" };
    }

    // Optionally, check for userErrors.
    if (orderResponse.userErrors && orderResponse.userErrors.length > 0) {
      console.error("User errors:", orderResponse.userErrors);
      return { success: false, error: orderResponse.userErrors };
    }

    // Ensure order exists.
    const createdOrder = orderResponse.order;
    if (!createdOrder) {
      console.error("Order not found in response:", data);
      return { success: false, error: "Order not found in response" };
    }
    return { success: true, data: createdOrder };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}
