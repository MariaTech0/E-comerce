import { useCartStore } from '../../store/cartStore';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    toggleCart();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={toggleCart}
      />

      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Carrinho</h2>
          <button
            onClick={toggleCart}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl text-gray-600"></i>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i className="ri-shopping-cart-line text-4xl sm:text-5xl text-gray-400"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Carrinho vazio</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                Adicione alguns ebooks para começar
              </p>
              <button
                onClick={() => {
                  toggleCart();
                  navigate('/catalog');
                }}
                className="px-6 py-3 bg-[#4ECDC4] text-white rounded-lg font-medium hover:bg-[#3db8af] transition-colors cursor-pointer whitespace-nowrap"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="w-16 h-20 sm:w-20 sm:h-28 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.author}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-subtract-line text-gray-600"></i>
                        </button>
                        <span className="text-sm sm:text-base font-medium text-gray-900 w-6 sm:w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-add-line text-gray-600"></i>
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-red-500"></i>
                      </button>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-[#4ECDC4] mt-2">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 sm:p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base sm:text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl sm:text-2xl font-bold text-[#4ECDC4]">
                €{getTotalPrice().toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-[#4ECDC4] to-[#45B8B0] text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
            >
              Finalizar Compra
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              IVA incluído no checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
