import Image from "next/image";
import { OrderFormServer } from "./components/orderFormServer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-6">
            <Image
              src="/LOGO_black.png"
              alt="Shameless Collective"
              width={240}
              height={96}
              className="h-20 sm:h-24 mx-auto"
              priority
            />
          </div>
          <p className="text-lg text-gray-600">
            Complete your order details below
          </p>
        </div>
        <OrderFormServer />
      </div>
    </div>
  );
}
