import { OrderFormServer } from "./components/orderFormServer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-6">
            <img
              src="/LOGO_black.png"
              alt="Shameless Collective"
              className="h-20 sm:h-24 mx-auto"
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
