import { getProducts } from "@/db/queries";
import OrderForm from "./OrderForm";

export async function OrderFormServer() {
  const products = await getProducts();
  return <OrderForm products={products} />;
}
