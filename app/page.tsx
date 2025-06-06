import { OrderFormServer } from "./components/orderFormServer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Shameless Collective!
          </h1>
          <p className="text-lg text-gray-600">
            Complete your order details below
          </p>
        </div>
        <OrderFormServer />
      </div>
    </div>
  );
}
